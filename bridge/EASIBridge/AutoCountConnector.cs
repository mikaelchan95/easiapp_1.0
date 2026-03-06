using System;
using System.Data;
using System.IO;
using System.Reflection;

namespace EASIBridge
{
    public static class AutoCountConnector
    {
        private static object _dbSetting;
        private static object _userSession;
        private static bool _initialized;
        private static Assembly _acAssembly;
        private static Type _dbSettingType;
        private static Type _userSessionType;
        private static Type _dbServerTypeEnum;

        public static bool IsConnected
        {
            get
            {
                if (_userSession == null) return false;
                try
                {
                    var prop = _userSessionType.GetProperty("IsLogin");
                    return (bool)prop.GetValue(_userSession, null);
                }
                catch { return false; }
            }
        }

        public static void SetupAssemblyResolver()
        {
            string acPath = BridgeConfig.AutoCountInstallPath;
            AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs args)
            {
                string assemblyName = new AssemblyName(args.Name).Name;
                string dllPath = Path.Combine(acPath, assemblyName + ".dll");
                if (File.Exists(dllPath))
                {
                    return Assembly.LoadFrom(dllPath);
                }
                return null;
            };
        }

        public static bool Initialize()
        {
            if (_initialized) return true;

            string acPath = BridgeConfig.AutoCountInstallPath;
            string acDll = Path.Combine(acPath, "AutoCount.dll");

            if (!File.Exists(acDll))
            {
                BridgeLogger.Error("AutoCount.dll not found at: " + acDll);
                return false;
            }

            try
            {
                _acAssembly = Assembly.LoadFrom(acDll);
                _dbSettingType = _acAssembly.GetType("AutoCount.Data.DBSetting");
                _userSessionType = _acAssembly.GetType("AutoCount.Authentication.UserSession");
                _dbServerTypeEnum = _acAssembly.GetType("AutoCount.Data.DBServerType");

                if (_dbSettingType == null || _userSessionType == null || _dbServerTypeEnum == null)
                {
                    BridgeLogger.Error("Could not find required AutoCount types.");
                    return false;
                }

                BridgeLogger.Info("AutoCount SDK loaded from: " + acDll);
                _initialized = true;
                return true;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Failed to load AutoCount SDK: " + ex.Message);
                return false;
            }
        }

        public static bool Connect()
        {
            if (!_initialized && !Initialize())
            {
                return false;
            }

            string server = BridgeConfig.AutoCountDbServer;
            string dbName = BridgeConfig.AutoCountDbName;
            string acUser = BridgeConfig.AutoCountUserId;
            string acPass = BridgeConfig.AutoCountPassword;

            if (string.IsNullOrEmpty(server) || string.IsNullOrEmpty(dbName))
            {
                BridgeLogger.Error("AutoCount DB server or database name not configured.");
                return false;
            }

            if (string.IsNullOrEmpty(acUser))
            {
                BridgeLogger.Error("AutoCount user ID not configured.");
                return false;
            }

            try
            {
                bool useSqlAuth = BridgeConfig.AutoCountUseSqlAuth;
                string sqlUser = BridgeConfig.AutoCountSqlUser;
                string sqlPass = BridgeConfig.AutoCountSqlPassword;

                BridgeLogger.Info(string.Format(
                    "Connecting to AutoCount: server={0}, db={1}, user={2}, sqlAuth={3}",
                    server, dbName, acUser, useSqlAuth));

                object sqlServerType = Enum.Parse(_dbServerTypeEnum, "SQL2000");

                if (useSqlAuth && !string.IsNullOrEmpty(sqlUser) && !string.IsNullOrEmpty(sqlPass))
                {
                    // SQL Server authentication (for service account with no Windows login to SQL)
                    // DBSetting(DBServerType, string serverName, string userId, string password, string dbName)
                    _dbSetting = Activator.CreateInstance(
                        _dbSettingType,
                        new object[] { sqlServerType, server, sqlUser, sqlPass, dbName });
                    BridgeLogger.Info("DBSetting created (SQL Auth).");
                }
                else
                {
                    // Windows authentication
                    // DBSetting(DBServerType serverType, string serverName, string dbName)
                    _dbSetting = Activator.CreateInstance(
                        _dbSettingType,
                        new object[] { sqlServerType, server, dbName });
                    BridgeLogger.Info("DBSetting created (Windows Auth).");
                }

                // UserSession(DBSetting dbSetting)
                _userSession = Activator.CreateInstance(
                    _userSessionType,
                    new object[] { _dbSetting });

                // Login(string userID, string password)
                var loginMethod = _userSessionType.GetMethod("Login",
                    new Type[] { typeof(string), typeof(string) });

                bool loginOk = (bool)loginMethod.Invoke(
                    _userSession,
                    new object[] { acUser, acPass });

                if (loginOk)
                {
                    BridgeLogger.Info(string.Format(
                        "AutoCount login successful. User={0}, DB={1}",
                        acUser, dbName));
                    return true;
                }
                else
                {
                    BridgeLogger.Error(string.Format(
                        "AutoCount login FAILED for user '{0}'. Check credentials and user permissions.",
                        acUser));
                    return false;
                }
            }
            catch (TargetInvocationException ex)
            {
                string inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                BridgeLogger.Error("AutoCount connection error: " + inner);
                if (ex.InnerException != null && ex.InnerException.InnerException != null)
                {
                    BridgeLogger.Error("  Inner detail: " + ex.InnerException.InnerException.Message);
                }
                return false;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("AutoCount connection error: " + ex.Message);
                return false;
            }
        }

