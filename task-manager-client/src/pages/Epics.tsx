import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { epicsAPI } from '../services/api';
import { Epic } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Zap,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import CreateEpicModal from '../components/CreateEpicModal';

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
};

export default function Epics() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadEpics = async () => {
    try {
      const response = await epicsAPI.getAll();
      setEpics(response.data);
    } catch (error) {
      console.error('Failed to load epics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEpics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Zap className="w-7 h-7 text-purple-400" />
            Epics
          </h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Large bodies of work that can be broken into smaller tasks</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Epic
        </button>
      </div>

      {/* Epic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {epics.map((epic) => (
          <Link
            key={epic.id}
            to={`/epics/${epic.id}`}
            className={`rounded-2xl p-6 border transition-all group ${isDark ? 'bg-dark-800/50 border-dark-700 hover:border-purple-500/50' : 'bg-white border-gray-200 hover:border-purple-400 shadow-sm'}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs font-mono text-purple-400">{epic.ticket_key}</span>
                  <span className={`ml-2 w-2 h-2 rounded-full inline-block ${priorityColors[epic.priority]}`} title={epic.priority} />
                </div>
              </div>
              <span className={`badge border ${
                epic.status === 'done' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                epic.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                epic.status === 'review' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}>
                {epic.status.replace('_', ' ')}
              </span>
            </div>

            {/* Title */}
            <h3 className={`text-lg font-semibold mb-2 group-hover:text-purple-400 transition-colors line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {epic.title}
            </h3>

            {/* Description */}
            {epic.description && (
              <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {epic.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Progress</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{epic.progress || 0}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${epic.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {epic.doneChildren || 0}/{epic.totalChildren || 0} done
                </span>
              </div>
              
              {epic.due_date && (
                <span className={`flex items-center gap-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <Calendar className="w-4 h-4" />
                  {format(new Date(epic.due_date), 'MMM d')}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                {epic.assignee_name ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                      {epic.assignee_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{epic.assignee_name}</span>
                  </div>
                ) : (
                  <span className={`text-sm ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Unassigned</span>
                )}
              </div>
              <ArrowRight className={`w-4 h-4 group-hover:text-purple-400 group-hover:translate-x-1 transition-all ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
            </div>
          </Link>
        ))}

        {epics.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Zap className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-dark-600' : 'text-gray-400'}`} />
            <p className={`mb-4 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>No epics yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create First Epic
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEpicModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => loadEpics()}
        />
      )}
    </div>
  );
}

