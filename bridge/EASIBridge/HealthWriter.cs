using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;

namespace EASIBridge
{
    public static class HealthWriter
    {
        private static readonly object Lock = new object();
        private static readonly string StatusDir;
        private static readonly string StatusFile;
        private static readonly DateTime ProcessStartUtc = DateTime.UtcNow;

        static HealthWriter()
        {
            StatusDir = BridgeConfig.StatusDirectory;
            StatusFile = Path.Combine(StatusDir, "health.json");

            try
            {
                if (!Directory.Exists(StatusDir))
                {
                    Directory.CreateDirectory(StatusDir);
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Cannot create status directory: " + ex.Message);
            }
        }

        public static void Write(string status, string message)
        {
            lock (Lock)
            {
                try
                {
                    TimeSpan uptime = DateTime.UtcNow - ProcessStartUtc;

                    string json = string.Format(
                        "{{\r\n" +
                        "  \"service\": \"EASIBridge\",\r\n" +
                        "  \"status\": \"{0}\",\r\n" +
                        "  \"message\": \"{1}\",\r\n" +
                        "  \"timestamp_utc\": \"{2}\",\r\n" +
                        "  \"uptime_seconds\": {3},\r\n" +
                        "  \"machine\": \"{4}\",\r\n" +
                        "  \"pid\": {5}\r\n" +
                        "}}",
                        Escape(status),
                        Escape(message),
                        DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture),
                        (int)uptime.TotalSeconds,
                        Escape(Environment.MachineName),
                        Process.GetCurrentProcess().Id
                    );

                    string tempFile = StatusFile + ".tmp";
                    File.WriteAllText(tempFile, json);

                    if (File.Exists(StatusFile))
                    {
                        File.Delete(StatusFile);
                    }
                    File.Move(tempFile, StatusFile);
                }
                catch (Exception ex)
                {
                    try
                    {
                        Console.Error.WriteLine("HEALTH WRITE FAILED: " + ex.Message);
                    }
                    catch { }
                }
            }
        }

        private static string Escape(string s)
        {
            if (s == null) return "";
            return s
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r");
        }
    }
}
