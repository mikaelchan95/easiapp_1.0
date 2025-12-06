import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Ticket, Calendar } from 'lucide-react';

interface VoucherItem {
  id: string;
  voucher_code: string;
  voucher_value: number;
  voucher_status: 'active' | 'used' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  metadata?: any;
}

interface CustomerVouchersProps {
  userId: string;
}

export const CustomerVouchers = ({ userId }: CustomerVouchersProps) => {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchVouchers();
  }, [userId]);

  const fetchVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_vouchers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            variant="success"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Active
          </Badge>
        );
      case 'used':
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Used
          </Badge>
        );
      case 'expired':
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading vouchers...</div>
    );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Code</th>
              <th className="px-6 py-4 font-semibold">Value</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Expires</th>
              <th className="px-6 py-4 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vouchers.map(voucher => (
              <tr
                key={voucher.id}
                className="hover:bg-brand-light/50 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-medium text-brand-dark flex items-center gap-2">
                  <Ticket size={16} className="text-brand-accent" />
                  {voucher.voucher_code}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  ${voucher.voucher_value.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(voucher.voucher_status)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={14}
                      className={
                        new Date(voucher.expires_at) < new Date()
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }
                    />
                    <span
                      className={
                        new Date(voucher.expires_at) < new Date()
                          ? 'text-red-600 font-medium'
                          : ''
                      }
                    >
                      {new Date(voucher.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px] truncate">
                  {voucher.metadata?.reward_title || 'Reward Voucher'}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No vouchers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
