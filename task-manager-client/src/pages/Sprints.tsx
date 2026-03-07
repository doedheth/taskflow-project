import { generateSprintSummaryPDF } from '../utils/pdfGenerators';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sprintsAPI } from '../services/api';
import { Sprint } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Timer,
  Plus,
  Calendar,
  Target,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Download, // Added Download icon
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import CreateSprintModal from '../components/CreateSprintModal';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  planning: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const statusIcons: Record<string, React.ElementType> = {
  planning: Clock,
  active: Play,
  completed: CheckCircle2,
};

export default function Sprints() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const loadSprints = async () => {
    try {
      const response = await sprintsAPI.getAll();
      setSprints(response.data);
    } catch (error) {
      console.error('Failed to load sprints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSprints();
  }, []);

  const handleStartSprint = async (sprintId: number) => {
    try {
      await sprintsAPI.start(sprintId);
      toast.success('Sprint started!');
      loadSprints();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async (sprintId: number) => {
    if (!confirm('Complete this sprint? Incomplete tickets will be moved to backlog.')) return;
    try {
      await sprintsAPI.complete(sprintId, true);
      toast.success('Sprint completed!');
      loadSprints();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete sprint');
    }
  };

  const canManageSprints = user?.role === 'admin' || user?.role === 'manager';

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    return differenceInDays(end, today);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const activeSprint = sprints.find(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const completedSprints = sprints.filter(s => s.status === 'completed');

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateSprintSummaryPDF(sprints);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Timer className="w-7 h-7 text-cyan-400" />
            Sprints
          </h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Manage your agile sprints and iterations</p>
        </div>
        {canManageSprints && (
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary"
              disabled={isGeneratingPDF}
            >
              <Download className="w-4 h-4" /> {/* Added Download icon */}
              Export PDF
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              New Sprint
            </button>
          </div>
        )}
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <div className={`rounded-2xl p-6 border transition-colors ${isDark ? 'bg-gradient-to-br from-green-500/5 to-transparent border-green-500/30' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 mb-2">
                <Play className="w-3 h-3 mr-1" />
                Active Sprint
              </span>
              <Link to={`/sprints/${activeSprint.id}`}>
                <h2 className={`text-xl font-semibold hover:text-cyan-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeSprint.name}
                </h2>
              </Link>
              {activeSprint.goal && (
                <p className={`mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{activeSprint.goal}</p>
              )}
            </div>
            <div className="text-right">
              {activeSprint.end_date && (
                <div className="text-sm">
                  {getDaysRemaining(activeSprint.end_date) >= 0 ? (
                    <span className="text-green-400">
                      {getDaysRemaining(activeSprint.end_date)} days left
                    </span>
                  ) : (
                    <span className="text-red-400">
                      {Math.abs(getDaysRemaining(activeSprint.end_date))} days overdue
                    </span>
                  )}
                </div>
              )}
              {canManageSprints && (
                <button
                  onClick={() => handleCompleteSprint(activeSprint.id)}
                  className="btn btn-secondary mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Sprint
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>
                {activeSprint.completed_points || 0} / {activeSprint.total_points || 0} story points
              </span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeSprint.progress || 0}%</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-green-100'}`}>
              <div
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${activeSprint.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-dark-800/50' : 'bg-white/50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeSprint.total_tickets || 0}</p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Total Issues</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-dark-800/50' : 'bg-white/50'}`}>
              <p className="text-2xl font-bold text-green-400">{activeSprint.completed_tickets || 0}</p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Completed</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-dark-800/50' : 'bg-white/50'}`}>
              <p className="text-2xl font-bold text-cyan-400">{activeSprint.total_points || 0}</p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Story Points</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-dark-800/50' : 'bg-white/50'}`}>
              <p className="text-2xl font-bold text-yellow-400">
                {(activeSprint.total_tickets || 0) - (activeSprint.completed_tickets || 0)}
              </p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Remaining</p>
            </div>
          </div>

          <Link
            to={`/sprints/${activeSprint.id}`}
            className="btn btn-secondary w-full mt-4 justify-center"
          >
            View Sprint Board
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Clock className="w-5 h-5 text-slate-400" />
            Planned Sprints ({planningSprints.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planningSprints.map((sprint) => (
              <div key={sprint.id} className={`rounded-2xl p-5 border transition-all group ${isDark ? 'bg-dark-800/50 border-dark-700 hover:border-cyan-500/50' : 'bg-white border-gray-200 hover:border-cyan-400 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`badge border ${statusColors[sprint.status]}`}>
                    <Clock className="w-3 h-3 mr-1" />
                    Planning
                  </span>
                  {canManageSprints && !activeSprint && (
                    <button
                      onClick={() => handleStartSprint(sprint.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                  )}
                </div>

                <Link to={`/sprints/${sprint.id}`}>
                  <h4 className={`text-lg font-semibold group-hover:text-cyan-400 transition-colors mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {sprint.name}
                  </h4>
                </Link>

                {sprint.goal && (
                  <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{sprint.goal}</p>
                )}

                <div className={`flex items-center justify-between text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {sprint.total_tickets || 0} issues
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {sprint.total_points || 0} pts
                  </span>
                </div>

                {sprint.start_date && sprint.end_date && (
                  <div className={`flex items-center gap-1 text-xs mt-3 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                    <Calendar className="w-3 h-3" />
                    {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            Completed Sprints ({completedSprints.length})
          </h3>
          <div className="space-y-2">
            {completedSprints.slice(0, 5).map((sprint) => (
              <Link
                key={sprint.id}
                to={`/sprints/${sprint.id}`}
                className={`rounded-2xl p-4 flex items-center justify-between border transition-all group ${isDark ? 'bg-dark-800/50 border-dark-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className={`font-medium group-hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {sprint.name}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {sprint.completed_tickets || 0}/{sprint.total_tickets || 0} completed • {sprint.completed_points || 0} pts
                    </p>
                  </div>
                </div>
                <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  {sprint.end_date && format(new Date(sprint.end_date), 'MMM d, yyyy')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sprints.length === 0 && (
        <div className="text-center py-12">
          <Timer className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-dark-600' : 'text-gray-400'}`} />
          <p className={`mb-4 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>No sprints yet</p>
          {canManageSprints && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create First Sprint
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSprintModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => loadSprints()}
        />
      )}
    </div>
  );
}

