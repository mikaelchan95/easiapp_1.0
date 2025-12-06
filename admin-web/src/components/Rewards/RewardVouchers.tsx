import { Search } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Voucher {
  id: string;
  voucher_code: string;
  voucher_value: number;
  voucher_status: 'active' | 'used' | 'expired' | 'cancelled';
  expires_at: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  redemption?: {
    reward?: {
      title: string;
    };
  };
  created_at: string;
}

interface Props {
  vouchers: Voucher[];
  isLoading: boolean;
}

export const RewardVouchers = ({ vouchers, isLoading }: Props) => {
  if (isLoading)
    return <div className="text-center py-12">Loading vouchers...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-brand-dark">Issued Vouchers</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search code or user..."
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-brand-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Reward Source</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vouchers.map(voucher => (
              <tr key={voucher.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium text-brand-dark">
                  {voucher.voucher_code}
                </td>
                <td className="px-6 py-4 font-bold text-green-600">
                  ${voucher.voucher_value}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-brand-dark">
                      {voucher.user?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {voucher.user?.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {voucher.redemption?.reward?.title || 'System'}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      voucher.voucher_status === 'active'
                        ? 'success'
                        : voucher.voucher_status === 'used'
                          ? 'default'
                          : 'error'
                    }
                  >
                    {voucher.voucher_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(voucher.expires_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No vouchers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
