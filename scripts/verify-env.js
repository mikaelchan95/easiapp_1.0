#!/usr/bin/env node
/**
 * One-off script to verify .env Supabase credentials.
 * Run from repo root: node scripts/verify-env.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

async function main() {
  if (!url) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }
  console.log('URL:', url.replace(/\/$/, ''));

  if (serviceKey) {
    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Service role key test failed:', error.message);
      process.exit(1);
    }
    console.log('Service role key: OK (REST access works)');
  } else {
    console.log('SUPABASE_SERVICE_KEY not set, skipping service key check');
  }

  if (anonKey) {
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.getSession();
    if (error && error.message && !error.message.includes('session')) {
      console.error('Anon key test warning:', error.message);
    } else {
      console.log('Anon key: OK (auth endpoint reachable)');
    }
  } else {
    console.log(
      'EXPO_PUBLIC_SUPABASE_KEY not set – add anon key from Supabase Dashboard → Settings → API'
    );
  }

  const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Singapore&key=${encodeURIComponent(googleKey)}`;
    const res = await fetch(geoUrl);
    const json = await res.json();
    if (json.status === 'OK' && json.results?.length) {
      console.log('Google Maps key: OK (Geocoding API works)');
    } else if (json.status === 'REQUEST_DENIED') {
      console.error(
        'Google Maps key: FAILED –',
        json.error_message || 'key invalid or restricted'
      );
      process.exit(1);
    } else {
      console.error(
        'Google Maps key: unexpected response –',
        json.status,
        json.error_message || ''
      );
      process.exit(1);
    }
  } else {
    console.log('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY not set, skipping');
  }

  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
