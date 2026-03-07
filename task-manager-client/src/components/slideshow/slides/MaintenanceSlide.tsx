import React from 'react';
import { Wrench, Clock, AlertTriangle, CheckCircle2, PieChart as PieIcon, Bot, Target, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MaintenanceSlideProps {
  data: {
    pending: number;
    inProgress: number;
    overduePM: number;
    completed_today?: number;
    typeBreakdown: Array<{ name: string; value: number }>;
    priorityBreakdown?: Array<{ name: string; value: number }>;
    aiInsights?: {
      status: string;
      recommendation: string;
      top_type: string;
    };
  };
}

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];
const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };

export const MaintenanceSlide: React.FC<MaintenanceSlideProps> = ({ data }) => {
  const pending = data?.pending || 0;
  const inProgress = data?.inProgress || 0;
  const overduePM = data?.overduePM || 0;
  const completedToday = data?.completed_today || 0;
  const typeBreakdown = data?.typeBreakdown || [];
  const priorityBreakdown = data?.priorityBreakdown || [];
  const aiInsights = data?.aiInsights;

  const totalActive = pending + inProgress;
  const pmCompliance = 96; // Simulated

  // Determine status color
  const getStatusColor = () => {
    if (overduePM > 0) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (totalActive > 15) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            <Wrench className="w-10 h-10 text-indigo-400 drop-shadow-lg" />
            Maintenance & Assets
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Equipment Health and Service Order Status</p>
        </div>

        {/* AI Status Badge */}
        {aiInsights && (
          <div className={`px-6 py-3 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} flex items-center gap-3 backdrop-blur-md`}>
            <Bot className={`w-6 h-6 ${statusStyle.text}`} />
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text} block`}>AI Status</span>
              <span className="text-sm font-black text-white capitalize">{aiInsights.status}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot} ${overduePM > 0 ? 'animate-pulse' : ''}`} />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* KPI Cards */}
        <div className="col-span-3 grid grid-rows-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Open WO</div>
              <div className="text-3xl font-black text-white">{pending}</div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">In Progress</div>
              <div className="text-3xl font-black text-white">{inProgress}</div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Overdue PM</div>
              <div className="text-3xl font-black text-white">{overduePM}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-200 uppercase">Today Done</div>
              <div className="text-3xl font-black text-white">{completedToday}</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Type Distribution */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Work Order Type Distribution</h3>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Bar Chart */}
          {priorityBreakdown.length > 0 && (
            <div className="h-[140px] bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-xl">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Priority Breakdown
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBreakdown} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} horizontal={true} vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#e2e8f0' }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityBreakdown.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[(item.name?.toLowerCase() as keyof typeof PRIORITY_COLORS)] || COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Compliance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">PM Compliance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white">{pmCompliance}%</span>
            </div>
            <div className="mt-4 h-3 bg-blue-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pmCompliance}%` }}></div>
            </div>
            <div className="mt-2 text-xs text-blue-200">Based on completed vs due dates this month</div>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Analysis</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                  <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Recommendation</span>
                  <p className="text-white text-sm font-medium leading-relaxed">{aiInsights.recommendation}</p>
                </div>
                <div className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3 border border-slate-600/50">
                  <span className="text-slate-400 text-xs font-bold uppercase">Top Type</span>
                  <span className="text-blue-400 text-sm font-bold">{aiInsights.top_type}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active WO Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-xs font-bold uppercase">Active Work Orders</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{totalActive}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="w-px h-10 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-blue-400">{inProgress}</div>
                <div className="text-xs text-slate-400">In Progress</div>
              </div>
              <div className="w-px h-10 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-amber-400">{pending}</div>
                <div className="text-xs text-slate-400">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">ASSET MANAGEMENT SUITE v4.0</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
            Next Sync: {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
};
