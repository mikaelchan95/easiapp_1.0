using System.Configuration;

namespace EASIBridge
{
    public static class BridgeConfig
    {
        public static string LogDirectory
        {
            get { return GetSetting("LogDirectory", @"C:\ProgramData\EASI\Bridge\logs"); }
        }

        public static string StatusDirectory
        {
            get { return GetSetting("StatusDirectory", @"C:\ProgramData\EASI\Bridge\status"); }
        }

        public static string ConfigDirectory
        {
            get { return GetSetting("ConfigDirectory", @"C:\ProgramData\EASI\Bridge\config"); }
        }

        public static int HeartbeatIntervalSeconds
        {
            get
            {
                string val = GetSetting("HeartbeatIntervalSeconds", "30");
                int result;
                if (int.TryParse(val, out result) && result > 0) return result;
                return 30;
            }
        }

        public static string AutoCountInstallPath
        {
            get { return GetSetting("AutoCountInstallPath", @"C:\Program Files\AutoCount\Accounting 2.1"); }
        }

        public static string AutoCountDbServer
        {
            get { return GetSetting("AutoCountDbServer", ""); }
        }

        public static string AutoCountDbName
        {
            get { return GetSetting("AutoCountDbName", ""); }
        }

        public static string AutoCountUserId
        {
            get { return GetSetting("AutoCountUserId", ""); }
        }

        public static string AutoCountPassword
        {
            get { return GetSetting("AutoCountPassword", ""); }
        }

        /// <summary>Use SQL Server authentication for DB connection (required when service runs as svc_easibridge with no Windows login to SQL).</summary>
        public static bool AutoCountUseSqlAuth
        {
            get
            {
                string val = GetSetting("AutoCountUseSqlAuth", "false");
                return val.Equals("true", System.StringComparison.OrdinalIgnoreCase);
            }
        }

        public static string AutoCountSqlUser
        {
            get { return GetSetting("AutoCountSqlUser", ""); }
        }

        public static string AutoCountSqlPassword
        {
            get { return GetSetting("AutoCountSqlPassword", ""); }
        }

        public static bool AutoCountEnabled
        {
            get
            {
                string val = GetSetting("AutoCountEnabled", "false");
                return val.Equals("true", System.StringComparison.OrdinalIgnoreCase);
            }
        }

        public static string SupabaseUrl
        {
            get { return GetSetting("SupabaseUrl", ""); }
        }

        public static string SupabaseServiceKey
        {
            get { return GetSetting("SupabaseServiceKey", ""); }
        }

        public static bool DebtorSyncEnabled
        {
            get
            {
                string val = GetSetting("DebtorSyncEnabled", "false");
                return val.Equals("true", System.StringComparison.OrdinalIgnoreCase);
            }
        }

        public static int DebtorSyncIntervalMinutes
        {
            get
            {
                string val = GetSetting("DebtorSyncIntervalMinutes", "60");
                int result;
                if (int.TryParse(val, out result) && result >= 0) return result;
                return 60;
            }
        }

        private static string GetSetting(string key, string defaultValue)
        {
            string val = ConfigurationManager.AppSettings[key];
            return string.IsNullOrEmpty(val) ? defaultValue : val;
        }
    }
}
