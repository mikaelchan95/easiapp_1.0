using System;
using System.Data;
using System.IO;
using System.Reflection;

namespace EASIBridge
{
    public static class ExtractDmfCredentials
    {
        private const string DefaultAcPath = @"C:\Program Files\AutoCount\Accounting 2.1";
        private const string AcConfigDir = @"C:\ProgramData\AutoCount\Accounting 2";

        static int Main(string[] args)
        {
            string acPath = DefaultAcPath;
            if (Environment.GetEnvironmentVariable("AutoCountInstallPath") != null)
                acPath = Environment.GetEnvironmentVariable("AutoCountInstallPath").Trim();

            Console.WriteLine("EASI Bridge - DMF credential extractor (one-time)");
            Console.WriteLine("AutoCount path: " + acPath);
            Console.WriteLine();

            string acDll = Path.Combine(acPath, "AutoCount.dll");
            if (!File.Exists(acDll))
            {
                Console.Error.WriteLine("ERROR: AutoCount.dll not found at: " + acDll);
                return 1;
            }

            AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs resolveArgs)
            {
                string name = new AssemblyName(resolveArgs.Name).Name;
                string path = Path.Combine(acPath, name + ".dll");
                return File.Exists(path) ? Assembly.LoadFrom(path) : null;
            };

            // --- Part 1: Read AutoCount config files directly ---
            Console.WriteLine("=== Part 1: AutoCount config files ===");
            Console.WriteLine();
            ReadConfigFiles();
            Console.WriteLine();

            // --- Part 2: Explore DatabaseManagement via reflection ---
            Console.WriteLine("=== Part 2: DatabaseManagement API discovery ===");
            Console.WriteLine();

            try
            {
                Assembly acAssembly = Assembly.LoadFrom(acDll);
                Type dmType = acAssembly.GetType("AutoCount.Configuration.DatabaseManagement");
                if (dmType == null)
                {
                    Console.Error.WriteLine("DatabaseManagement type not found.");
                    return TryDirectSql();
                }

                // List all methods and properties on DatabaseManagement
                Console.WriteLine("DatabaseManagement methods:");
                foreach (MethodInfo mi in dmType.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static))
                {
                    if (mi.DeclaringType == dmType)
                    {
                        string parms = "";
                        foreach (ParameterInfo pi in mi.GetParameters())
                            parms += (parms.Length > 0 ? ", " : "") + pi.ParameterType.Name + " " + pi.Name;
                        Console.WriteLine("  " + mi.ReturnType.Name + " " + mi.Name + "(" + parms + ")");
                    }
                }
                Console.WriteLine();

                Console.WriteLine("DatabaseManagement properties:");
                foreach (PropertyInfo pi in dmType.GetProperties())
                {
                    if (pi.DeclaringType == dmType)
                        Console.WriteLine("  " + pi.PropertyType.Name + " " + pi.Name);
                }
                Console.WriteLine();

                Console.WriteLine("DatabaseManagement constructors:");
                foreach (ConstructorInfo ci in dmType.GetConstructors())
                {
                    string parms = "";
                    foreach (ParameterInfo pi in ci.GetParameters())
                        parms += (parms.Length > 0 ? ", " : "") + pi.ParameterType.Name + " " + pi.Name;
                    Console.WriteLine("  .ctor(" + parms + ")");
                }
                Console.WriteLine();

                // Create instance
                object dm = Activator.CreateInstance(dmType);

