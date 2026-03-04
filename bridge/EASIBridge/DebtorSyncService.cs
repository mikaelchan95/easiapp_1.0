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
                jobId = CreateSyncJob(supa);
                UpdateJobStatus(supa, jobId, "running", null);

                DataTable debtors = AutoCountConnector.QueryAllDebtors();
                if (debtors == null || debtors.Rows.Count == 0)
                {
                    BridgeLogger.Warn("Debtor sync: no debtors returned from AutoCount.");
                    UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                int total = debtors.Rows.Count;
                int synced = 0;
                int failed = 0;

                BridgeLogger.Info(string.Format("Debtor sync: processing {0} debtors...", total));

                foreach (DataRow row in debtors.Rows)
                {
                    string accNo = SafeStr(row, "AccNo");
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
                        LogSyncError(supa, jobId, "debtor", accNo, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "Debtor sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Debtor sync fatal error: " + ex.Message);
                if (jobId != null)
                    UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Debtor sync finished ===");
        }

        /// <summary>Map an AutoCount Debtor DataRow to a Supabase companies JSON object.</summary>
        private static string MapDebtorToCompany(DataRow row)
        {
            string accNo = SafeStr(row, "AccNo");
            string companyName = SafeStr(row, "CompanyName");
            string address = BuildAddress(row);
            string phone = FirstNonEmpty(row, "Phone1", "Phone2", "TelNo", "Telephone");
            string email = FirstNonEmpty(row, "EmailAddress", "Email");
            string registerNo = FirstNonEmpty(row, "RegisterNo", "BRNo", "UEN", "BusinessRegNo");

            decimal creditLimit = SafeDec(row, "CreditLimit");
            string creditTerm = FirstNonEmpty(row, "DisplayTerm", "CreditTerm", "PaymentTerm");
            bool isActive = SafeBool(row, "IsActive");

            string paymentTerms = MapCreditTerm(creditTerm);
            string status = isActive ? "active" : "suspended";

            // Always use AC-{AccNo} as UEN to guarantee uniqueness.
            // autocount_debtor_code is the real link; UEN is just to satisfy the NOT NULL UNIQUE constraint.
            string uen = "AC-" + accNo;

            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"autocount_debtor_code\":{0}", JsonStr(accNo));
            sb.AppendFormat(",\"name\":{0}", JsonStr(companyName));
            sb.AppendFormat(",\"company_name\":{0}", JsonStr(companyName));
            sb.AppendFormat(",\"uen\":{0}", JsonStr(uen));
            sb.AppendFormat(",\"address\":{0}", JsonStr(address));
            if (!string.IsNullOrEmpty(phone))
                sb.AppendFormat(",\"phone\":{0}", JsonStr(phone));
            if (!string.IsNullOrEmpty(email))
                sb.AppendFormat(",\"email\":{0}", JsonStr(email));
            sb.AppendFormat(",\"credit_limit\":{0}", creditLimit);
            sb.AppendFormat(",\"payment_terms\":{0}", JsonStr(paymentTerms));
            sb.AppendFormat(",\"status\":{0}", JsonStr(status));
            sb.Append("}");

            return sb.ToString();
        }

        private static string BuildAddress(DataRow row)
        {
            var parts = new string[]
            {
                SafeStr(row, "Address1"),
                SafeStr(row, "Address2"),
                SafeStr(row, "Address3"),
                SafeStr(row, "Address4")
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

        private static string CreateSyncJob(SupabaseClient supa)
        {
            string json = "{\"job_type\":\"debtor_sync\",\"status\":\"pending\",\"started_at\":\"" +
                DateTime.UtcNow.ToString("o") + "\"}";
            string resp = supa.Insert("sync_jobs", json, upsert: false);
            string id = ExtractJsonField(resp, "id");
            BridgeLogger.Info("Sync job created: " + id);
            return id;
        }

        private static void UpdateJobStatus(SupabaseClient supa, string jobId, string status, string error)
        {
            try
            {
                string json = "{\"status\":\"" + status + "\"";
                if (error != null)
                    json += ",\"error_message\":" + JsonStr(error);
                json += "}";
                supa.Update("sync_jobs", "id=eq." + jobId, json);
            }
            catch (Exception ex)
            {
                BridgeLogger.Warn("Could not update sync job status: " + ex.Message);
            }
        }

        private static void UpdateJobCompleted(SupabaseClient supa, string jobId,
            int processed, int synced, int failed, string error)
        {
            try
            {
                string status = (error != null || failed > synced) ? "failed" : "completed";
                var sb = new StringBuilder();
                sb.Append("{");
                sb.AppendFormat("\"status\":\"{0}\"", status);
                sb.AppendFormat(",\"completed_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                sb.AppendFormat(",\"records_processed\":{0}", processed);
                sb.AppendFormat(",\"records_synced\":{0}", synced);
                sb.AppendFormat(",\"records_failed\":{0}", failed);
                if (error != null)
                    sb.AppendFormat(",\"error_message\":{0}", JsonStr(error));
                sb.Append("}");
                supa.Update("sync_jobs", "id=eq." + jobId, sb.ToString());
            }
            catch (Exception ex)
            {
                BridgeLogger.Warn("Could not update sync job completion: " + ex.Message);
            }
        }

        private static void LogSyncError(SupabaseClient supa, string jobId,
            string entity, string recordKey, string errorMsg)
        {
            try
            {
                var sb = new StringBuilder();
                sb.Append("{");
                sb.AppendFormat("\"job_id\":\"{0}\"", jobId);
                sb.AppendFormat(",\"entity\":{0}", JsonStr(entity));
                sb.AppendFormat(",\"record_key\":{0}", JsonStr(recordKey));
                sb.AppendFormat(",\"error_message\":{0}", JsonStr(errorMsg));
                sb.Append("}");
                supa.Insert("sync_errors", sb.ToString(), upsert: false);
            }
            catch (Exception ex)
            {
                BridgeLogger.Warn("Could not log sync error: " + ex.Message);
            }
        }

        private static string FirstNonEmpty(DataRow row, params string[] cols)
        {
            foreach (string col in cols)
            {
                string val = SafeStr(row, col);
                if (!string.IsNullOrEmpty(val)) return val;
            }
            return "";
        }

        private static string SafeStr(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return "";
            object val = row[col];
            if (val == null || val == DBNull.Value) return "";
            return val.ToString().Trim();
        }

        private static decimal SafeDec(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return 0;
            object val = row[col];
            if (val == null || val == DBNull.Value) return 0;
            decimal result;
            return decimal.TryParse(val.ToString(), out result) ? result : 0;
        }

        private static bool SafeBool(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return true;
            object val = row[col];
            if (val == null || val == DBNull.Value) return true;
            if (val is bool) return (bool)val;
            return val.ToString().Trim() != "0";
        }

        private static string JsonStr(string value)
        {
            if (value == null) return "null";
            return "\"" + value
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t") + "\"";
        }

        private static string ExtractJsonField(string json, string field)
        {
            string search = "\"" + field + "\":\"";
            int idx = json.IndexOf(search);
            if (idx < 0) return null;
            int start = idx + search.Length;
            int end = json.IndexOf("\"", start);
            if (end < 0) return null;
            return json.Substring(start, end - start);
        }
    }
}