        public static DataTable QueryDebtors(int top)
        {
            if (_dbSetting == null)
            {
                BridgeLogger.Error("Cannot query: not connected.");
                return null;
            }

            try
            {
                string sql = string.Format(
                    "SELECT TOP {0} AccNo, CompanyName, CurrencyCode, " +
                    "IsActive, DebtorTypeCode FROM Debtor ORDER BY AccNo",
                    top);

                var method = _dbSettingType.GetMethod("GetDataTable",
                    new Type[] { typeof(string), typeof(bool), typeof(object[]) });

                DataTable dt = (DataTable)method.Invoke(
                    _dbSetting,
                    new object[] { sql, false, new object[0] });

                BridgeLogger.Info(string.Format(
                    "Debtor query returned {0} rows.", dt.Rows.Count));

                return dt;
            }
            catch (TargetInvocationException ex)
            {
                string inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                BridgeLogger.Error("Debtor query error: " + inner);
                return null;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Debtor query error: " + ex.Message);
                return null;
            }
        }

        /// <summary>Query all debtors with fields needed for company sync.</summary>
        public static DataTable QueryAllDebtors()
        {
            if (_dbSetting == null)
            {
                BridgeLogger.Error("Cannot query: not connected.");
                return null;
            }

            try
            {
                string sql = "SELECT * FROM Debtor ORDER BY AccNo";

                var method = _dbSettingType.GetMethod("GetDataTable",
                    new Type[] { typeof(string), typeof(bool), typeof(object[]) });

                DataTable dt = (DataTable)method.Invoke(
                    _dbSetting,
                    new object[] { sql, false, new object[0] });

                BridgeLogger.Info(string.Format(
                    "Full debtor query returned {0} rows, {1} columns.",
                    dt.Rows.Count, dt.Columns.Count));

                // Log column names once for field mapping reference
                var colNames = new System.Text.StringBuilder();
                for (int i = 0; i < dt.Columns.Count; i++)
                {
                    if (i > 0) colNames.Append(", ");
                    colNames.Append(dt.Columns[i].ColumnName);
                }
                BridgeLogger.Info("Debtor columns: " + colNames.ToString());

                return dt;
            }
            catch (TargetInvocationException ex)
            {
                string inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                BridgeLogger.Error("Full debtor query error: " + inner);
                return null;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Full debtor query error: " + ex.Message);
                return null;
            }
        }

        public static int GetDebtorCount()
        {
            return GetTableCount("Debtor");
        }

