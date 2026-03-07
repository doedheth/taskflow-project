import { useState, useEffect } from 'react';
import { departmentsAPI } from '../services/api';
import { Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  Plus,
  Users,
  Ticket,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const colorOptions = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function Departments() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const canManage = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor';

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        description: dept.description || '',
        color: dept.color,
      });
    } else {
      setEditingDept(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    try {
      if (editingDept) {
        await departmentsAPI.update(editingDept.id, formData);
        toast.success('Department updated');
      } else {
        await departmentsAPI.create(formData);
        toast.success('Department created');
      }
      setShowModal(false);
      loadDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      await departmentsAPI.delete(id);
      toast.success('Department deleted');
      loadDepartments();
    } catch (error) {
      toast.error('Failed to delete department');
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
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Departments</h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Manage team departments and groups</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Department
          </button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className={`rounded-2xl p-6 border transition-colors ${isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${dept.color}20` }}
                >
                  <Building2 className="w-6 h-6" style={{ color: dept.color }} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dept.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{dept.description || 'No description'}</p>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(dept)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className={`p-2 rounded-lg hover:bg-red-500/10 transition-colors ${isDark ? 'text-dark-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`flex items-center gap-4 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <div className={`flex items-center gap-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                <Users className="w-4 h-4" />
                <span className="text-sm">{dept.member_count || 0} members</span>
              </div>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-dark-600' : 'text-gray-400'}`} />
            <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>No departments yet</p>
            {canManage && (
              <button onClick={() => openModal()} className="btn btn-primary mt-4">
                <Plus className="w-4 h-4" />
                Create First Department
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingDept ? 'Edit Department' : 'New Department'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  placeholder="Department name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border min-h-[80px] resize-none transition-colors ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        formData.color === color ? `ring-2 ring-offset-2 scale-110 ${isDark ? 'ring-white ring-offset-dark-900' : 'ring-gray-900 ring-offset-white'}` : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

