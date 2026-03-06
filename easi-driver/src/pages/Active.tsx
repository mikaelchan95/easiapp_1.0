import { useState, useEffect, useCallback } from 'react';
import { Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DeliveryCard } from '../components/DeliveryCard';
import type { DeliveryAssignment, StaffProfile } from '../types';

interface ActiveProps {
  driver: StaffProfile;
}

export function Active({ driver }: ActiveProps) {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async () => {
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('delivery_assignments')
        .select(
          `
          *,
          order:orders (
            *,
            company:companies ( name ),
            order_items ( * )
          )
        `
        )
        .eq('driver_id', driver.id)
        .in('status', ['dispatched', 'en_route', 'arrived'])
        .order('dispatched_at', { ascending: true });

      if (fetchError) throw fetchError;
      setAssignments((data as DeliveryAssignment[]) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load active deliveries'
      );
    } finally {
      setLoading(false);
    }
  }, [driver.id]);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  return (
    <div className="px-4 py-4 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        Active Deliveries
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Loading…</p>
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Navigation className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No active deliveries
          </h2>
          <p className="text-sm text-gray-500">
            Start a delivery from your queue to see it here
          </p>
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="space-y-3">
          {assignments.map(assignment => (
            <DeliveryCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
