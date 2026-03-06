using System;
using System.ServiceProcess;
using System.Threading;

namespace EASIBridge
{
    public class BridgeService : ServiceBase
    {
        private Timer _heartbeatTimer;
        private Timer _debtorSyncTimer;
        private Timer _fullSyncTimer;
        private DateTime _startTimeUtc;
        private Mutex _singleInstanceMutex;
        private bool _mutexOwned;
        private int _debtorSyncRunning;
        private int _fullSyncRunning;

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
                        int debtorCount = AutoCountConnector.GetDebtorCount();
                        int itemCount = AutoCountConnector.GetTableCount("Item");
                        BridgeLogger.Info(string.Format(
                            "AutoCount connection OK. Debtors: {0}, Items: {1}",
                            debtorCount, itemCount));
                        HealthWriter.Write("running", string.Format(
                            "AutoCount connected. {0} debtors, {1} items.",
                            debtorCount, itemCount));
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

            if (BridgeConfig.DebtorSyncEnabled && BridgeConfig.AutoCountEnabled)
            {
                int syncMinutes = BridgeConfig.DebtorSyncIntervalMinutes;
                int initialDelayMs = 15000;
                int syncIntervalMs = syncMinutes > 0 ? syncMinutes * 60 * 1000 : Timeout.Infinite;

                BridgeLogger.Info(string.Format(
                    "Debtor sync ENABLED. Interval: {0} min. First run in {1}s.",
                    syncMinutes, initialDelayMs / 1000));

                _debtorSyncTimer = new Timer(OnDebtorSyncTick, null, initialDelayMs, syncIntervalMs);
            }
            else
            {
                BridgeLogger.Info("Debtor sync is DISABLED.");
            }

            if (BridgeConfig.FullSyncEnabled && BridgeConfig.AutoCountEnabled)
            {
                int syncMinutes = BridgeConfig.FullSyncIntervalMinutes;
                int initialDelayMs = 30000;
                int syncIntervalMs = syncMinutes > 0 ? syncMinutes * 60 * 1000 : Timeout.Infinite;

                BridgeLogger.Info(string.Format(
                    "Full sync ENABLED. Interval: {0} min. First run in {1}s.",
                    syncMinutes, initialDelayMs / 1000));

                LogEnabledSyncs();

                _fullSyncTimer = new Timer(OnFullSyncTick, null, initialDelayMs, syncIntervalMs);
            }
            else
            {
                BridgeLogger.Info("Full sync is DISABLED.");
            }

            HealthWriter.Write("running", "Service started");
            BridgeLogger.Info("EASI Bridge started successfully.");
        }

        private void DoStop()
        {
            BridgeLogger.Info("EASI Bridge stopping...");

            DisposeTimer(ref _fullSyncTimer);
            DisposeTimer(ref _debtorSyncTimer);
            DisposeTimer(ref _heartbeatTimer);

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

        private void DisposeTimer(ref Timer timer)
        {
            if (timer != null)
            {
                timer.Change(Timeout.Infinite, Timeout.Infinite);
                timer.Dispose();
                timer = null;
            }
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

        private void OnDebtorSyncTick(object state)
        {
            if (Interlocked.CompareExchange(ref _debtorSyncRunning, 1, 0) != 0)
            {
                BridgeLogger.Info("Debtor sync skipped (previous run still active).");
                return;
            }

            try
            {
                DebtorSyncService.RunSync();
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Debtor sync tick error: " + ex.Message);
            }
            finally
            {
                Interlocked.Exchange(ref _debtorSyncRunning, 0);
            }
        }

        private void OnFullSyncTick(object state)
        {
            if (Interlocked.CompareExchange(ref _fullSyncRunning, 1, 0) != 0)
            {
                BridgeLogger.Info("Full sync skipped (previous run still active).");
                return;
            }

            try
            {
                RunFullSync();
            }
            catch (Exception ex)
            {
                BridgeLogger.Error("Full sync tick error: " + ex.Message);
            }
            finally
            {
                Interlocked.Exchange(ref _fullSyncRunning, 0);
            }
        }

        /// <summary>
        /// Runs all enabled entity syncs sequentially.
        /// Reference data first, then master data, then transactional documents.
        /// </summary>
        private void RunFullSync()
        {
            BridgeLogger.Info("========== FULL SYNC CYCLE STARTING ==========");
            DateTime startTime = DateTime.UtcNow;

            // 1. Reference data (small tables, fast)
            if (BridgeConfig.ReferenceDataSyncEnabled)
                SafeRunSync("ReferenceData", ReferenceDataSyncService.RunSync);

            // 2. Master data
            if (BridgeConfig.ItemGroupSyncEnabled)
                SafeRunSync("ItemGroup", ItemGroupSyncService.RunSync);

            if (BridgeConfig.ItemSyncEnabled)
                SafeRunSync("Item", ItemSyncService.RunSync);

            if (BridgeConfig.CreditorSyncEnabled)
                SafeRunSync("Creditor", CreditorSyncService.RunSync);

            // 3. Transactional documents
            if (BridgeConfig.SalesOrderSyncEnabled)
                SafeRunSync("SalesOrder", SalesOrderSyncService.RunSync);

            if (BridgeConfig.DeliveryOrderSyncEnabled)
                SafeRunSync("DeliveryOrder", DeliveryOrderSyncService.RunSync);

            if (BridgeConfig.InvoiceSyncEnabled)
                SafeRunSync("Invoice", InvoiceSyncService.RunSync);

            if (BridgeConfig.ReceiptSyncEnabled)
                SafeRunSync("Receipt", ReceiptSyncService.RunSync);

            TimeSpan elapsed = DateTime.UtcNow - startTime;
            BridgeLogger.Info(string.Format(
                "========== FULL SYNC CYCLE COMPLETE ({0}m {1}s) ==========",
                (int)elapsed.TotalMinutes, elapsed.Seconds));
        }

        private void SafeRunSync(string name, Action syncAction)
        {
            try
            {
                syncAction();
            }
            catch (Exception ex)
            {
                BridgeLogger.Error(string.Format(
                    "{0} sync failed (non-fatal, continuing): {1}", name, ex.Message));
            }
        }

        private void LogEnabledSyncs()
        {
            var enabled = new System.Text.StringBuilder("Enabled syncs: ");
            if (BridgeConfig.ReferenceDataSyncEnabled) enabled.Append("ReferenceData ");
            if (BridgeConfig.ItemGroupSyncEnabled) enabled.Append("ItemGroup ");
            if (BridgeConfig.ItemSyncEnabled) enabled.Append("Item ");
            if (BridgeConfig.CreditorSyncEnabled) enabled.Append("Creditor ");
            if (BridgeConfig.SalesOrderSyncEnabled) enabled.Append("SalesOrder ");
            if (BridgeConfig.DeliveryOrderSyncEnabled) enabled.Append("DeliveryOrder ");
            if (BridgeConfig.InvoiceSyncEnabled) enabled.Append("Invoice ");
            if (BridgeConfig.ReceiptSyncEnabled) enabled.Append("Receipt ");
            BridgeLogger.Info(enabled.ToString());
        }
    }
}
