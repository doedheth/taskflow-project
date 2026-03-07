import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Loader2,
  Users,
  CheckCircle2,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Trophy,
  Medal,
  Award,
  HelpCircle,
  CalendarDays,
} from 'lucide-react';

interface UserPerformance {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department_name?: string;
  department_color?: string;
  stats: {
    totalAssigned: number;
    totalCompleted: number;
    completedPoints: number;
    recentCompleted: number;
    recentPoints: number;
    currentWorkload: number;
    todayLoad: number;
    completionRate: number;
  };
}

interface TeamData {
  period: number;
  teamTotals: {
    totalAssigned: number;
    totalCompleted: number;
    completedPoints: number;
    recentCompleted: number;
    recentPoints: number;
    currentWorkload: number;
    todayLoad: number;
  };
  members: UserPerformance[];
}

const periodOptions = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

// Tooltip Component
function Tooltip({ text, children, position = 'top' }: { text: string; children: React.ReactNode; position?: 'top' | 'bottom' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const isTop = position === 'top';
  
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div className={`absolute left-1/2 -translate-x-1/2 px-2 py-1.5 text-[11px] leading-tight rounded-md 
        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 
        whitespace-normal z-50 w-48 text-center
        ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
        ${isDark ? 'bg-dark-600 text-white shadow-lg' : 'bg-gray-800 text-white shadow-lg'}`}>
        {text}
        <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent 
          ${isTop 
            ? `top-full ${isDark ? 'border-t-dark-600' : 'border-t-gray-800'}` 
            : `bottom-full ${isDark ? 'border-b-dark-600' : 'border-b-gray-800'}`
          }`} />
      </div>
    </div>
  );
}

export default function TeamPerformance() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await usersAPI.getTeamPerformance(period);
        setTeamData(response.data);
      } catch (error) {
        console.error('Failed to fetch team performance:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!teamData || !teamData.members || !teamData.teamTotals) {
    return (
      <div className={`p-6 text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
        Failed to load team performance data.
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className={`font-medium w-5 text-center ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>{index + 1}</span>;
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Team Performance
          </h1>
          <p className={`mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Track and compare team member productivity</p>
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

      {/* Team Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`card p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Team Size</span>
            <Tooltip text="Jumlah anggota tim yang aktif">
              <HelpCircle className="w-3 h-3 text-blue-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.members.length}</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
            <Tooltip text={`Jumlah tiket unik yang diselesaikan dalam ${period} hari terakhir`}>
              <HelpCircle className="w-3 h-3 text-green-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.recentCompleted}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>in {period} days</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Story Points</span>
            <Tooltip text={`Total story points yang diselesaikan dalam ${period} hari terakhir`}>
              <HelpCircle className="w-3 h-3 text-purple-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.recentPoints}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>in {period} days</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total Completed</span>
            <Tooltip text="Jumlah total tiket unik yang pernah diselesaikan (all time)">
              <HelpCircle className="w-3 h-3 text-cyan-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.totalCompleted}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>all time</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">Total Points</span>
            <Tooltip text="Total story points yang pernah diselesaikan (all time)">
              <HelpCircle className="w-3 h-3 text-amber-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.completedPoints}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>all time</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Active Workload</span>
            <Tooltip text="Jumlah tiket dengan status 'To Do' atau 'In Progress'">
              <HelpCircle className="w-3 h-3 text-rose-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.currentWorkload}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>tickets</div>
        </div>

        <div className={`card p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 ${isDark ? '' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-medium">Today's Load</span>
            <Tooltip text="Tiket yang due today, dibuat hari ini, atau diupdate hari ini (status aktif)">
              <HelpCircle className="w-3 h-3 text-orange-400/60 cursor-help" />
            </Tooltip>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{teamData.teamTotals.todayLoad || 0}</div>
          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>tickets</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className={`card overflow-hidden ${isDark ? '' : 'bg-white shadow-sm'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-700 bg-dark-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Trophy className="w-5 h-5 text-yellow-400" />
            Performance Leaderboard
          </h2>
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Ranked by story points delivered in the selected period</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-wider border-b ${isDark ? 'text-dark-400 border-dark-700' : 'text-gray-500 border-gray-200'}`}>
                <th className="px-6 py-3 w-12">Rank</th>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text={`Story points yang diselesaikan dalam ${period} hari terakhir. Digunakan untuk ranking.`} position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Recent Points
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text={`Jumlah tiket yang diselesaikan dalam ${period} hari terakhir`} position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Recent Completed
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text="Total story points yang pernah diselesaikan user (all time)" position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Total Points
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text="Total tiket yang pernah diselesaikan user (all time)" position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Total Completed
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text="Jumlah tiket aktif (To Do / In Progress) yang di-assign ke user" position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Workload
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 text-center">
                  <Tooltip text="Tiket due today, dibuat hari ini, atau diupdate hari ini" position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Today
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3">
                  <Tooltip text="Persentase tiket yang diselesaikan dari total tiket yang di-assign (Total Completed / Total Assigned × 100)" position="bottom">
                    <span className="inline-flex items-center gap-1 cursor-help">
                      Completion Rate
                      <HelpCircle className="w-3 h-3 opacity-50" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-6 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-dark-800' : 'divide-gray-100'}`}>
              {teamData.members.map((member, index) => (
                <tr
                  key={member.id}
                  className={`transition-colors ${
                    isDark 
                      ? `hover:bg-dark-800/50 ${index < 3 ? 'bg-dark-800/30' : ''}`
                      : `hover:bg-gray-50 ${index < 3 ? 'bg-blue-50/30' : ''}`
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</div>
                        <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.department_name ? (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${member.department_color}20`,
                          color: member.department_color,
                        }}
                      >
                        {member.department_name}
                      </span>
                    ) : (
                      <span className={isDark ? 'text-dark-500' : 'text-gray-400'}>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-purple-400">
                      {member.stats.recentPoints}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-green-400">
                      {member.stats.recentCompleted}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{member.stats.completedPoints}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{member.stats.totalCompleted}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.stats.currentWorkload > 5
                          ? 'bg-red-500/20 text-red-400'
                          : member.stats.currentWorkload > 3
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {member.stats.currentWorkload}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (member.stats.todayLoad || 0) > 3
                          ? 'bg-orange-500/20 text-orange-400'
                          : (member.stats.todayLoad || 0) > 0
                          ? 'bg-blue-500/20 text-blue-400'
                          : isDark ? 'bg-dark-700 text-dark-400' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {member.stats.todayLoad || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full ${getProgressColor(member.stats.completionRate)} transition-all`}
                          style={{ width: `${member.stats.completionRate}%` }}
                        />
                      </div>
                      <span className={`text-sm w-10 text-right ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                        {member.stats.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/performance/${member.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-dark-700 bg-dark-800/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Workload Color:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">≤3</span>
              <span className={isDark ? 'text-dark-500' : 'text-gray-400'}>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">4-5</span>
              <span className={isDark ? 'text-dark-500' : 'text-gray-400'}>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">&gt;5</span>
              <span className={isDark ? 'text-dark-500' : 'text-gray-400'}>Heavy</span>
            </div>
            <span className={`ml-auto ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
              Hover ikon <HelpCircle className="w-3 h-3 inline" /> untuk penjelasan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
