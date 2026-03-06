using System;
using System.Data;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Syncs AutoCount reference/lookup tables to Supabase ac_* tables:
    /// CreditTerm, PaymentMethod, Tax, Currency, Account, AccType, Branch, Department.
    /// These are small tables that rarely change; full replace on each sync.
    /// </summary>
    public static class ReferenceDataSyncService
    {
        public static void RunSync()
        {
            BridgeLogger.Info("=== Reference data sync starting ===");
            string jobId = null;

            var supa = SupabaseClient.FromConfig();
            if (supa == null)
            {
                BridgeLogger.Error("Reference sync aborted: Supabase not configured.");
                return;
            }

            if (!AutoCountConnector.IsConnected)
            {
                BridgeLogger.Error("Reference sync aborted: AutoCount not connected.");
                return;
            }

            try
            {
                jobId = SyncHelper.CreateSyncJob(supa, "reference_data_sync");
                SyncHelper.UpdateJobStatus(supa, jobId, "running", null);

                int totalSynced = 0;
                int totalFailed = 0;
                int totalProcessed = 0;

                totalProcessed += SyncCreditTerms(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncPaymentMethods(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncTaxCodes(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncCurrencies(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncAccounts(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncAccountTypes(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncBranches(supa, jobId, ref totalSynced, ref totalFailed);
                totalProcessed += SyncDepartments(supa, jobId, ref totalSynced, ref totalFailed);

                BridgeLogger.Info(string.Format(
                    "Reference data sync complete: {0} processed, {1} synced, {2} failed.",
                    totalProcessed, totalSynced, totalFailed));

                SyncHelper.UpdateJobCompleted(supa, jobId, totalProcessed, totalSynced, totalFailed, null);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Reference sync fatal error: " + ex.Message);
                if (jobId != null)
                    SyncHelper.UpdateJobCompleted(supa, jobId, 0, 0, 0, ex.Message);
            }

            BridgeLogger.Info("=== Reference data sync finished ===");
        }

        private static int SyncCreditTerms(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("CreditTerm");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "CreditTerm");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "CreditTermCode", "Code", "CreditTerm");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "CreditTermDesc")));
                    sb.AppendFormat(",\"days\":{0}", SyncHelper.SafeInt(row, "Days"));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_credit_terms", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "credit_term", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("CreditTerm: {0} rows processed.", count));
            return count;
        }

        private static int SyncPaymentMethods(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("PaymentMethod");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "PaymentMethod");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "PaymentMethodCode", "Code", "PaymentMethod");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "PaymentMethodDesc")));
                    sb.AppendFormat(",\"payment_type\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "PaymentType", "Type")));
                    sb.AppendFormat(",\"bank_account\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "BankAccount", "AccountNo")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_payment_methods", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "payment_method", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("PaymentMethod: {0} rows processed.", count));
            return count;
        }

        private static int SyncTaxCodes(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("Tax");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "Tax");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "TaxCode", "Code", "Tax");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "TaxDesc")));
                    sb.AppendFormat(",\"tax_rate\":{0}", SyncHelper.JsonDec(
                        SyncHelper.SafeDec(row, "TaxRate")));
                    sb.AppendFormat(",\"tax_type\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "TaxType", "Type")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_tax_codes", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "tax", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("Tax: {0} rows processed.", count));
            return count;
        }

        private static int SyncCurrencies(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("Currency");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "Currency");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "CurrencyCode", "Code", "Currency");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "CurrencyName")));
                    sb.AppendFormat(",\"symbol\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Symbol", "CurrencySymbol")));
                    sb.AppendFormat(",\"exchange_rate\":{0}", SyncHelper.JsonDec(
                        SyncHelper.SafeDec(row, "ExchangeRate")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_currencies", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "currency", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("Currency: {0} rows processed.", count));
            return count;
        }

        private static int SyncAccounts(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("Account");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "Account");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string accNo = SyncHelper.FirstNonEmpty(row, "AccNo", "AccountNo", "Code");
                if (string.IsNullOrEmpty(accNo)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"acc_no\":{0}", SyncHelper.JsonStr(accNo));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "AccountName")));
                    sb.AppendFormat(",\"acc_type\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "AccType", "AccountType")));
                    sb.AppendFormat(",\"special_acc_type\":{0}", SyncHelper.JsonStr(
                        SyncHelper.SafeStr(row, "SpecialAccType")));
                    sb.AppendFormat(",\"currency_code\":{0}", SyncHelper.JsonStr(
                        SyncHelper.SafeStr(row, "CurrencyCode")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_accounts", sb.ToString(), upsert: true, onConflict: "acc_no");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "account", accNo, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("Account: {0} rows processed.", count));
            return count;
        }

        private static int SyncAccountTypes(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("AccType");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "AccType");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "AccType", "Code", "AccTypeCode");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "AccTypeName")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_account_types", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "acc_type", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("AccType: {0} rows processed.", count));
            return count;
        }

        private static int SyncBranches(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("Branch");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "Branch");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "BranchCode", "Code", "Branch");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "BranchName")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_branches", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "branch", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("Branch: {0} rows processed.", count));
            return count;
        }

        private static int SyncDepartments(SupabaseClient supa, string jobId,
            ref int synced, ref int failed)
        {
            DataTable dt = AutoCountConnector.QueryTable("Department");
            if (dt == null || dt.Rows.Count == 0) return 0;
            AutoCountConnector.LogTableColumns(dt, "Department");

            int count = dt.Rows.Count;
            foreach (DataRow row in dt.Rows)
            {
                string code = SyncHelper.FirstNonEmpty(row, "DepartmentCode", "Code", "Department");
                if (string.IsNullOrEmpty(code)) { failed++; continue; }

                try
                {
                    var sb = new StringBuilder();
                    sb.Append("{");
                    sb.AppendFormat("\"code\":{0}", SyncHelper.JsonStr(code));
                    sb.AppendFormat(",\"description\":{0}", SyncHelper.JsonStr(
                        SyncHelper.FirstNonEmpty(row, "Description", "DepartmentName")));
                    sb.AppendFormat(",\"is_active\":{0}", SyncHelper.JsonBool(
                        SyncHelper.SafeBool(row, "IsActive")));
                    sb.AppendFormat(",\"synced_at\":\"{0}\"", DateTime.UtcNow.ToString("o"));
                    sb.Append("}");
                    supa.Insert("ac_departments", sb.ToString(), upsert: true, onConflict: "code");
                    synced++;
                }
                catch (Exception ex)
                {
                    failed++;
                    SyncHelper.LogSyncError(supa, jobId, "department", code, ex.Message);
                }
            }
            BridgeLogger.Info(string.Format("Department: {0} rows processed.", count));
            return count;
        }
    }
}