        /// <summary>Query all rows from any AutoCount table.</summary>
        public static DataTable QueryTable(string tableName, string orderBy = null)
        {
            if (_dbSetting == null)
            {
                BridgeLogger.Error("Cannot query: not connected.");
                return null;
            }

            try
            {
                string sql = "SELECT * FROM [" + tableName + "]";
                if (!string.IsNullOrEmpty(orderBy))
                    sql += " ORDER BY [" + orderBy + "]";

                var method = _dbSettingType.GetMethod("GetDataTable",
                    new Type[] { typeof(string), typeof(bool), typeof(object[]) });

                DataTable dt = (DataTable)method.Invoke(
                    _dbSetting,
                    new object[] { sql, false, new object[0] });

                BridgeLogger.Info(string.Format(
                    "{0} query returned {1} rows, {2} columns.",
                    tableName, dt.Rows.Count, dt.Columns.Count));

                return dt;
            }
            catch (TargetInvocationException ex)
            {
                string inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                BridgeLogger.Error(string.Format("{0} query error: {1}", tableName, inner));
                return null;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error(string.Format("{0} query error: {1}", tableName, ex.Message));
                return null;
            }
        }

        /// <summary>Query detail rows for a master document (e.g. invoice lines by DocNo).</summary>
        public static DataTable QueryDetailByDocNo(string detailTable, string docNo)
        {
            if (_dbSetting == null)
            {
                BridgeLogger.Error("Cannot query: not connected.");
                return null;
            }

            try
            {
                string sql = string.Format(
                    "SELECT * FROM [{0}] WHERE DocNo = '{1}'",
                    detailTable, docNo.Replace("'", "''"));

                var method = _dbSettingType.GetMethod("GetDataTable",
                    new Type[] { typeof(string), typeof(bool), typeof(object[]) });

                DataTable dt = (DataTable)method.Invoke(
                    _dbSetting,
                    new object[] { sql, false, new object[0] });

                return dt;
            }
            catch (TargetInvocationException ex)
            {
                string inner = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                BridgeLogger.Error(string.Format("{0} detail query error: {1}", detailTable, inner));
                return null;
            }
            catch (Exception ex)
            {
                BridgeLogger.Error(string.Format("{0} detail query error: {1}", detailTable, ex.Message));
                return null;
            }
        }

        /// <summary>Get row count for any table.</summary>
        public static int GetTableCount(string tableName)
        {
            if (_dbSetting == null) return -1;

            try
            {
                var method = _dbSettingType.GetMethod("ExecuteScalar",
                    new Type[] { typeof(string), typeof(object[]) });

                string sql = "SELECT COUNT(*) FROM [" + tableName + "]";
                object result = method.Invoke(
                    _dbSetting,
                    new object[] { sql, new object[0] });

                return Convert.ToInt32(result);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error(string.Format("{0} count error: {1}", tableName, ex.Message));
                return -1;
            }
        }

        /// <summary>Log column names for a table (for field mapping reference).</summary>
        public static void LogTableColumns(DataTable dt, string tableName)
        {
            if (dt == null) return;
            var colNames = new System.Text.StringBuilder();
            for (int i = 0; i < dt.Columns.Count; i++)
            {
                if (i > 0) colNames.Append(", ");
                colNames.Append(dt.Columns[i].ColumnName);
            }
            BridgeLogger.Info(string.Format("{0} columns: {1}", tableName, colNames));
        }

        public static void Disconnect()
        {
            if (_userSession != null)
            {
                try
                {
                    var isLoginProp = _userSessionType.GetProperty("IsLogin");
                    bool isLoggedIn = (bool)isLoginProp.GetValue(_userSession, null);

                    if (isLoggedIn)
                    {
                        var logoutMethod = _userSessionType.GetMethod("Logout");
                        logoutMethod.Invoke(_userSession, null);
                        BridgeLogger.Info("AutoCount session logged out.");
                    }
                }
                catch (Exception ex)
                {
                    BridgeLogger.Warn("AutoCount logout error: " + ex.Message);
                }
            }

            if (_dbSetting != null)
            {
                try
                {
                    var disposeMethod = _dbSettingType.GetMethod("Dispose");
                    if (disposeMethod != null)
                    {
                        disposeMethod.Invoke(_dbSetting, null);
                    }
                }
                catch { }
            }

            _userSession = null;
            _dbSetting = null;
            BridgeLogger.Info("AutoCount connection closed.");
        }
    }
}
