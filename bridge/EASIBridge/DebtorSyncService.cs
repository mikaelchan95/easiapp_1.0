using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Pulls debtors from AutoCount and upserts them as companies in Supabase.
    /// One-way read: AutoCount -> Supabase. No posting back.
    /// </summary>
    public static class DebtorSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== Debtor sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("Debtor sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("Debtor sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "debtor_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable debtors = AutoCountConnector.QueryAllDebtors();
                if (debtors == null || debtors.Rows.Count == 0)
                {
                    BridgeLogger.Warn("Debtor sync: no debtors returned from AutoCount.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                int total = debtors.Rows.Count;
                int synced = 0;
                int failed = 0;

                BridgeLogger.Info(string.Format("Debtor sync: processing {0} debtors...", total));

                foreach (DataRow row in debtors.Rows)
                {
                    string accNo = SyncHelper.SafeStr(row, "AccNo");
                    if (string.IsNullOrEmpty(accNo))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string companyJson = MapDebtorToCompany(row);
                        supa.Insert("companies", companyJson, upsert: true,
                            onConflict: "autocount_debtor_code");
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "Debtor sync failed for {0}: {1}", accNo, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "debtor", accNo, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "Debtor sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Debtor sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Debtor sync finished ===");
        }

        private static string MapDebtorToCompany(DataRow row)
        {
            string accNo = SyncHelper.SafeStr(row, "AccNo");
            string companyName = SyncHelper.SafeStr(row, "CompanyName");
            string address = BuildAddress(row);
            string phone = SyncHelper.FirstNonEmpty(row, "Phone1", "Phone2", "TelNo", "Telephone");
            string email = SyncHelper.FirstNonEmpty(row, "EmailAddress", "Email");

            decimal creditLimit = SyncHelper.SafeDec(row, "CreditLimit");
            string creditTerm = SyncHelper.FirstNonEmpty(row, "DisplayTerm", "CreditTerm", "PaymentTerm");
            bool isActive = SyncHelper.SafeBool(row, "IsActive");

            string paymentTerms = MapCreditTerm(creditTerm);
            string status = isActive ? "active" : "suspended";
            string uen = "AC-" + accNo;

            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"autocount_debtor_code\":{0}", SyncHelper.JsonStr(accNo));
            sb.AppendFormat(",\"name\":{0}", SyncHelper.JsonStr(companyName));
            sb.AppendFormat(",\"company_name\":{0}", SyncHelper.JsonStr(companyName));
            sb.AppendFormat(",\"uen\":{0}", SyncHelper.JsonStr(uen));
            sb.AppendFormat(",\"address\":{0}", SyncHelper.JsonStr(address));
            if (!string.IsNullOrEmpty(phone))
                sb.AppendFormat(",\"phone\":{0}", SyncHelper.JsonStr(phone));
            if (!string.IsNullOrEmpty(email))
                sb.AppendFormat(",\"email\":{0}", SyncHelper.JsonStr(email));
            sb.AppendFormat(",\"credit_limit\":{0}", creditLimit);
            sb.AppendFormat(",\"payment_terms\":{0}", SyncHelper.JsonStr(paymentTerms));
            sb.AppendFormat(",\"status\":{0}", SyncHelper.JsonStr(status));
            sb.Append("}");

            return sb.ToString();
        }

        private static string BuildAddress(DataRow row)
        {
            var parts = new string[]
            {
                SyncHelper.SafeStr(row, "Address1"),
                SyncHelper.SafeStr(row, "Address2"),
                SyncHelper.SafeStr(row, "Address3"),
                SyncHelper.SafeStr(row, "Address4")
            };

            var sb = new StringBuilder();
            foreach (string p in parts)
            {
                if (!string.IsNullOrEmpty(p))
                {
                    if (sb.Length > 0) sb.Append(", ");
                    sb.Append(p.Trim());
                }
            }
            return sb.Length > 0 ? sb.ToString() : "N/A";
        }

        private static string MapCreditTerm(string acTerm)
        {
            if (string.IsNullOrEmpty(acTerm)) return "COD";
            string upper = acTerm.Trim().ToUpper();
            if (upper == "COD" || upper == "C.O.D" || upper == "CASH") return "COD";
            if (upper.Contains("7")) return "NET7";
            if (upper.Contains("30")) return "NET30";
            if (upper.Contains("60")) return "NET60";
            return "COD";
        }
    }
}
