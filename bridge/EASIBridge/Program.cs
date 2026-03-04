using System;
using System.Net;
using System.ServiceProcess;
using System.Threading;

namespace EASIBridge
{
    static class Program
    {
        private static readonly ManualResetEvent StopEvent = new ManualResetEvent(false);

        static int Main(string[] args)
        {
            // .NET 4.8 defaults to TLS 1.0; Supabase requires TLS 1.2+
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            AutoCountConnector.SetupAssemblyResolver();

            bool consoleMode = args.Length > 0 &&
                (args[0] == "--console" || args[0] == "-c");

            if (consoleMode)
            {
                return RunAsConsole();
            }

            ServiceBase.Run(new BridgeService());
            return 0;
        }

        static int RunAsConsole()
        {
            Console.WriteLine("===========================================");
            Console.WriteLine("  EASI Bridge - Console Mode");
            Console.WriteLine("  Press Ctrl+C to stop.");
            Console.WriteLine("===========================================");
            Console.WriteLine();

            var service = new BridgeService();

            Console.CancelKeyPress += delegate(object sender, ConsoleCancelEventArgs e)
            {
                e.Cancel = true;
                Console.WriteLine();
                Console.WriteLine("Shutdown signal received...");
                service.StopFromConsole();
                StopEvent.Set();
            };

            try
            {
                service.StartFromConsole();
                StopEvent.WaitOne();
            }
            catch (Exception ex)
            {
                Console.WriteLine("FATAL: " + ex.Message);
                return 1;
            }

            Console.WriteLine("EASI Bridge stopped.");
            return 0;
        }
    }
}
