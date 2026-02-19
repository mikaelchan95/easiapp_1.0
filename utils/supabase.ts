import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

// Check if environment variables are set
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log(
    'Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are set in your .env file'
  );

  // For development, we'll create a dummy client to prevent crashes
  // In production, you should ensure these are properly configured
  throw new Error(
    'Supabase configuration missing. Please check your environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
    flowType: 'pkce', // Use PKCE flow for better security
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Client runtime must never create a privileged Supabase client.
// Keep this export for compatibility, but it intentionally uses anon permissions.
export const supabaseAdmin = supabase;

// Test Supabase connection on initialization
supabase.auth
  .getSession()
  .then(({ data: { session }, error }) => {
    if (error) {
      console.error('❌ Supabase session error:', error.message);
    } else {
      console.log(
        '✅ Supabase initialized successfully',
        session ? 'with active session' : 'without session'
      );
    }
  })
  .catch(err => {
    console.error('❌ Failed to initialize Supabase:', err);
  });
