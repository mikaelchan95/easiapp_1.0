import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types';
import { Loader2, Search, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AdminManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUser(data.user.id);
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentRole?: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating account role:', err);
      alert('Failed to update role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-accent" /></div>;

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h3 className="text-lg font-bold text-brand-dark">Admin User Management</h3>
           <p className="text-sm text-gray-500">Grant or revoke admin access to users.</p>
        </div>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
           <input
             type="text"
             placeholder="Search users..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full text-sm rounded-lg border border-gray-200 py-2 pl-9 pr-4 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
           />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Current Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                   {user.role === 'admin' ? (
                       <Badge variant="success" className="flex items-center gap-1 w-fit">
                           <ShieldCheck size={12} /> Admin
                       </Badge>
                   ) : (
                       <Badge variant="default">User</Badge>
                   )}
                </td>
                <td className="px-4 py-3 text-right">
                    {currentUser === user.id ? (
                        <span className="text-xs text-gray-400 italic">Current User</span>
                    ) : (
                        <button
                            onClick={() => toggleAdminRole(user.id, user.role)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                                user.role === 'admin' 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                : 'text-brand-dark bg-brand-accent/20 hover:bg-brand-accent/40'
                            }`}
                        >
                            {user.role === 'admin' ? (
                                <span className="flex items-center gap-1"><UserX size={14}/> Revoke Admin</span>
                            ) : (
                                <span className="flex items-center gap-1"><UserCheck size={14}/> Make Admin</span>
                            )}
                        </button>
                    )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No users found matching "{searchTerm}"
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
