import { useState, useEffect, useMemo } from 'react';
import AGGridWrapper, { ColDef } from '../components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';
import { usersAPI, departmentsAPI } from '../services/api';
import { User, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Users as UsersIcon,
  Search,
  Shield,
  Crown,
  User as UserIcon,
  Edit2,
  Trash2,
  Key,
  X,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const roleIcons: Record<string, React.ElementType> = {
  admin: Crown,
  manager: Shield,
  supervisor: Eye,
  member: UserIcon,
};

const roleColors: Record<string, string> = {
  admin: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  manager: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  supervisor: 'text-green-400 bg-green-500/20 border-green-500/30',
  member: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'member',
    department_id: '',
  });

  const loadData = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        usersAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const columnDefs = useMemo<ColDef<User>[]>(() => [
    {
      headerName: 'User',
      field: 'name',
      minWidth: 250,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        const user = params.data;
        return (
          <div className="flex items-center gap-2" title={user.email}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium truncate" style={{ color: 'var(--color-text)' }}>{user.name}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Email',
      field: 'email',
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        return (
          <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {params.data.email}
          </span>
        );
      },
    },
    {
      headerName: 'Role',
      field: 'role',
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        const user = params.data;
        const RoleIcon = roleIcons[user.role] || UserIcon;
        return (
          <span className={`badge border ${roleColors[user.role]} flex items-center gap-1 w-fit`}>
            <RoleIcon className="w-3 h-3" />
            {user.role}
          </span>
        );
      },
    },
    {
      headerName: 'Department',
      field: 'department_name',
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        const user = params.data;
        if (user.department_name) {
          return (
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.department_color }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>{user.department_name}</span>
            </div>
          );
        }
        return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
      },
    },
    {
      headerName: 'Joined',
      field: 'created_at',
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        return (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {format(new Date(params.data.created_at), 'MMM d, yyyy')}
          </span>
        );
      },
    },
    {
      headerName: 'Actions',
      field: 'id',
      minWidth: 120,
      maxWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<User>) => {
        if (!params.data) return null;
        const user = params.data;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEdit(user)}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Edit User"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleResetPassword(user.id)}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Reset Password"
            >
              <Key className="w-4 h-4" />
            </button>
            {user.id !== currentUser?.id && (
              <button
                onClick={() => handleDelete(user.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [currentUser?.id]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await usersAPI.update(editingUser.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        department_id: editForm.department_id ? parseInt(editForm.department_id) : undefined,
      });
      toast.success('User updated');
      setShowEditModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersAPI.delete(userId);
      toast.success('User deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Enter new password (leave empty for default "password123"):');
    if (newPassword === null) return;

    try {
      const response = await usersAPI.resetPassword(userId, newPassword || undefined);
      toast.success(`Password reset to: ${response.data.newPassword}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users</h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Manage team members and their roles</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className={`pl-10 w-64 px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white placeholder-dark-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {users.filter((u) => u.role === 'admin').length}
            </p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Admins</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {users.filter((u) => u.role === 'manager').length}
            </p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Managers</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Eye className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {users.filter((u) => u.role === 'supervisor').length}
            </p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Supervisors</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {users.filter((u) => u.role === 'member').length}
            </p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Members</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <AGGridWrapper<User>
        rowData={filteredUsers}
        columnDefs={columnDefs}
        loading={isLoading}
        height={500}
        emptyMessage="No users found"
      />

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="member">Member</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>Department</label>
                <select
                  value={editForm.department_id}
                  onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="">No department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

