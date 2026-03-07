import { useState } from 'react';
import { X, Timer } from 'lucide-react';
import { sprintsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateSprintModal({ onClose, onCreated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
  });

  // Generate default sprint name
  const generateSprintName = () => {
    const month = new Date().toLocaleString('default', { month: 'short' });
    const year = new Date().getFullYear();
    return `Sprint ${month} ${year}`;
  };

  // Set default dates (2 weeks from today)
  const setDefaultDates = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    setFormData({
      ...formData,
      start_date: today.toISOString().split('T')[0],
      end_date: twoWeeksLater.toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a sprint name');
      return;
    }

    setIsLoading(true);
    try {
      await sprintsAPI.create({
        name: formData.name,
        goal: formData.goal || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
      
      toast.success('Sprint created successfully!');
      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create sprint');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Create New Sprint</h3>
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
          {/* Sprint Name */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Sprint Name <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input flex-1"
                placeholder="e.g., Sprint 1 - Foundation"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, name: generateSprintName() })}
                className="btn btn-secondary"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Sprint Goal */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Sprint Goal
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="input min-h-[80px] resize-none"
              placeholder="What do you want to achieve in this sprint?"
            />
          </div>

          {/* Dates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-dark-300">
                Sprint Duration
              </label>
              <button
                type="button"
                onClick={setDefaultDates}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Set 2-week sprint
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-dark-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25">
              {isLoading ? 'Creating...' : 'Create Sprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

