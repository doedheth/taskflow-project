import { useState, useEffect } from 'react';
import { X, Zap, Sparkles, Wand2, FileText, Loader2 } from 'lucide-react';
import { epicsAPI, usersAPI, departmentsAPI, aiAPI } from '../services/api';
import { User, Department } from '../types';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
];

export default function CreateEpicModal({ onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee_id: '',
    department_id: '',
    due_date: '',
  });

  useEffect(() => {
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
      }
    };
    loadData();
  }, []);

  // AI Text Enhancement
  const handleEnhanceText = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Masukkan judul atau deskripsi terlebih dahulu');
      return;
    }
    
    setIsEnhancing(true);
    try {
      const response = await aiAPI.enhanceText({
        title: formData.title,
        description: formData.description,
        ticket_type: 'epic',
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          title: response.data.enhanced.title || prev.title,
          description: response.data.enhanced.description || prev.description,
        }));
        
        const changes = response.data.changes_made?.length || 0;
        toast.success(`✨ Teks diperbaiki! ${changes} perbaikan dilakukan`);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Gagal memperbaiki teks');
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Auto-generate Description
  const handleAutocomplete = async () => {
    if (!formData.title.trim()) {
      toast.error('Masukkan judul terlebih dahulu');
      return;
    }
    
    setIsAutocompleting(true);
    try {
      const response = await aiAPI.autocomplete({
        title: formData.title,
        ticket_type: 'epic',
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          description: response.data.suggested_description,
        }));
        toast.success('✨ Deskripsi berhasil dibuat!');
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      toast.error('Gagal membuat deskripsi');
    } finally {
      setIsAutocompleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      await epicsAPI.create({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : undefined,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        due_date: formData.due_date || undefined,
      });
      
      toast.success('Epic created successfully!');
      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create epic');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Create New Epic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* AI Enhancement Bar */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-dark-300 flex-1">AI Writing Assistant</span>
            <button
              type="button"
              onClick={handleAutocomplete}
              disabled={isAutocompleting || !formData.title.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isAutocompleting || !formData.title.trim()
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
              title="Generate deskripsi dari judul"
            >
              {isAutocompleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              Generate
            </button>
            <button
              type="button"
              onClick={handleEnhanceText}
              disabled={isEnhancing || (!formData.title && !formData.description)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isEnhancing || (!formData.title && !formData.description)
                  ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600'
              }`}
              title="Perbaiki dan format teks"
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Enhance
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Epic Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g., User Authentication System"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Description
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe the epic scope and goals..."
              minHeight="150px"
              isDark={isDark}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    formData.priority === priority.value
                      ? 'bg-dark-700 border-purple-500/50'
                      : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                  <span className="text-sm text-white">{priority.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignee & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Owner
              </label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="input"
              >
                <option value="">No department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Target Completion Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="input"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
              {isLoading ? 'Creating...' : 'Create Epic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

