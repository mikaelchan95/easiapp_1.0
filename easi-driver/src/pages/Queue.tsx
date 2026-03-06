import { useState, useEffect, useCallback } from 'react';
import { Truck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DeliveryCard } from '../components/DeliveryCard';
import type { DeliveryAssignment, DeliveryZone, StaffProfile } from '../types';

interface QueueProps {
  driver: StaffProfile;
}

const ZONES: (DeliveryZone | 'All')[] = [
  'All',
  'North',
  'South',
  'East',
  'West',
  'Central',
];

export function Queue({ driver }: QueueProps) {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeZone, setActiveZone] = useState<DeliveryZone | 'All'>('All');
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      setError(null);

      try {
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        ).toISOString();

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
          .gte('assigned_at', startOfDay)
          .lt('assigned_at', endOfDay)
          .neq('status', 'delivered')
          .neq('status', 'failed')
          .order('assigned_at', { ascending: true });

        if (fetchError) throw fetchError;
        setAssignments((data as DeliveryAssignment[]) || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load deliveries'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [driver.id]
  );

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered =
    activeZone === 'All'
      ? assignments
      : assignments.filter(a => a.order?.delivery_zone === activeZone);

  return (
    <div className="px-4 py-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">
            Today's Deliveries
          </h1>
          {assignments.length > 0 && (
            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 bg-black text-white text-xs font-bold rounded-full">
              {assignments.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchAssignments(true)}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-white active:bg-gray-200 transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Zone filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-2">
        {ZONES.map(zone => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors ${
              activeZone === zone
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Loading deliveries…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No deliveries
            {activeZone !== 'All' ? ` in ${activeZone}` : ' assigned'}
          </h2>
          <p className="text-sm text-gray-500">
            {activeZone !== 'All'
              ? 'Try selecting a different zone'
              : 'No deliveries assigned for today'}
          </p>
        </div>
      )}

      {/* Delivery list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(assignment => (
            <DeliveryCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