                // Try LoadDefaultDMF
                MethodInfo loadDefault = dmType.GetMethod("LoadDefaultDMF", Type.EmptyTypes);
                if (loadDefault != null)
                {
                    Console.WriteLine("Calling LoadDefaultDMF()...");
                    try
                    {
                        loadDefault.Invoke(dm, null);
                        Console.WriteLine("  LoadDefaultDMF() returned OK.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("  LoadDefaultDMF() threw: " + GetDeepMessage(ex));
                    }
                }

                // Try LoadDMF with specific path if the method exists
                string dmfPath = FindDmfFile();
                if (dmfPath != null)
                {
                    MethodInfo loadDmf = dmType.GetMethod("LoadDMF", new Type[] { typeof(string) });
                    if (loadDmf != null)
                    {
                        Console.WriteLine("Calling LoadDMF('" + dmfPath + "')...");
                        try
                        {
                            loadDmf.Invoke(dm, new object[] { dmfPath });
                            Console.WriteLine("  LoadDMF() returned OK.");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine("  LoadDMF() threw: " + GetDeepMessage(ex));
                        }
                    }
                }

                // Get DatabaseManager
                PropertyInfo dbMgrProp = dmType.GetProperty("DatabaseManager");
                if (dbMgrProp == null)
                {
                    Console.WriteLine("DatabaseManager property not found.");
                    return TryDirectSql();
                }

                object dbManager = dbMgrProp.GetValue(dm, null);
                if (dbManager == null)
                {
                    Console.WriteLine("DatabaseManager is null after loading.");
                    return TryDirectSql();
                }

                Type dbMgrType = dbManager.GetType();
                Console.WriteLine("DatabaseManager type: " + dbMgrType.FullName);
                Console.WriteLine();

                // List all methods and properties on DatabaseManager
                Console.WriteLine("DatabaseManager methods:");
                foreach (MethodInfo mi in dbMgrType.GetMethods(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (mi.DeclaringType == dbMgrType || mi.DeclaringType.Namespace.StartsWith("AutoCount"))
                    {
                        string parms = "";
                        foreach (ParameterInfo pi in mi.GetParameters())
                            parms += (parms.Length > 0 ? ", " : "") + pi.ParameterType.Name + " " + pi.Name;
                        Console.WriteLine("  " + mi.ReturnType.Name + " " + mi.Name + "(" + parms + ")");
                    }
                }
                Console.WriteLine();

                Console.WriteLine("DatabaseManager properties:");
                foreach (PropertyInfo pi in dbMgrType.GetProperties())
                {
                    Console.WriteLine("  " + pi.PropertyType.Name + " " + pi.Name + " = " + SafeGetValue(dbManager, pi));
                }
                Console.WriteLine();

                // Try Count property
                PropertyInfo countProp = dbMgrType.GetProperty("Count");
                int count = -1;
                if (countProp != null)
                {
                    try
                    {
                        count = Convert.ToInt32(countProp.GetValue(dbManager, null));
                        Console.WriteLine("Count: " + count);
                    }
                    catch { }
                }

                // Try GetDatabaseInfo with various approaches
                Console.WriteLine();
                Console.WriteLine("=== Part 3: Extracting database info ===");
                Console.WriteLine();

                // Approach 1: GetDatabaseInfo(int)
                MethodInfo getDbInfo = dbMgrType.GetMethod("GetDatabaseInfo", new Type[] { typeof(int) });
                if (getDbInfo != null)
                {
                    int limit = count > 0 ? count : 20;
                    for (int i = 0; i < limit; i++)
                    {
                        try
                        {
                            object info = getDbInfo.Invoke(dbManager, new object[] { i });
                            if (info == null) break;
                            PrintDatabaseInfo(info, i);
                        }
                        catch { break; }
                    }
                }

                // Approach 2: Indexer (Item property)
                PropertyInfo indexer = dbMgrType.GetProperty("Item");
                if (indexer != null && getDbInfo == null)
                {
                    int limit = count > 0 ? count : 20;
                    for (int i = 0; i < limit; i++)
                    {
                        try
                        {
                            object info = indexer.GetValue(dbManager, new object[] { i });
                            if (info == null) break;
                            PrintDatabaseInfo(info, i);
                        }
                        catch { break; }
                    }
                }

                // Approach 3: Check if it implements IEnumerable
                if (dbManager is System.Collections.IEnumerable)
                {
                    Console.WriteLine("DatabaseManager is IEnumerable, iterating...");
                    int idx = 0;
                    foreach (object item in (System.Collections.IEnumerable)dbManager)
                    {
                        PrintDatabaseInfo(item, idx);
                        idx++;
                    }
                    if (idx == 0)
                        Console.WriteLine("  (empty collection)");
                }

                if (count <= 0 && getDbInfo == null && indexer == null && !(dbManager is System.Collections.IEnumerable))
                {
                    Console.WriteLine("Could not iterate DatabaseManager. Falling back to direct SQL.");
                    return TryDirectSql();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("ERROR: " + GetDeepMessage(ex));
                return TryDirectSql();
            }

            return 0;
        }

        static void ReadConfigFiles()
        {
            string[] possiblePaths = new string[]
            {
                Path.Combine(AcConfigDir, "A2006.config"),
                Path.Combine(AcConfigDir, "A2006.dmf"),
                Path.Combine(AcConfigDir, "default.config"),
                Path.Combine(AcConfigDir, "default.dmf")
            };

            // Also scan the directory
            if (Directory.Exists(AcConfigDir))
            {
                Console.WriteLine("Files in " + AcConfigDir + ":");
                foreach (string f in Directory.GetFiles(AcConfigDir, "*.*"))
                {
                    FileInfo fi = new FileInfo(f);
                    Console.WriteLine("  " + fi.Name + " (" + fi.Length + " bytes)");

                    // Try to read small text files
                    if (fi.Length < 10000 && (fi.Extension == ".config" || fi.Extension == ".xml" || fi.Extension == ".txt" || fi.Extension == ".ini"))
                    {
                        try
                        {
                            string content = File.ReadAllText(f);
                            Console.WriteLine("  --- contents ---");
                            Console.WriteLine(content);
                            Console.WriteLine("  --- end ---");
                        }
                        catch { }
                    }

                    // For DMF files, try reading as text (might be XML or might be binary)
                    if (fi.Extension == ".dmf" && fi.Length < 50000)
                    {
                        try
                        {
                            string content = File.ReadAllText(f);
                            if (content.IndexOf('<') >= 0 || content.IndexOf('{') >= 0)
                            {
                                Console.WriteLine("  --- contents (text) ---");
                                Console.WriteLine(content);
                                Console.WriteLine("  --- end ---");
                            }
                            else
                            {
                                Console.WriteLine("  (binary or encrypted, " + fi.Length + " bytes)");
                                // Print first 200 chars in hex
                                byte[] bytes = File.ReadAllBytes(f);
                                int show = Math.Min(bytes.Length, 200);
                                Console.Write("  hex: ");
                                for (int i = 0; i < show; i++)
                                    Console.Write(bytes[i].ToString("x2") + " ");
                                Console.WriteLine();
                            }
                        }
                        catch { }
                    }
                }
            }
            else
            {
                Console.WriteLine("Config directory not found: " + AcConfigDir);

                // Try alternate paths
                string[] altPaths = new string[]
                {
                    @"C:\ProgramData\AutoCount",
                    @"C:\ProgramData\AutoCount\Accounting 2.1",
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData) + @"\AutoCount",
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\AutoCount"
                };
                foreach (string alt in altPaths)
                {
                    if (Directory.Exists(alt))
                    {
                        Console.WriteLine("Found alternate: " + alt);
                        foreach (string f in Directory.GetFiles(alt, "*.*", SearchOption.AllDirectories))
                        {
                            FileInfo fi = new FileInfo(f);
                            Console.WriteLine("  " + fi.FullName + " (" + fi.Length + " bytes)");
                        }
                    }
                }
            }
        }

