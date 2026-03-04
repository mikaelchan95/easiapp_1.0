using System;
using System.ServiceProcess;
using System.Threading;

namespace EASIBridge
{
    public class BridgeService : ServiceBase
    {
        private Timer _heartbeatTimer;
        private DateTime _startTimeUtc;
        private Mutex _singleInstanceMutex;
        private bool _mutexOwned;

        public BridgeService()
        {
            ServiceName = "EASIBridge";
            CanStop = true;
            CanShutdown = true;
        }

        protected override void OnStart(string[] args)
        {
            DoStart();
        }

        protected override void OnStop()
        {
            DoStop();
        }

        protected override void OnShutdown()
        {
            DoStop();
        }

        public void StartFromConsole()
        {
            DoStart();
        }

        public void StopFromConsole()
        {
            DoStop();
        }

        private void DoStart()
        {
            _singleInstanceMutex = new Mutex(true, @"Global\EASIBridgeMutex", out _mutexOwned);
            if (!_mutexOwned)
            {
                string msg = "Another instance of EASI Bridge is already running. Aborting.";
                BridgeLogger.Error(msg);
                HealthWriter.Write("error", "Duplicate instance blocked");
                throw new InvalidOperationException(msg);
            }

            _startTimeUtc = DateTime.UtcNow;

            BridgeLogger.Info("EASI Bridge starting...");
            BridgeLogger.Info("Machine: " + Environment.MachineName);
            BridgeLogger.Info("User: " + Environment.UserName);
            BridgeLogger.Info("PID: " + System.Diagnostics.Process.GetCurrentProcess().Id);

            if (BridgeConfig.AutoCountEnabled)
            {
                BridgeLogger.Info("AutoCount integration is ENABLED. Testing connection...");
                try
                {
                    if (AutoCountConnector.Connect())
                    {
                        int count = AutoCountConnector.GetDebtorCount();
                        BridgeLogger.Info(string.Format(
                            "AutoCount connection OK. Debtor count: {0}", count));
                        HealthWriter.Write("running", string.Format(
                            "AutoCount connected. {0} debtors.", count));
                    }
                    else
                    {
                        BridgeLogger.Warn("AutoCount connection failed. Service continues with heartbeat only.");
                        HealthWriter.Write("degraded", "AutoCount connection failed");
                    }
                }
                catch (Exception ex)
                {
                    BridgeLogger.Error("AutoCount startup error: " + ex.Message);
                    HealthWriter.Write("degraded", "AutoCount error: " + ex.Message);
                }
            }
            else
            {
                BridgeLogger.Info("AutoCount integration is DISABLED.");
            }

            int intervalMs = BridgeConfig.HeartbeatIntervalSeconds * 1000;
            _heartbeatTimer = new Timer(OnHeartbeat, null, 0, intervalMs);

            HealthWriter.Write("running", "Service started");
            BridgeLogger.Info("EASI Bridge started successfully.");
        }

        private void DoStop()
        {
            BridgeLogger.Info("EASI Bridge stopping...");

            if (_heartbeatTimer != null)
            {
                _heartbeatTimer.Change(Timeout.Infinite, Timeout.Infinite);
                _heartbeatTimer.Dispose();
                _heartbeatTimer = null;
            }

            try
            {
                AutoCountConnector.Disconnect();
            }
            catch (Exception ex)
            {
                BridgeLogger.Warn("AutoCount disconnect error: " + ex.Message);
            }

            HealthWriter.Write("stopped", "Service stopped gracefully");

            if (_mutexOwned && _singleInstanceMutex != null)
            {
                try
                {
                    _singleInstanceMutex.ReleaseMutex();
                }
                catch (ApplicationException) { }
                _singleInstanceMutex.Dispose();
                _singleInstanceMutex = null;
                _mutexOwned = false;
            }

            BridgeLogger.Info("EASI Bridge stopped.");
        }

        private void OnHeartbeat(object state)
        {
            try
            {
                TimeSpan uptime = DateTime.UtcNow - _startTimeUtc;
                string msg = string.Format(
                    "Heartbeat OK | uptime={0}d {1}h {2}m {3}s",
                    (int)uptime.TotalDays, uptime.Hours, uptime.Minutes, uptime.Seconds);
                BridgeLogger.Info(msg);
                HealthWriter.Write("running", msg);
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Heartbeat error: " + ex.Message);
            }
        }
    }
}
