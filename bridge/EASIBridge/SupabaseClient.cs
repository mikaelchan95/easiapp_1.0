using System;
using System.IO;
using System.Net;
using System.Text;

namespace EASIBridge
{
    /// <summary>
    /// Lightweight Supabase REST client for the bridge service.
    /// Uses service_role key to bypass RLS.
    /// Targets .NET 4.8 (no HttpClient — uses WebRequest).
    /// </summary>
    public class SupabaseClient
    {
        private readonly string _baseUrl;
        private readonly string _serviceKey;

        public SupabaseClient(string baseUrl, string serviceKey)
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _serviceKey = serviceKey;
        }

        public static SupabaseClient FromConfig()
        {
            string url = BridgeConfig.SupabaseUrl;
            string key = BridgeConfig.SupabaseServiceKey;

            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key) ||
                url.Contains("__") || key.Contains("__"))
            {
                return null;
            }
            return new SupabaseClient(url, key);
        }

        /// <summary>POST JSON to a table. Returns response body.</summary>
        public string Insert(string table, string jsonBody, bool upsert = false, string onConflict = null)
        {
            string url = _baseUrl + "/rest/v1/" + table;
            if (upsert && !string.IsNullOrEmpty(onConflict))
                url += "?on_conflict=" + onConflict;
            return DoRequest("POST", url, jsonBody, upsert);
        }

        /// <summary>PATCH rows matching query params. Returns response body.</summary>
        public string Update(string table, string queryParams, string jsonBody)
        {
            string url = _baseUrl + "/rest/v1/" + table + "?" + queryParams;
            return DoRequest("PATCH", url, jsonBody, false);
        }

        /// <summary>DELETE rows matching query params. Returns response body.</summary>
        public string Delete(string table, string queryParams)
        {
            string url = _baseUrl + "/rest/v1/" + table + "?" + queryParams;
            return DoRequest("DELETE", url, null, false);
        }

        /// <summary>GET rows from a table with query params. Returns JSON array.</summary>
        public string Select(string table, string queryParams)
        {
            string url = _baseUrl + "/rest/v1/" + table;
            if (!string.IsNullOrEmpty(queryParams))
                url += "?" + queryParams;
            return DoRequest("GET", url, null, false);
        }

        private string DoRequest(string method, string url, string body, bool upsert)
        {
            var req = (HttpWebRequest)WebRequest.Create(url);
            req.Method = method;
            req.ContentType = "application/json";
            req.Headers["apikey"] = _serviceKey;
            req.Headers["Authorization"] = "Bearer " + _serviceKey;
            req.Headers["Prefer"] = upsert
                ? "resolution=merge-duplicates,return=representation"
                : "return=representation";
            req.Timeout = 30000;

            if (body != null && method != "GET")
            {
                byte[] data = Encoding.UTF8.GetBytes(body);
                req.ContentLength = data.Length;
                using (Stream s = req.GetRequestStream())
                {
                    s.Write(data, 0, data.Length);
                }
            }

            try
            {
                using (var resp = (HttpWebResponse)req.GetResponse())
                using (var reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException wex)
            {
                if (wex.Response != null)
                {
                    using (var reader = new StreamReader(wex.Response.GetResponseStream(), Encoding.UTF8))
                    {
                        string errBody = reader.ReadToEnd();
                        throw new Exception(string.Format(
                            "Supabase {0} {1} => {2}: {3}",
                            method, url,
                            ((HttpWebResponse)wex.Response).StatusCode,
                            errBody));
                    }
                }
                throw;
            }
        }
    }
}
