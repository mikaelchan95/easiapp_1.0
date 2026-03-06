using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount AROfficialReceipt + AROfficialReceiptDetail
    /// to Supabase ac_receipts + ac_receipt_items.
    /// </summary>
    public static class ReceiptSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== Receipt sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("Receipt sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("Receipt sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "receipt_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                DataTable receipts = AutoCountConnector.QueryTable("AROfficialReceipt", "DocNo");
                if (receipts == null || receipts.Rows.Count == 0)
                {
                    BridgeLogger.Warn("Receipt sync: no receipts returned.");
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, null);
                    return;
                }

                AutoCountConnector.LogTableColumns(receipts, "AROfficialReceipt");

                int total = receipts.Rows.Count;
                int synced = 0;
                int failed = 0;

                foreach (DataRow row in receipts.Rows)
                {
                    string docNo = SyncHelper.SafeStr(row, "DocNo");
                    if (string.IsNullOrEmpty(docNo))
                    {
                        failed++;
                        continue;
                    }

                    try
                    {
                        string headerJson = MapReceiptHeader(row);
                        supa.Insert("ac_receipts", headerJson, upsert: true, onConflict: "doc_no");

                        SyncDetailLines(supa, docNo, jobId);
                        synced++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        BridgeLogger.Warn(string.Format(
                            "Receipt sync failed for {0}: {1}", docNo, ex.Message));
                        SyncHelper.LogSyncError(supa, jobId, "receipt", docNo, ex.Message);
                    }
                }

                BridgeLogger.Info(string.Format(
                    "Receipt sync complete: {0} total, {1} synced, {2} failed.",
                    total, synced, failed));

                SyncHelper.UpdateJobCompleted(supa, jobId, total, synced, failed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Receipt sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Receipt sync finished ===");
        }

        private static void SyncDetailLines(SupabaseClient supa, string docNo, string jobId)
        {
            DataTable details = AutoCountConnector.QueryDetailByDocNo("AROfficialReceiptDetail", docNo);
            if (details == null || details.Rows.Count == 0) return;

            try { supa.Delete("ac_receipt_items", "doc_no=eq." + Uri.EscapeDataString(docNo)); }
            catch (Exception ex) { BridgeLogger.Warn("Could not clear old receipt items for " + docNo + ": " + ex.Message); }

            int seq = 0;
            foreach (DataRow dRow in details.Rows)
            {
                try
                {
                    string lineJson = MapReceiptLine(dRow, docNo, seq++);
                    supa.Insert("ac_receipt_items", lineJson, upsert: false);
                }
                catch (Exception ex)
                {
                    SyncHelper.LogSyncError(supa, jobId, "receipt_item",
                        docNo + "#" + seq, ex.Message);
                }
            }
        }

        private static string MapReceiptHeader(DataRow row)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"doc_no\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "DocNo")));
            sb.AppendFormat(",\"debtor_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "DebtorCode")));
            sb.AppendFormat(",\"debtor_name\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "DebtorName", "CompanyName")));
            sb.AppendFormat(",\"doc_date\":{0}", SyncHelper.JsonDate(SyncHelper.SafeDate(row, "DocDate")));
            sb.AppendFormat(",\"amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "DocAmt")));
            sb.AppendFormat(",\"payment_method\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "PaymentMethod", "PaymentType")));
            sb.AppendFormat(",\"cheque_no\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "ChequeNo")));
            sb.AppendFormat(",\"bank_account\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "BankAccount")));
            sb.AppendFormat(",\"currency_code\":{0}", SyncHelper.JsonStr(SyncHelper.SafeStr(row, "CurrencyCode")));
            sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "Description", "Remark")));
            sb.AppendFormat(",\"is_cancelled\":{0}", SyncHelper.JsonBool(SyncHelper.SafeBool(row, "Cancelled", false)));
            sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
            sb.Append("}");
            return sb.ToString();
        }

        private static string MapReceiptLine(DataRow row, string docNo, int seq)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            sb.AppendFormat("\"doc_no\":{0}", SyncHelper.JsonStr(docNo));
            sb.AppendFormat(",\"invoice_doc_no\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "DocNo", "InvoiceNo", "InvoiceDocNo")));
            sb.AppendFormat(",\"amount\":{0}", SyncHelper.JsonDec(SyncHelper.SafeDec(row, "Amount")));
            sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                SyncHelper.FirstNonEmpty(row, "Description", "Remark")));
            sb.AppendFormat(",\"seq\":{0}", seq);
            sb.Append("}");
            return sb.ToString();
        }
    }
}
