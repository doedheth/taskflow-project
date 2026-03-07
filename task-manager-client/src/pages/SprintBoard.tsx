import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sprintsAPI, ticketsAPI } from '../services/api';
import { Sprint, Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Timer,
  Target,
  Calendar,
  Play,
  CheckCircle2,
  Clock,
  Bug,
  CheckSquare,
  BookOpen,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const columns = [
  { id: 'todo', label: 'To Do', color: 'border-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-500' },
  { id: 'review', label: 'Review', color: 'border-yellow-500' },
  { id: 'done', label: 'Done', color: 'border-green-500' },
];

export default function SprintBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [backlogTickets, setBacklogTickets] = useState<Ticket[]>([]);

  const loadSprint = async () => {
    try {
      const response = await sprintsAPI.getById(parseInt(id!));
      setSprint(response.data);
    } catch (error) {
      console.error('Failed to load sprint:', error);
      toast.error('Sprint not found');
      navigate('/sprints');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSprint();
  }, [id]);

  const loadBacklog = async () => {
    try {
      const response = await sprintsAPI.getBacklog();
      setBacklogTickets(response.data);
    } catch (error) {
      console.error('Failed to load backlog:', error);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      await ticketsAPI.updateStatus(ticketId, newStatus);
      loadSprint();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddToSprint = async (ticketId: number) => {
    try {
      await sprintsAPI.addTicket(parseInt(id!), ticketId);
      toast.success('Ticket added to sprint');
      loadSprint();
      loadBacklog();
    } catch (error) {
      toast.error('Failed to add ticket');
    }
  };

  const handleRemoveFromSprint = async (ticketId: number) => {
    try {
      await sprintsAPI.removeTicket(parseInt(id!), ticketId);
      toast.success('Ticket removed from sprint');
      loadSprint();
    } catch (error) {
      toast.error('Failed to remove ticket');
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!sprint) return null;

  const getDaysRemaining = () => {
    if (!sprint.end_date) return null;
    return differenceInDays(new Date(sprint.end_date), new Date());
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sprints')}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className={`flex items-center gap-2 text-sm mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <span className={`badge border ${
              sprint.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              sprint.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {sprint.status === 'active' && <Play className="w-3 h-3 mr-1" />}
              {sprint.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {sprint.status === 'planning' && <Clock className="w-3 h-3 mr-1" />}
              {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
            </span>
            {sprint.start_date && sprint.end_date && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d')}
                </span>
              </>
            )}
            {daysRemaining !== null && sprint.status === 'active' && (
              <>
                <span>•</span>
                <span className={daysRemaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {daysRemaining >= 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days overdue`}
                </span>
              </>
            )}
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sprint.name}</h1>
          {sprint.goal && (
            <p className={`mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{sprint.goal}</p>
          )}
        </div>
        {canManage && sprint.status !== 'completed' && (
          <button
            onClick={() => {
              loadBacklog();
              setShowAddModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Issues
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className={`card p-4 ${isDark ? '' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Target className={`w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Issues:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {sprint.completed_tickets || 0}/{sprint.total_tickets || 0}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Story Points:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {sprint.completed_points || 0}/{sprint.total_points || 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-48 h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all"
                style={{ width: `${sprint.progress || 0}%` }}
              />
            </div>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{sprint.progress || 0}%</span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTickets = sprint.statusBreakdown?.[column.id as keyof typeof sprint.statusBreakdown] || [];
          const columnPoints = sprint.pointsByStatus?.[column.id as keyof typeof sprint.pointsByStatus] || 0;

          return (
            <div key={column.id} className={`card border-t-4 ${column.color} ${isDark ? '' : 'bg-white shadow-sm'}`}>
              {/* Column Header */}
              <div className={`p-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{column.label}</h3>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    <span>{columnTickets.length}</span>
                    <span>•</span>
                    <span>{columnPoints} pts</span>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                {columnTickets.map((ticket) => {
                  const Icon = typeIcons[ticket.type] || CheckSquare;
                  return (
                    <div
                      key={ticket.id}
                      className={`rounded-xl p-4 border transition-all group ${isDark ? 'bg-dark-800 border-dark-700 hover:border-dark-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="flex items-center gap-2"
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${
                            ticket.type === 'bug' ? 'text-red-400' :
                            ticket.type === 'story' ? 'text-green-400' :
                            'text-blue-400'
                          }`} />
                          <span className={`text-xs font-mono ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{ticket.ticket_key}</span>
                        </Link>
                        <span className={`w-2 h-2 rounded-full ${priorityColors[ticket.priority]}`} title={ticket.priority} />
                      </div>

                      {/* Title */}
                      <Link to={`/tickets/${ticket.id}`}>
                        <h4 className={`text-sm font-medium hover:text-cyan-400 transition-colors mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.title}
                        </h4>
                      </Link>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ticket.assignee_name ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                              {ticket.assignee_name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isDark ? 'bg-dark-700 text-dark-500' : 'bg-gray-200 text-gray-400'}`}>
                              ?
                            </div>
                          )}
                          {ticket.story_points && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                              {ticket.story_points} pts
                            </span>
                          )}
                        </div>

                        {/* Quick Status Change */}
                        {sprint.status === 'active' && (
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className={`text-xs border rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        )}
                      </div>

                      {/* Epic Badge */}
                      {ticket.epic_key && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
                          <Zap className="w-3 h-3" />
                          {ticket.epic_key}
                        </div>
                      )}
                    </div>
                  );
                })}

                {columnTickets.length === 0 && (
                  <div className={`text-center py-8 text-sm ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                    No issues
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Issues Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className={`relative w-full max-w-lg border rounded-2xl shadow-2xl max-h-[80vh] overflow-auto ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 ${isDark ? 'border-dark-700 bg-dark-900' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Issues to Sprint</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className={`text-sm mb-4 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                Select issues from the backlog to add to this sprint.
              </p>
              {backlogTickets.length > 0 ? (
                <div className="space-y-2">
                  {backlogTickets.map((ticket) => {
                    const Icon = typeIcons[ticket.type] || CheckSquare;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => handleAddToSprint(ticket.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isDark ? 'bg-dark-800/50 hover:bg-dark-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          ticket.type === 'bug' ? 'text-red-400' :
                          ticket.type === 'story' ? 'text-green-400' :
                          'text-blue-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{ticket.ticket_key}</span>
                            <span className={`truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {ticket.story_points && (
                              <span className="text-xs text-cyan-400">{ticket.story_points} pts</span>
                            )}
                            {ticket.assignee_name && (
                              <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>• {ticket.assignee_name}</span>
                            )}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-cyan-400" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={isDark ? 'text-dark-500' : 'text-gray-400'}>No issues in backlog</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-dark-600' : 'text-gray-400'}`}>Create new tickets to add to sprints</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
