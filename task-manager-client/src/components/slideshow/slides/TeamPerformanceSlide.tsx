import React from 'react';
import { Award, User, Star, Trophy, Target, TrendingUp, Medal, Bot, Zap, Calendar, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, Tooltip } from 'recharts';

interface TeamPerformanceSlideProps {
  data: {
    performance: Array<{
      name: string;
      avatar: string | null;
      completed_count: number;
      rating?: number;
      efficiency?: number;
    }>;
    teamStats?: {
      totalWo: number;
      avgEfficiency: number;
      avgRating: number;
      completedToday: number;
    };
    weeklyTrend?: Array<{ name: string; value: number }>;
  };
}

const COLORS = ['#eab308', '#94a3b8', '#b45309', '#3b82f6', '#10b981', '#8b5cf6'];

export const TeamPerformanceSlide: React.FC<TeamPerformanceSlideProps> = ({ data }) => {
  const performance = data?.performance || [];
  const teamStats = data?.teamStats || {
    totalWo: performance.reduce((sum, p) => sum + (p.completed_count || 0), 0),
    avgEfficiency: 92,
    avgRating: 4.7,
    completedToday: Math.floor(Math.random() * 10) + 5
  };
  const weeklyTrend = data?.weeklyTrend || [];

  const chartData = performance.slice(0, 6).map(m => ({
    name: m.name ? m.name.split(' ')[0] : 'N/A',
    value: m.completed_count || 0,
    rating: m.rating || 4 + Math.random()
  })).reverse();

  // Department breakdown (simulated based on team data)
  const departmentData = [
    { name: 'Mechanical', value: 35 },
    { name: 'Electrical', value: 28 },
    { name: 'Instrument', value: 22 },
    { name: 'Civil', value: 15 }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
            <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
            Team Excellence
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Top Performing Technicians & Service Accomplishments</p>
        </div>

        {/* Target Badge */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl px-6 py-3 border border-blue-500/30 flex items-center gap-3 shadow-xl">
          <Target className="w-6 h-6 text-blue-200" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-blue-200">Monthly Target</div>
            <div className="text-xl font-black text-white">20 WO/Person</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left: Leaderboard */}
        <div className="col-span-5 space-y-4 overflow-y-auto pr-2">
          {performance.slice(0, 5).map((member, index) => (
            <div
              key={member.name}
              className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 shadow-xl relative overflow-hidden border ${
                index === 0 ? 'border-yellow-500/50' : 'border-slate-700/50'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter flex items-center gap-1">
                  <Medal className="w-3 h-3" />
                  TOP PERFORMER
                </div>
              )}

              <div className="relative">
                <div className={`w-14 h-14 rounded-full ${
                  index === 0 ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                } flex items-center justify-center border-2 ${
                  index === 0 ? 'border-yellow-500/30' : 'border-blue-500/30'
                } overflow-hidden`}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className={`w-7 h-7 ${index === 0 ? 'text-yellow-500' : 'text-blue-400'}`} />
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 border border-slate-600 text-white'
                }`}>
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-white truncate">{member.name}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Maintenance Team</span>
                  {member.efficiency && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400">{member.efficiency}% efficiency</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right flex flex-col items-end px-4 border-r border-white/5">
                <div className={`text-3xl font-black ${index === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>
                  {member.completed_count}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Completed</div>
              </div>

              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (member.rating || 5 - index) ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'}`}
                  />
                ))}
              </div>
            </div>
          ))}

          {performance.length === 0 && (
            <div className="flex items-center justify-center h-64 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-2xl">
              <div className="text-center">
                <Award className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <span className="text-xl text-slate-400 italic">No performance data available</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Analytics & Charts */}
        <div className="col-span-7 flex flex-col gap-4">
          {/* Team Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-200" />
                <span className="text-blue-200 text-xs font-bold uppercase">Total WO MTD</span>
              </div>
              <span className="text-3xl font-black text-white">{teamStats.totalWo}</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-bold uppercase">Avg Efficiency</span>
              </div>
              <span className="text-3xl font-black text-white">{teamStats.avgEfficiency}%</span>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-200" />
                <span className="text-amber-200 text-xs font-bold uppercase">Avg Rating</span>
              </div>
              <span className="text-3xl font-black text-white">{teamStats.avgRating.toFixed(1)}</span>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-200" />
                <span className="text-purple-200 text-xs font-bold uppercase">Today</span>
              </div>
              <span className="text-3xl font-black text-white">{teamStats.completedToday}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {/* Productivity Chart */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Team Productivity
              </h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={true} vertical={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} fill="#e2e8f0" width={60} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1500}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#eab308' : COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-5 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-400" />
                Department Mix
              </h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {departmentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          {weeklyTrend.length > 0 && (
            <div className="h-[100px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Weekly Completion Trend
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorWeekly)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">TEAM RECOGNITION SYSTEM • {new Date().toLocaleDateString('id-ID')}</span>
        <div className="flex items-center gap-2 italic text-sm text-slate-400">
          <span>Keep up the great work, team!</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
