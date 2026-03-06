using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount ItemGroup table to Supabase categories table.
    /// </summary>
    public static class ItemGroupSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== ItemGroup sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("ItemGroup sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("ItemGroup sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "item_group_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable groups = AutoCountConnector.QueryTable("ItemGroup");
                if (groups == null || groups.Rows.Count == 0)
                {
                    BridgeLogger.Warn("ItemGroup sync: no groups returned.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                AutoCountConnector.LogTableColumns(groups, "ItemGroup");

                int total = groups.Rows.Count;
                int synced = 0;
                int failed = 0;

                foreach (DataRow row in groups.Rows)
                {
                    string groupCode = SyncHelper.FirstNonEmpty(row, "ItemGroup", "GroupCode", "Code");
                    if (string.IsNullOrEmpty(groupCode))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string json = MapGroupToCategory(row, groupCode);
                        supa.Insert("categories", json, upsert: true,
                            onConflict: "autocount_group_code");
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "ItemGroup sync failed for {0}: {1}", groupCode, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "item_group", groupCode, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "ItemGroup sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("ItemGroup sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== ItemGroup sync finished ===");
        }

        private static string MapGroupToCategory(DataRow row, string groupCode)
        {
            string description = SyncHelper.FirstNonEmpty(row, "Description", "GroupName", "Name");
            if (string.IsNullOrEmpty(description))
                description = groupCode;

            string slug = groupCode.ToLower()
                .Replace(" ", "-")
                .Replace("&", "and")
                .Replace("/", "-");

            // Remove non-alphanumeric chars except hyphens
            var slugBuilder = new StringBuilder();
            foreach (char c in slug)
            {
                if (char.IsLetterOrDigit(c) || c == '-')
                    slugBuilder.Append(c);
            }
            slug = slugBuilder.ToString().Trim('-');
            if (string.IsNullOrEmpty(slug)) slug = "ac-" + groupCode.GetHashCode().ToString("x");

            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"autocount_group_code\":{0}", SyncHelper.JsonStr(groupCode));
            sb.AppendFormat(",\"name\":{0}", SyncHelper.JsonStr(description));
            sb.AppendFormat(",\"slug\":{0}", SyncHelper.JsonStr(slug));
            sb.AppendFormat(",\"is_active\":true");
            sb.Append("}");

            return sb.ToString();
        }
    }
}