        static string FindDmfFile()
        {
            string[] candidates = new string[]
            {
                Path.Combine(AcConfigDir, "A2006.dmf"),
                Path.Combine(AcConfigDir, "default.dmf")
            };
            foreach (string p in candidates)
                if (File.Exists(p)) return p;

            if (Directory.Exists(AcConfigDir))
            {
                foreach (string f in Directory.GetFiles(AcConfigDir, "*.dmf"))
                    return f;
            }
            return null;
        }

        static void PrintDatabaseInfo(object info, int index)
        {
            if (info == null) return;
            Type t = info.GetType();

            Console.WriteLine("[Database " + index + "]  (type: " + t.FullName + ")");

            // Try known property names
            string[] propNames = new string[]
            {
                "ServerName", "DatabaseName", "SAName", "SAPassword",
                "CompanyName", "Name", "Server", "Database",
                "UserName", "Password", "UserId", "UserID"
            };

            foreach (string name in propNames)
            {
                PropertyInfo pi = t.GetProperty(name);
                if (pi != null)
                {
                    string val = SafeGetValue(info, pi);
                    Console.WriteLine("  " + name + ": " + val);
                }
            }

            // Also dump ALL properties in case there are others
            Console.WriteLine("  -- all properties --");
            foreach (PropertyInfo pi in t.GetProperties())
            {
                Console.WriteLine("  " + pi.Name + " (" + pi.PropertyType.Name + "): " + SafeGetValue(info, pi));
            }
            Console.WriteLine();
        }

