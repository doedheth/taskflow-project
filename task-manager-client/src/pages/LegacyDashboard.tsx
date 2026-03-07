import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardAPI } from '../services/api';
import { DashboardStats, Activity, Ticket } from '../types';
import {
  Ticket as TicketIcon,
  Users,
  Building2,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bug,
  BookOpen,
  Zap,
  CheckSquare,
  Wrench,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
};

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
  epic: Zap,
};

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, activityRes, ticketsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getActivity(10),
          dashboardAPI.getMyTickets(),
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
        setMyTickets(ticketsRes.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className={`rounded-2xl p-4 md:p-6 border transition-colors
        ${isDark 
          ? 'bg-dark-900/40 border-dark-800/50' 
          : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <h2 className={`text-xl md:text-2xl font-bold mb-1 md:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className={`text-sm md:text-base ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Tickets', value: stats?.overview.totalTickets || 0, icon: TicketIcon, color: 'blue' },
          { label: 'Team Members', value: stats?.overview.totalUsers || 0, icon: Users, color: 'green' },
          { label: 'Departments', value: stats?.overview.totalDepartments || 0, icon: Building2, color: 'violet' },
          { label: 'Overdue', value: stats?.overview.overdueTickets || 0, icon: AlertTriangle, color: 'red' },
        ].map((stat) => (
          <div 
            key={stat.label}
            className={`rounded-2xl p-4 md:p-6 border transition-colors
              ${isDark 
                ? 'bg-dark-900/40 border-dark-800/50' 
                : 'bg-white border-gray-200 shadow-sm'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs md:text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{stat.label}</p>
                <p className={`text-2xl md:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center
                ${stat.color === 'blue' ? 'bg-blue-500/20' : ''}
                ${stat.color === 'green' ? 'bg-green-500/20' : ''}
                ${stat.color === 'violet' ? 'bg-violet-500/20' : ''}
                ${stat.color === 'red' ? 'bg-red-500/20' : ''}
              `}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6
                  ${stat.color === 'blue' ? 'text-blue-400' : ''}
                  ${stat.color === 'green' ? 'text-green-400' : ''}
                  ${stat.color === 'violet' ? 'text-violet-400' : ''}
                  ${stat.color === 'red' ? 'text-red-400' : ''}
                `} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PM Alerts - Show if there are overdue PM or PM due this week */}
      {(stats?.overview.overduePM && stats.overview.overduePM > 0) || (stats?.pmDueThisWeek && stats.pmDueThisWeek.length > 0) ? (
        <div className={`rounded-2xl p-4 md:p-6 border transition-colors
          ${isDark 
            ? 'bg-orange-900/20 border-orange-800/50' 
            : 'bg-orange-50 border-orange-200'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>
              <Wrench className="w-5 h-5" />
              Preventive Maintenance Alerts
              {stats?.overview.overduePM && stats.overview.overduePM > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>
                  {stats.overview.overduePM} Overdue
                </span>
              )}
            </h3>
            <Link 
              to="/maintenance-calendar" 
              className={`text-sm font-medium ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'}`}
            >
              Kelola PM →
            </Link>
          </div>
          
          {stats?.pmDueThisWeek && stats.pmDueThisWeek.length > 0 && (
            <div className="space-y-2">
              {stats.pmDueThisWeek.map((pm) => (
                <Link
                  key={pm.id}
                  to="/maintenance-calendar"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                    ${isDark 
                      ? 'bg-dark-800/50 hover:bg-dark-800' 
                      : 'bg-white hover:bg-gray-50'
                    } border ${isDark ? 'border-dark-700' : 'border-orange-100'}`}
                >
                  <Calendar className={`w-4 h-4 flex-shrink-0 ${
                    pm.status === 'overdue' ? 'text-red-500' :
                    pm.status === 'due_today' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {pm.asset_code}
                      </span>
                      <span className={`text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {pm.title}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {pm.asset_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      pm.status === 'overdue' 
                        ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
                        : pm.status === 'due_today'
                        ? (isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                        : (isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {pm.status === 'overdue' ? '⚠️ Overdue' : 
                       pm.status === 'due_today' ? '📅 Hari Ini' : 
                       new Date(pm.next_due).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Tickets by Status */}
        <div className={`rounded-2xl p-4 md:p-6 border transition-colors
          ${isDark 
            ? 'bg-dark-900/40 border-dark-800/50' 
            : 'bg-white border-gray-200 shadow-sm'
          }`}>
          <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            Tickets by Status
          </h3>
          <div className="space-y-3">
            {stats?.ticketsByStatus.map((item) => {
              const total = stats.overview.totalTickets || 1;
              const percentage = Math.round((item.count / total) * 100);
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`capitalize ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{item.status.replace('_', ' ')}</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{item.count}</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-800' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full ${statusColors[item.status]} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Assigned Tickets */}
        <div className={`rounded-2xl p-4 md:p-6 border transition-colors
          ${isDark 
            ? 'bg-dark-900/40 border-dark-800/50' 
            : 'bg-white border-gray-200 shadow-sm'
          }`}>
          <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            My Assigned Tickets
          </h3>
          <div className="space-y-2">
            {myTickets.slice(0, 5).map((ticket) => {
              const Icon = typeIcons[ticket.type] || CheckSquare;
              return (
                <Link
                  key={ticket.id}
                  to={`/tickets/${ticket.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors group
                    ${isDark ? 'hover:bg-dark-800/50' : 'hover:bg-gray-100'}`}
                >
                  <Icon className={`w-4 h-4 ${
                    ticket.type === 'bug' ? 'text-red-400' :
                    ticket.type === 'story' ? 'text-green-400' :
                    ticket.type === 'epic' ? 'text-purple-400' :
                    'text-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate group-hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {ticket.title}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>{ticket.ticket_key}</p>
                  </div>
                  <span className={`badge badge-${ticket.type}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </Link>
              );
            })}
            {myTickets.length === 0 && (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>No tickets assigned</p>
            )}
            {myTickets.length > 5 && (
              <Link to="/tickets?assignee=me" className="block text-center text-sm text-blue-400 hover:text-blue-300 pt-2">
                View all ({myTickets.length})
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`rounded-2xl p-4 md:p-6 border transition-colors
          ${isDark 
            ? 'bg-dark-900/40 border-dark-800/50' 
            : 'bg-white border-gray-200 shadow-sm'
          }`}>
          <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {activity.user_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.user_name}</span>
                    {' '}{activity.action.replace('_', ' ')}{' '}
                    {activity.ticket_key && (
                      <Link to={`/tickets/${activity.entity_id}`} className="text-blue-400 hover:underline">
                        {activity.ticket_key}
                      </Link>
                    )}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Tickets by Department */}
      {stats?.ticketsByDepartment && stats.ticketsByDepartment.length > 0 && (
        <div className={`rounded-2xl p-4 md:p-6 border transition-colors
          ${isDark 
            ? 'bg-dark-900/40 border-dark-800/50' 
            : 'bg-white border-gray-200 shadow-sm'
          }`}>
          <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tickets by Department</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.ticketsByDepartment.map((dept) => (
              <div
                key={dept.name}
                className={`p-4 rounded-xl border
                  ${isDark 
                    ? 'border-dark-700 bg-dark-800/30' 
                    : 'border-gray-200 bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dept.name}</span>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dept.count}</p>
                <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>tickets</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
