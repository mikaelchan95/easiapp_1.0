using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Shared utilities for all sync services: JSON building, safe data access,
    /// sync job tracking, and error logging.
    /// </summary>
    public static class SyncHelper
    {
        public static string SafeStr(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return "";
            object val = row[col];
            if (val == null || val == DBNull.Value) return "";
            return val.ToString().Trim();
        }

        public static decimal SafeDec(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return 0;
            object val = row[col];
            if (val == null || val == DBNull.Value) return 0;
            decimal result;
            return decimal.TryParse(val.ToString(), out result) ? result : 0;
        }

        public static int SafeInt(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return 0;
            object val = row[col];
            if (val == null || val == DBNull.Value) return 0;
            int result;
            return int.TryParse(val.ToString(), out result) ? result : 0;
        }

        public static bool SafeBool(DataRow row, string col, bool defaultVal = true)
        {
            if (!row.Table.Columns.Contains(col)) return defaultVal;
            object val = row[col];
            if (val == null || val == DBNull.Value) return defaultVal;
            if (val is bool) return (bool)val;
            string s = val.ToString().Trim().ToLower();
            if (s == "1" || s == "true" || s == "yes" || s == "y") return true;
            if (s == "0" || s == "false" || s == "no" || s == "n") return false;
            return defaultVal;
        }

        public static DateTime? SafeDate(DataRow row, string col)
        {
            if (!row.Table.Columns.Contains(col)) return null;
            object val = row[col];
            if (val == null || val == DBNull.Value) return null;
            if (val is DateTime) return (DateTime)val;
            DateTime result;
            if (DateTime.TryParse(val.ToString(), out result)) return result;
            return null;
        }

        public static string FirstNonEmpty(DataRow row, params string[] cols)
        {
            foreach (string col in cols)
            {
                string val = SafeStr(row, col);
                if (!string.IsNullOrEmpty(val)) return val;
            }
            return "";
        }

        public static string JsonStr(string value)
        {
            if (value == null) return "null";
            return "\"" + value
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t") + "\"";
        }

        public static string JsonDate(DateTime? dt)
        {
            if (!dt.HasValue) return "null";
            return "\"" + dt.Value.ToString("o") + "\"";
        }

        public static string JsonDec(decimal val)
        {
            return val.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        public static string JsonInt(int val)
        {
            return val.ToString();
        }

        public static string JsonBool(bool val)
        {
            return val ? "true" : "false";
        }

        public static string ExtractJsonField(string json, string field)
        {
            string search = "\"" + field + "\":\"";
            int idx = json.IndexOf(search);
            if (idx < 0) return null;
            int start = idx + search.Length;
            int end = json.IndexOf("\"", start);
            if (end < 0) return null;
            return json.Substring(start, end - start);
        }

        public static string CreateSyncJob(SupabaseClient supa, string jobType)
        {
            string json = "{\"job_type\":" + JsonStr(jobType) +
                ",\"status\":\"pending\",\"started_at\":\"" +
                DateTime.UtcNow.ToString("o") + "\"}";
            string resp = supa.Insert("sync_jobs", json, upsert: false);
            string id = ExtractJsonField(resp, "id");
            BridgeLogger.Info(string.Format("Sync job created ({0}): {1}", jobType, id));
            return id;
        }

        public static void UpdateJobStatus(SupabaseClient supa, string jobId, string status, string error)
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

        public static void UpdateJobCompleted(SupabaseClient supa, string jobId,
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

        public static void LogSyncError(SupabaseClient supa, string jobId,
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
    }
}
