import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Queue } from './pages/Queue';
import { Active } from './pages/Active';
import { DeliveryDetail } from './pages/DeliveryDetail';
import { History } from './pages/History';
import type { StaffProfile } from './types';

export default function App() {
  const [driver, setDriver] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.staff_role === 'driver') {
            setDriver(profile as StaffProfile);
          } else {
            await supabase.auth.signOut();
          }
        }
      } catch {
        // Session restore failed — user will need to log in
      } finally {
        setLoading(false);
      }
    }

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async event => {
      if (event === 'SIGNED_OUT') {
        setDriver(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-100 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            driver ? <Navigate to="/" replace /> : <Login onLogin={setDriver} />
          }
        />

        {/* Protected routes with Layout */}
        <Route
          element={
            driver ? (
              <Layout driver={driver} onLogout={() => setDriver(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Queue driver={driver!} />} />
          <Route path="active" element={<Active driver={driver!} />} />
          <Route path="history" element={<History driver={driver!} />} />
        </Route>

        {/* Delivery detail (full-screen, no bottom tabs) */}
        <Route
          path="/delivery/:id"
          element={
            driver ? (
              <DeliveryDetail driver={driver} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
