import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { Loader2, Search, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Helper to deduce status color
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'inactive': return 'error';
    default: return 'default';
  }
};

export default function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Join with companies table to get company name
      const { data, error } = await supabase
        .from('users')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">Customers</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark transition-all"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Points</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-brand-light/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand-dark font-bold group-hover:bg-brand-accent/20 transition-colors">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link to={`/customers/${customer.id}`} className="font-medium text-brand-dark hover:text-brand-accent transition-colors block">
                          {customer.name}
                        </Link>
                        <div className="text-xs text-gray-400">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-brand-dark/70 capitalize">{customer.role}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {/* @ts-expect-error */}
                    {customer.companies?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-900">{customer.points || 0}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                     <Badge variant={getStatusVariant('active')}>Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
             <div className="flex flex-col items-center justify-center">
              <UserIcon className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Try adjusting your search terms.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
