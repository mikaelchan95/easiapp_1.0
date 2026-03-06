using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount Creditor table to Supabase ac_creditors table.
    /// </summary>
    public static class CreditorSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== Creditor sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("Creditor sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("Creditor sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "creditor_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable creditors = AutoCountConnector.QueryTable("Creditor", "AccNo");
                if (creditors == null || creditors.Rows.Count == 0)
                {
                    BridgeLogger.Warn("Creditor sync: no creditors returned.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                AutoCountConnector.LogTableColumns(creditors, "Creditor");

                int total = creditors.Rows.Count;
                int synced = 0;
                int failed = 0;

                foreach (DataRow row in creditors.Rows)
                {
                    string accNo = SyncHelper.SafeStr(row, "AccNo");
                    if (string.IsNullOrEmpty(accNo))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string json = MapCreditor(row);
                        supa.Insert("ac_creditors", json, upsert: true, onConflict: "acc_no");
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "Creditor sync failed for {0}: {1}", accNo, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "creditor", accNo, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "Creditor sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Creditor sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Creditor sync finished ===");
        }

        private static string MapCreditor(DataRow row)
        {
            string accNo = SyncHelper.SafeStr(row, "AccNo");
            string companyName = SyncHelper.SafeStr(row, "CompanyName");
            string phone = SyncHelper.FirstNonEmpty(row, "Phone1", "Phone2", "TelNo", "Telephone");
            string email = SyncHelper.FirstNonEmpty(row, "EmailAddress", "Email");
            string contact = SyncHelper.FirstNonEmpty(row, "Attention", "ContactPerson", "Contact");
            decimal creditLimit = SyncHelper.SafeDec(row, "CreditLimit");
            string creditTerm = SyncHelper.FirstNonEmpty(row, "DisplayTerm", "CreditTerm", "PaymentTerm");
            string currency = SyncHelper.SafeStr(row, "CurrencyCode");
            bool isActive = SyncHelper.SafeBool(row, "IsActive");

            var addrParts = new string[]
            {
                SyncHelper.SafeStr(row, "Address1"),
                SyncHelper.SafeStr(row, "Address2"),
                SyncHelper.SafeStr(row, "Address3"),
                SyncHelper.SafeStr(row, "Address4")
            };
            var addrBuilder = new StringBuilder();
            foreach (string p in addrParts)
            {
                if (!string.IsNullOrEmpty(p))
                {
                    if (addrBuilder.Length > 0) addrBuilder.Append(", ");
                    addrBuilder.Append(p);
                }
            }
            string address = addrBuilder.Length > 0 ? addrBuilder.ToString() : "";

            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"acc_no\":{0}", SyncHelper.JsonStr(accNo));
            sb.AppendFormat(",\"company_name\":{0}", SyncHelper.JsonStr(companyName));
            if (!string.IsNullOrEmpty(address))
                sb.AppendFormat(",\"address\":{0}", SyncHelper.JsonStr(address));
            if (!string.IsNullOrEmpty(phone))
                sb.AppendFormat(",\"phone\":{0}", SyncHelper.JsonStr(phone));
            if (!string.IsNullOrEmpty(email))
                sb.AppendFormat(",\"email\":{0}", SyncHelper.JsonStr(email));
            if (!string.IsNullOrEmpty(contact))
                sb.AppendFormat(",\"contact_person\":{0}", SyncHelper.JsonStr(contact));
            sb.AppendFormat(",\"credit_limit\":{0}", SyncHelper.JsonDec(creditLimit));
            if (!string.IsNullOrEmpty(creditTerm))
                sb.AppendFormat(",\"credit_term\":{0}", SyncHelper.JsonStr(creditTerm));
            if (!string.IsNullOrEmpty(currency))
                sb.AppendFormat(",\"currency_code\":{0}", SyncHelper.JsonStr(currency));
            sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(isActive));
            sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
            sb.Append("}");

            return sb.ToString();
        }
    }
}
