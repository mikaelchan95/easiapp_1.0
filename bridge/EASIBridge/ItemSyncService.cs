using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount Item table to Supabase products table.
    /// Maps ItemCode → autocount_item_code, updates pricing/stock/description.
    /// </summary>
    public static class ItemSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== Item sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("Item sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("Item sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "item_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable items = AutoCountConnector.QueryTable("Item", "ItemCode");
                if (items == null || items.Rows.Count == 0)
                {
                    BridgeLogger.Warn("Item sync: no items returned from AutoCount.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                AutoCountConnector.LogTableColumns(items, "Item");

                int total = items.Rows.Count;
                int synced = 0;
                int failed = 0;

                BridgeLogger.Info(string.Format("Item sync: processing {0} items...", total));

                foreach (DataRow row in items.Rows)
                {
                    string itemCode = SyncHelper.SafeStr(row, "ItemCode");
                    if (string.IsNullOrEmpty(itemCode))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string json = MapItemToProduct(row);
                        supa.Insert("products", json, upsert: true,
                            onConflict: "autocount_item_code");
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "Item sync failed for {0}: {1}", itemCode, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "item", itemCode, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "Item sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Item sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Item sync finished ===");
        }

        private static string MapItemToProduct(DataRow row)
        {
            string itemCode = SyncHelper.SafeStr(row, "ItemCode");
            string description = SyncHelper.FirstNonEmpty(row, "Description", "ItemDesc", "Desc");
            string itemGroup = SyncHelper.SafeStr(row, "ItemGroup");
            decimal retailPrice = SyncHelper.SafeDec(row, "Price");
            if (retailPrice <= 0)
                retailPrice = SyncHelper.SafeDec(row, "UnitPrice");
            if (retailPrice <= 0)
                retailPrice = SyncHelper.SafeDec(row, "SellingPrice");
            if (retailPrice <= 0)
                retailPrice = 0.01m; // minimum to satisfy CHECK constraint

            decimal tradePrice = SyncHelper.SafeDec(row, "Price2");
            if (tradePrice <= 0)
                tradePrice = SyncHelper.SafeDec(row, "WholeSalePrice");

            decimal costPrice = SyncHelper.SafeDec(row, "Cost");
            if (costPrice <= 0)
                costPrice = SyncHelper.SafeDec(row, "StdCost");

            int stockQty = SyncHelper.SafeInt(row, "BalQty");
            if (stockQty <= 0)
                stockQty = SyncHelper.SafeInt(row, "Qty");

            bool isActive = SyncHelper.SafeBool(row, "IsActive");
            string uom = SyncHelper.SafeStr(row, "UOM");
            string barcode = SyncHelper.FirstNonEmpty(row, "Barcode", "BarCode");

            string category = !string.IsNullOrEmpty(itemGroup) ? itemGroup : "Uncategorized";
            string sku = "AC-" + itemCode;

            string stockStatus = "in_stock";
            if (stockQty <= 0) stockStatus = "out_of_stock";
            else if (stockQty < 10) stockStatus = "low_stock";

            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"autocount_item_code\":{0}", SyncHelper.JsonStr(itemCode));
            sb.AppendFormat(",\"name\":{0}", SyncHelper.JsonStr(description));
            sb.AppendFormat(",\"sku\":{0}", SyncHelper.JsonStr(sku));
            sb.AppendFormat(",\"category\":{0}", SyncHelper.JsonStr(category));
            sb.AppendFormat(",\"retail_price\":{0}", SyncHelper.JsonDec(retailPrice));
            if (tradePrice > 0)
                sb.AppendFormat(",\"trade_price\":{0}", SyncHelper.JsonDec(tradePrice));
            sb.AppendFormat(",\"stock_quantity\":{0}", SyncHelper.JsonInt(stockQty));
            sb.AppendFormat(",\"stock_status\":{0}", SyncHelper.JsonStr(stockStatus));
            sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(isActive));
            if (!string.IsNullOrEmpty(uom))
                sb.AppendFormat(",\"volume\":{0}", SyncHelper.JsonStr(uom));
            sb.Append("}");

            return sb.ToString();
        }
    }
}
