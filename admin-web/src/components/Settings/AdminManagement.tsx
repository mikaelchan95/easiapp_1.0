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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--color-primary-text)]" /></div>;

  return (
    <div className="space-y-6 bg-[var(--bg-card)] p-6 rounded-lg border border-[var(--border-default)] shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h3 className="text-lg font-bold text-[var(--text-primary)]">Admin User Management</h3>
           <p className="text-sm text-[var(--text-secondary)]">Grant or revoke admin access to users.</p>
        </div>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
           <input
             type="text"
             placeholder="Search users..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full text-sm rounded-lg border border-[var(--border-default)] py-2 pl-9 pr-4 focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--color-primary-bg)]"
           />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-secondary)] font-semibold">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Current Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
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
                        <span className="text-xs text-[var(--text-tertiary)] italic">Current User</span>
                    ) : (
                        <button
                            onClick={() => toggleAdminRole(user.id, user.role)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                                user.role === 'admin' 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                : 'text-[var(--text-primary)] bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/40'
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
                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-secondary)]">
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