        static string SafeGetValue(object obj, PropertyInfo pi)
        {
            try
            {
                object val = pi.GetValue(obj, null);
                return val != null ? val.ToString() : "(null)";
            }
            catch (Exception ex)
            {
                return "(error: " + ex.Message + ")";
            }
        }

        static string GetDeepMessage(Exception ex)
        {
            string msg = ex.Message;
            if (ex.InnerException != null)
                msg += " -> " + ex.InnerException.Message;
            if (ex.InnerException != null && ex.InnerException.InnerException != null)
                msg += " -> " + ex.InnerException.InnerException.Message;
            return msg;
        }

        static int TryDirectSql()
        {
            Console.WriteLine();
            Console.WriteLine("=== Fallback: Direct SQL Server query ===");
            Console.WriteLine();
            Console.WriteLine("Attempting to connect to DESKTOP-20COQHQ\\A2006 via Windows Auth...");

            try
            {
                string connStr = @"Data Source=DESKTOP-20COQHQ\A2006;Integrated Security=True;Connection Timeout=10";
                using (var conn = new System.Data.SqlClient.SqlConnection(connStr))
                {
                    conn.Open();
                    Console.WriteLine("Connected. Querying for SQL logins...");
                    Console.WriteLine();

                    // List SQL logins
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "SELECT name, type_desc, is_disabled FROM sys.server_principals WHERE type IN ('S','U') ORDER BY name";
                        using (var reader = cmd.ExecuteReader())
                        {
                            Console.WriteLine("SQL Server logins:");
                            while (reader.Read())
                            {
                                Console.WriteLine(string.Format("  {0}  (type: {1}, disabled: {2})",
                                    reader["name"], reader["type_desc"], reader["is_disabled"]));
                            }
                        }
                    }

                    Console.WriteLine();
                    Console.WriteLine("If 'sa' is listed and not disabled, you can enable SQL Auth and use sa credentials.");
                    Console.WriteLine("Otherwise, grant svc_easibridge a login via:");
                    Console.WriteLine("  CREATE LOGIN [DESKTOP-20COQHQ\\svc_easibridge] FROM WINDOWS;");
                    Console.WriteLine("  USE AED_EPICO; CREATE USER [svc_easibridge] FOR LOGIN [DESKTOP-20COQHQ\\svc_easibridge]; EXEC sp_addrolemember 'db_datareader', 'svc_easibridge';");

                    conn.Close();
                }
                return 0;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Direct SQL failed: " + GetDeepMessage(ex));
                Console.Error.WriteLine("Run this extractor as a user with Windows Auth SQL access (e.g. 'User').");
                return 1;
            }
        }
    }
}
