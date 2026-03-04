using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;

namespace EASIBridge
{
    public static class BridgeLogger
    {
        private static readonly object Lock = new object();
        private static readonly string LogDir;
        private const string EventSource = "EASIBridge";
        private const string EventLogName = "Application";
        private static bool _eventLogAvailable;

        static BridgeLogger()
        {
            LogDir = BridgeConfig.LogDirectory;

            try
            {
                if (!Directory.Exists(LogDir))
                {
                    Directory.CreateDirectory(LogDir);
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Cannot create log directory: " + ex.Message);
            }

            try
            {
                if (!EventLog.SourceExists(EventSource))
                {
                    EventLog.CreateEventSource(EventSource, EventLogName);
                }
                _eventLogAvailable = true;
            }
            catch
            {
                _eventLogAvailable = false;
            }
        }

        public static void Info(string message)
        {
            WriteLog("INFO", message);
            WriteEventLog(message, EventLogEntryType.Information);
        }

        public static void Warn(string message)
        {
            WriteLog("WARN", message);
            WriteEventLog(message, EventLogEntryType.Warning);
        }

        public static void Error(string message)
        {
            WriteLog("ERROR", message);
            WriteEventLog(message, EventLogEntryType.Error);
        }

        private static void WriteLog(string level, string message)
        {
            string timestamp = DateTime.UtcNow.ToString(
                "yyyy-MM-dd HH:mm:ss.fff", CultureInfo.InvariantCulture);
            string line = string.Format("[{0}] [{1}] {2}", timestamp, level, message);

            lock (Lock)
            {
                try
                {
                    string date = DateTime.UtcNow.ToString(
                        "yyyy-MM-dd", CultureInfo.InvariantCulture);
                    string fileName = string.Format("bridge-{0}.log", date);
                    string filePath = Path.Combine(LogDir, fileName);

                    using (var writer = new StreamWriter(filePath, true))
                    {
                        writer.WriteLine(line);
                    }
                }
                catch (Exception ex)
                {
                    try
                    {
                        Console.Error.WriteLine("LOG WRITE FAILED: " + ex.Message);
                    }
                    catch { }
                }
            }

            try
            {
                Console.WriteLine(line);
            }
            catch { }
        }

        private static void WriteEventLog(string message, EventLogEntryType type)
        {
            if (!_eventLogAvailable) return;

            try
            {
                EventLog.WriteEntry(EventSource, message, type);
            }
            catch { }
        }
    }
}
