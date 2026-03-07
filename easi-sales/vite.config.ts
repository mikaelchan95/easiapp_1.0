import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  envDir: '..', // load .env from repo root (VITE_SUPABASE_URL, VITE_SUPABASE_KEY)
});
