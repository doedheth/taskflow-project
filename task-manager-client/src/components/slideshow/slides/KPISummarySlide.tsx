import React from 'react';
import { ClipboardCheck, Ticket, Cpu, AlertCircle, TrendingUp, Activity, Target, Bot, Users, Zap } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis, BarChart, Bar, XAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface KPISummarySlideProps {
  data: {
    work_orders: number;
    tickets: number;
    uptime: number;
    down_machines: number;
    today_wo?: number;
    critical_tickets?: number;
    total_machines?: number;
    sparkline?: Array<{ name: string; value: number }>;
    weeklyTrend?: Array<{ name: string; value: number }>;
    aiInsights?: {
      status: string;
      recommendation: string;
      efficiency_trend: string;
    };
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const KPISummarySlide: React.FC<KPISummarySlideProps> = ({ data }) => {
  const sparklineData = data?.sparkline || [];
  const weeklyData = data?.weeklyTrend || [];
  const aiInsights = data?.aiInsights;
  const uptime = data?.uptime || 0;
  const downMachines = data?.down_machines || 0;
  const totalMachines = data?.total_machines || 0;
  const operationalMachines = totalMachines - downMachines;

  // Determine status color
  const getStatusColor = () => {
    if (downMachines > 0) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (uptime < 95) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
  };

  const statusStyle = getStatusColor();

  const kpiItems = [
    {
      label: 'WO Selesai (MTD)',
      value: data?.work_orders || 0,
      icon: ClipboardCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      subtext: 'Monthly'
    },
    {
      label: 'Ticket Resolved',
      value: data?.tickets || 0,
      icon: Ticket,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      subtext: 'MTD'
    },
    {
      label: 'Machine Uptime',
      value: `${uptime}%`,
      icon: Cpu,
      color: uptime >= 95 ? 'text-emerald-500' : 'text-amber-500',
      bg: uptime >= 95 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      subtext: `${operationalMachines}/${totalMachines} Active`
    },
    {
      label: 'Mesin Down',
      value: downMachines,
      icon: AlertCircle,
      color: downMachines > 0 ? 'text-red-500' : 'text-emerald-500',
      bg: downMachines > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      subtext: 'Requires Attention'
    },
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            <Activity className="w-10 h-10 text-cyan-400 drop-shadow-lg" />
            Operational KPI Summary
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Real-time Factory Floor Performance Indicators</p>
        </div>

        {/* AI Status Badge */}
        {aiInsights && (
          <div className={`px-6 py-3 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} flex items-center gap-3 backdrop-blur-md`}>
            <Bot className={`w-6 h-6 ${statusStyle.text}`} />
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text} block`}>AI Status</span>
              <span className="text-sm font-black text-white capitalize">{aiInsights.status}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot} animate-pulse`} />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* KPI Cards */}
        <div className="col-span-4 grid grid-cols-2 gap-4">
          {kpiItems.map((item) => (
            <div key={item.label} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${item.bg} ${item.color}`}>
                  {item.subtext}
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <div className="text-4xl font-black text-white tracking-tight">{item.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{item.label}</div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-700/50">
                <div className={`h-full ${item.color.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: typeof item.value === 'string' ? item.value : '100%' }} />
              </div>
            </div>
          ))}

          {/* Today's Stats */}
          <div className="col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-xs font-bold uppercase">Today's Activity</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-black text-white">{data?.today_wo || 0}</div>
                <div className="text-xs text-blue-200">Work Orders</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">{data?.critical_tickets || 0}</div>
                <div className="text-xs text-blue-200">Critical Tickets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Weekly Trend Area Chart */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Work Order Trend (14 Days)
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-400">Daily Count</span>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWO" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorWO)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Machine Status Bar */}
          <div className="h-[120px] bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-purple-400" />
              Machine Fleet Status
            </h3>
            <div className="flex items-center gap-4 h-[60px]">
              <div className="flex-1 h-full bg-slate-700/50 rounded-xl overflow-hidden flex">
                {Array.from({ length: Math.max(totalMachines, 10) }).map((_, i) => (
                  <div key={i} className={`flex-1 border-r border-slate-800 ${i < operationalMachines ? 'bg-emerald-500/40' : 'bg-red-500/40'}`} />
                ))}
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{totalMachines}</div>
                <div className="text-xs text-slate-400">Total Assets</div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-400">{operationalMachines} Operational</span>
              <span className="text-red-400">{downMachines} Down</span>
            </div>
          </div>
        </div>

        {/* Right Panel - AI & Summary */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Overall Efficiency */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-indigo-200" />
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Overall Efficiency</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">{uptime}%</span>
            </div>
            <div className="mt-3 h-2 bg-indigo-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${uptime}%` }}></div>
            </div>
            <div className="mt-2 text-xs text-indigo-200">
              {uptime >= 95 ? '🌟 World Class Performance' : '📈 Above Average'}
            </div>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Insights</h3>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <span className="text-slate-400 text-xs font-bold uppercase block mb-2">Recommendation</span>
                <p className="text-white text-sm font-medium leading-relaxed">{aiInsights.recommendation}</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Trend:</span>
                <span className={`font-bold ${aiInsights.efficiency_trend === 'increasing' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {aiInsights.efficiency_trend === 'increasing' ? '↑ Rising' : '→ Stable'}
                </span>
              </div>
            </div>
          )}

          {/* Team Stats */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-emerald-200" />
              <span className="text-emerald-200 text-xs font-bold uppercase">Team Performance</span>
            </div>
            <div className="text-3xl font-black text-white">{data?.work_orders || 0}</div>
            <div className="text-emerald-200 text-sm">Work Orders Completed MTD</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-slate-500 font-medium">Systems Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-500 font-medium">Network Stable</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          FACTORY DATA PORTAL v2.0 • {new Date().toLocaleDateString('id-ID')}
        </div>
      </div>
    </div>
  );
};
