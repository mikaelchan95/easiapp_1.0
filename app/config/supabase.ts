import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDMzODIsImV4cCI6MjA2NzU3OTM4Mn0.vIIvNn31sz1JLW_OMYqqqCF6RHn32jmir4U_AVbHIWU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 