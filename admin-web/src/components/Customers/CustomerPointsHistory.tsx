import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface PointsHistoryItem {
  id: string;
  created_at: string;
  transaction_type: string;
  points_change: number;
  points_after: number;
  description?: string;
  metadata?: any;
}

interface CustomerPointsHistoryProps {
  userId: string;
}

export const CustomerPointsHistory = ({
  userId,
}: CustomerPointsHistoryProps) => {
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('points_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching points history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading history...</div>
    );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-right">Points</th>
              <th className="px-6 py-4 font-semibold text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map(item => (
              <tr
                key={item.id}
                className="hover:bg-brand-light/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    {new Date(item.created_at).toLocaleDateString()}
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="capitalize">
                    {item.transaction_type.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td
                  className="px-6 py-4 max-w-xs truncate"
                  title={item.description || JSON.stringify(item.metadata)}
                >
                  {item.description ||
                    (item.metadata ? (
                      <span className="text-xs font-mono text-gray-400">
                        {JSON.stringify(item.metadata).slice(0, 50)}...
                      </span>
                    ) : (
                      '-'
                    ))}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <span
                    className={`flex items-center justify-end gap-1 ${item.points_change > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {item.points_change > 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {item.points_change > 0 ? '+' : ''}
                    {item.points_change}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-brand-dark">
                  {item.points_after}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No points history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
