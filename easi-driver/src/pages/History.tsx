import { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import type {
  DeliveryAssignment,
  DeliveryStatus,
  StaffProfile,
} from '../types';

interface HistoryProps {
  driver: StaffProfile;
}

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (date > weekAgo) return 'This Week';

  return date.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

interface GroupedAssignments {
  label: string;
  items: DeliveryAssignment[];
}

function groupByDate(assignments: DeliveryAssignment[]): GroupedAssignments[] {
  const groups: Map<string, DeliveryAssignment[]> = new Map();

  for (const a of assignments) {
    const dateKey = a.delivered_at || a.assigned_at;
    const label = formatDate(dateKey);
    const existing = groups.get(label) || [];
    existing.push(a);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

export function History({ driver }: HistoryProps) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (offset = 0, append = false) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('delivery_assignments')
          .select(
            `
            *,
            order:orders (
              id,
              order_number,
              total,
              delivery_address,
              created_at,
              company:companies ( name )
            )
          `
          )
          .eq('driver_id', driver.id)
          .in('status', ['delivered', 'failed'])
          .order('delivered_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (fetchError) throw fetchError;

        const results = (data as DeliveryAssignment[]) || [];
        setHasMore(results.length === PAGE_SIZE);

        if (append) {
          setAssignments(prev => [...prev, ...results]);
        } else {
          setAssignments(results);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('History load error:', err);
        setError(msg || 'Failed to load history');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [driver.id]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const groups = groupByDate(assignments);

  return (
    <div className="px-4 py-4 pb-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Delivery History</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Loading history…</p>
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No delivery history
          </h2>
          <p className="text-sm text-gray-500">
            Completed deliveries will appear here
          </p>
        </div>
      )}

      {!loading &&
        groups.map(group => (
          <div key={group.label} className="mb-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {group.label}
            </h2>
            <div className="space-y-2">
              {group.items.map(assignment => (
                <button
                  key={assignment.id}
                  onClick={() => navigate(`/delivery/${assignment.id}`)}
                  className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm">
                          {assignment.order?.order_number || 'Unknown'}
                        </span>
                        <StatusBadge
                          status={assignment.status as DeliveryStatus}
                        />
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {assignment.order?.company?.name || 'Customer'}
                      </p>
                      {assignment.delivered_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(assignment.delivered_at)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

      {!loading && hasMore && assignments.length > 0 && (
        <div className="pt-2 pb-4">
          <Button
            variant="secondary"
            fullWidth
            loading={loadingMore}
            onClick={() => fetchHistory(assignments.length, true)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
