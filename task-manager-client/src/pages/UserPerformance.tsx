import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  User,
  Calendar,
  Zap,
  AlertCircle,
  Bug,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface UserData {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department_name?: string;
  department_color?: string;
  created_at: string;
}

interface PerformanceStats {
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  avgResolutionDays: number;
  currentWorkload: number;
  recentCompleted: number;
  recentStoryPoints: number;
}

interface PerformanceData {
  user: UserData;
  stats: PerformanceStats;
  ticketsByStatus: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  weeklyTrend: {
    week: number;
    label: string;
    completed: number;
    points: number;
  }[];
  recentCompletedTickets: {
    id: number;
    ticket_key: string;
    title: string;
    type: string;
    priority: string;
    story_points?: number;
    updated_at: string;
  }[];
  activeTickets: {
    id: number;
    ticket_key: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    story_points?: number;
  }[];
}

const periodOptions = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const statusColors = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#eab308',
  done: '#22c55e',
};

const priorityColors = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

const typeIcons: Record<string, React.ElementType> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
};

export default function UserPerformance() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await usersAPI.getPerformance(parseInt(id), period);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch performance:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
        Failed to load performance data.
      </div>
    );
  }

  const { user, stats, ticketsByStatus, ticketsByPriority, weeklyTrend, recentCompletedTickets, activeTickets } = data;

  const statusData = [
    { name: 'To Do', value: ticketsByStatus.todo, color: statusColors.todo },
    { name: 'In Progress', value: ticketsByStatus.in_progress, color: statusColors.in_progress },
    { name: 'Review', value: ticketsByStatus.review, color: statusColors.review },
    { name: 'Done', value: ticketsByStatus.done, color: statusColors.done },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Low', value: ticketsByPriority.low, color: priorityColors.low },
    { name: 'Medium', value: ticketsByPriority.medium, color: priorityColors.medium },
    { name: 'High', value: ticketsByPriority.high, color: priorityColors.high },
    { name: 'Critical', value: ticketsByPriority.critical, color: priorityColors.critical },
  ].filter(d => d.value > 0);

  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/performance" className="btn btn-secondary btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h1>
              <div className={`flex items-center gap-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                <span>{user.email}</span>
                {user.department_name && (
                  <>
                    <span>•</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${user.department_color}20`,
                        color: user.department_color,
                      }}
                    >
                      {user.department_name}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className={`input w-48 ${isDark ? '' : 'bg-white border-gray-300 text-gray-900'}`}
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`card p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.recentCompleted}</div>
          <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>in {period} days</div>
          <div className={`mt-2 text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
            {stats.totalCompleted} total completed
          </div>
        </div>

        <div className={`card p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Story Points</span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.recentStoryPoints}</div>
          <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>in {period} days</div>
          <div className={`mt-2 text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
            {stats.completedStoryPoints} total points
          </div>
        </div>

        <div className={`card p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.completionRate}%</div>
          <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {stats.totalCompleted} / {stats.totalAssigned} tickets
          </div>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className={`card p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Avg. Resolution</span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.avgResolutionDays}</div>
          <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>days per ticket</div>
          <div className={`mt-2 text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
            {stats.currentWorkload} active tickets
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <div className={`lg:col-span-2 card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Weekly Productivity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="label" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} />
                <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="#8b5cf6"
                  fill="url(#colorPoints)"
                  name="Story Points"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  fill="url(#colorCompleted)"
                  name="Tickets Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Tickets by Status
          </h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                No ticket data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority and Active Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Tickets by Priority
          </h3>
          <div className="h-48">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis type="number" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Tickets">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                No ticket data
              </div>
            )}
          </div>
        </div>

        {/* Active Tickets */}
        <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Clock className="w-5 h-5 text-rose-400" />
            Current Workload ({activeTickets.length})
          </h3>
          {activeTickets.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeTickets.map((ticket) => {
                const TypeIcon = typeIcons[ticket.type] || CheckSquare;
                return (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-100'}`}
                  >
                    <TypeIcon className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-500'}`} />
                    <span className="text-xs font-mono text-blue-400">{ticket.ticket_key}</span>
                    <span className={`text-sm truncate flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${statusColors[ticket.status as keyof typeof statusColors]}20`,
                        color: statusColors[ticket.status as keyof typeof statusColors],
                      }}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {ticket.story_points && (
                      <span className="text-xs text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                        {ticket.story_points} SP
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={`h-48 flex items-center justify-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              No active tickets
            </div>
          )}
        </div>
      </div>

      {/* Recent Completed */}
      <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Recently Completed
        </h3>
        {recentCompletedTickets.length > 0 ? (
          <div className="space-y-2">
            {recentCompletedTickets.map((ticket) => {
              const TypeIcon = typeIcons[ticket.type] || CheckSquare;
              return (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isDark ? 'bg-dark-800/50 hover:bg-dark-700/50' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <TypeIcon className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-500'}`} />
                  <span className="text-sm font-mono text-blue-400">{ticket.ticket_key}</span>
                  <span className={`text-sm flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${priorityColors[ticket.priority as keyof typeof priorityColors]}20`,
                      color: priorityColors[ticket.priority as keyof typeof priorityColors],
                    }}
                  >
                    {ticket.priority}
                  </span>
                  {ticket.story_points && (
                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                      {ticket.story_points} SP
                    </span>
                  )}
                  <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={`h-32 flex items-center justify-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            No completed tickets yet
          </div>
        )}
      </div>
    </div>
  );
}
