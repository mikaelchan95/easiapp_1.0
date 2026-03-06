using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount SalesOrder + SalesOrderDetail
    /// to Supabase ac_sales_orders + ac_sales_order_items.
    /// </summary>
    public static class SalesOrderSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== SalesOrder sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("SalesOrder sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("SalesOrder sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "sales_order_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable orders = AutoCountConnector.QueryTable("SalesOrder", "DocNo");
                if (orders == null || orders.Rows.Count == 0)
                {
                    BridgeLogger.Warn("SalesOrder sync: no orders returned.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                AutoCountConnector.LogTableColumns(orders, "SalesOrder");

                int total = orders.Rows.Count;
                int synced = 0;
                int failed = 0;

                foreach (DataRow row in orders.Rows)
                {
                    string docNo = SyncHelper.SafeStr(row, "DocNo");
                    if (string.IsNullOrEmpty(docNo))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string headerJson = MapOrderHeader(row);
                        supa.Insert("ac_sales_orders", headerJson, upsert: true, onConflict: "doc_no");

                        SyncDetailLines(supa, docNo, jobId);
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "SalesOrder sync failed for {0}: {1}", docNo, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "sales_order", docNo, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "SalesOrder sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("SalesOrder sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== SalesOrder sync finished ===");
        }

        private static void SyncDetailLines(SupabaseClient supa, string docNo, string jobId)
        {
            DataTable details = AutoCountConnector.QueryDetailByDocNo("SalesOrderDetail", docNo);
            if (details == null || details.Rows.Count == 0) return;

            try { supa.Delete("ac_sales_order_items", "doc_no=eq." + Uri.EscapeDataString(docNo)); }
            catch (Exception ex) { BridgeLogger.Warn("Could not clear old SO items for " + docNo + ": " + ex.Message); }

            int seq = 0;
            foreach (DataRow dRow in details.Rows)
            {
                try
                {
                    string lineJson = MapOrderLine(dRow, docNo, seq++);
                    supa.Insert("ac_sales_order_items", lineJson, upsert: false);
                }
                catch (Exception ex)
                {
                    SyncHelper.LogSyncError(supa, jobId, "sales_order_item",
                        docNo + "#" + seq, ex.Message);
                }
            }
        }

        private static string MapOrderHeader(DataRow row)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"doc_no\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "DocNo")));
            sb.AppendFormat(",\"debtor_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "DebtorCode")));
            sb.AppendFormat(",\"debtor_name\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "DebtorName", "CompanyName")));
            sb.AppendFormat(",\"doc_date\":{0}", SyncHelper.JsonDate(SyncHelper.SafeDate(row, "DocDate")));
            sb.AppendFormat(",\"delivery_date\":{0}", SyncHelper.JsonDate(
                SyncHelper.SafeDate(row, "DeliveryDate") ?? SyncHelper.SafeDate(row, "EstDeliveryDate")));
            sb.AppendFormat(",\"amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "DocAmt")));
            sb.AppendFormat(",\"tax_amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "TaxAmt")));
            sb.AppendFormat(",\"currency_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "CurrencyCode")));
            sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "Description", "Remark")));
            sb.AppendFormat(",\"salesman_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "SalesmanCode")));
            sb.AppendFormat(",\"status\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "Status", "DocStatus")));
            sb.AppendFormat(",\"is_cancelled\":{0}", SyncHelper.JsonBool(SyncHelper.SafeBool(row, "Cancelled", false)));
            sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
            sb.Append("}");
            return sb.ToString();
        }

        private static string MapOrderLine(DataRow row, string docNo, int seq)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"doc_no\":{0}", SyncHelper.JsonStr(docNo));
            sb.AppendFormat(",\"item_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "ItemCode")));
            sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "Description", "ItemDesc")));
            sb.AppendFormat(",\"qty\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "Qty")));
            sb.AppendFormat(",\"unit_price\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "UnitPrice")));
            sb.AppendFormat(",\"amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "Amount")));
            sb.AppendFormat(",\"tax_amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "TaxAmt")));
            sb.AppendFormat(",\"uom\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "UOM")));
            sb.AppendFormat(",\"seq\":{0}", seq);
            sb.Append("}");
            return sb.ToString();
        }
    }
}
