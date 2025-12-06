import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Edit2, Trash2, Plus, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { User } from '../../types';

interface CompanyEmployeesProps {
  companyId: string;
  employees: User[];
  onRefresh: () => void;
}

export const CompanyEmployees = ({
  companyId,
  employees,
  onRefresh,
}: CompanyEmployeesProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Add Employee State
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searchError, setSearchError] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('Employee');

  // Edit Employee State
  const [editRole, setEditRole] = useState('');

  const handleSearchUser = async () => {
    setSearchError('');
    setSearchResult(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', searchEmail)
        .single();

      if (error) {
        setSearchError('User not found. They must be registered first.');
        return;
      }

      if (data.company_id) {
        setSearchError('User is already attached to a company.');
        return;
      }

      setSearchResult(data);
    } catch (err) {
      setSearchError('User not found.');
    }
  };

  const handleAddEmployee = async () => {
    if (!searchResult) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          company_id: companyId,
          account_type: 'company',
          role: newEmployeeRole,
        })
        .eq('id', searchResult.id);

      if (error) throw error;

      setIsAddModalOpen(false);
      setSearchEmail('');
      setSearchResult(null);
      onRefresh();
      alert('Employee added successfully');
    } catch (err: any) {
      alert('Failed to add employee: ' + err.message);
    }
  };

  const handleRemoveEmployee = async (userId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this employee? They will become an individual user.'
      )
    )
      return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          company_id: null,
          account_type: 'individual',
          role: null,
        })
        .eq('id', userId);

      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert('Failed to remove employee: ' + err.message);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: editRole })
        .eq('id', selectedEmployee.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      onRefresh();
    } catch (err: any) {
      alert('Failed to update employee: ' + err.message);
    }
  };

  const openEditModal = (employee: User) => {
    setSelectedEmployee(employee);
    setEditRole(employee.role || 'Employee');
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-brand-dark">Team Members</h3>
        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Add Employee
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Joined At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map(employee => (
                <tr
                  key={employee.id}
                  className="hover:bg-brand-light/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    <Link
                      to={`/customers/${employee.id}`}
                      className="hover:text-brand-accent transition-colors"
                    >
                      {employee.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {employee.role || 'Employee'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900">{employee.email}</span>
                      <span className="text-xs text-brand-accent/80 hover:text-brand-accent transition-colors cursor-pointer flex items-center gap-1">
                        <Mail size={10} /> Send Email
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(employee.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="p-1 text-gray-400 hover:text-brand-dark transition-colors"
                        title="Edit Role"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveEmployee(employee.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-brand-dark">
                Add Employee
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSearchEmail('');
                  setSearchResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {!searchResult ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Search for an existing user by email to add them to this
                  company.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter user email"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleSearchUser()}
                  />
                  <Button onClick={handleSearchUser} disabled={!searchEmail}>
                    <Search size={18} />
                  </Button>
                </div>
                {searchError && (
                  <p className="text-sm text-red-500">{searchError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-800">
                    User Found:
                  </p>
                  <p className="font-bold text-brand-dark">
                    {searchResult.name}
                  </p>
                  <p className="text-sm text-gray-600">{searchResult.email}</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Assign Role
                  </label>
                  <select
                    value={newEmployeeRole}
                    onChange={e => setNewEmployeeRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-brand-dark focus:outline-none"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setSearchResult(null)}
                  >
                    Back
                  </Button>
                  <Button onClick={handleAddEmployee}>Add to Company</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-brand-dark">
              Edit Employee
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Updating role for <strong>{selectedEmployee.name}</strong>
            </p>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-brand-dark focus:outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateEmployee}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
