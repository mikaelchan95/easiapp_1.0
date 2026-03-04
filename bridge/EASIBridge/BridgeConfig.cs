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

        private static string GetSetting(string key, string defaultValue)
        {
            string val = ConfigurationManager.AppSettings[key];
            return string.IsNullOrEmpty(val) ? defaultValue : val;
        }
    }
}
