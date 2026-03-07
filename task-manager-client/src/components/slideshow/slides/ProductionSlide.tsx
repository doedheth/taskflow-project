import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, Legend } from 'recharts';
import { Factory, TrendingUp, Target, Zap, Package, BarChart3 } from 'lucide-react';

interface ProductionSlideProps {
  data: {
    schedule: Array<{ name: string; value: number }>;
    statusBreakdown: Array<{ name: string; value: number }>;
    completed_today?: number;
    planned_today?: number;
    efficiency?: number;
    daily_output?: Array<{ name: string; value: number }>;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ProductionSlide: React.FC<ProductionSlideProps> = ({ data }) => {
  const schedule = data?.schedule || [];
  const statusBreakdown = data?.statusBreakdown || [];
  const completedToday = data?.completed_today || 0;
  const plannedToday = data?.planned_today || 0;
  const efficiency = data?.efficiency || 0;
  const dailyOutput = data?.daily_output || [];

  const totalBatches = schedule.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const completionRate = plannedToday > 0 ? Math.round((completedToday / plannedToday) * 100) : 0;

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            <Factory className="w-10 h-10 text-emerald-400 drop-shadow-lg" />
            Production Schedule
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Daily Manufacturing Targets vs Actual Performance (14 Days)</p>
        </div>

        {/* Status Badge */}
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 backdrop-blur-md ${
          efficiency >= 90 ? 'bg-emerald-500/10 border-emerald-500/30' : 
          efficiency >= 70 ? 'bg-amber-500/10 border-amber-500/30' : 
          'bg-red-500/10 border-red-500/30'
        }`}>
          <TrendingUp className={`w-6 h-6 ${efficiency >= 90 ? 'text-emerald-400' : efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`} />
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block">Efficiency</span>
            <span className="text-xl font-black text-white">{efficiency}%</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Main Production Bar Chart */}
        <div className="col-span-7 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Output Trend (14 Days)
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-400">Daily Output</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schedule} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={11}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (!value) return '';
                    const date = new Date(value);
                    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                  formatter={(value: number | undefined) => [`${(value || 0)} batches`, '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1500}>
                  {schedule.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === schedule.length - 1 ? '#10b981' : COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Status Mix Pie Chart */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-purple-400" />
              Status Mix (7 Days)
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-200" />
                <span className="text-blue-200 text-xs font-bold uppercase">Completion Rate</span>
              </div>
              <span className="text-4xl font-black text-white">{completionRate}%</span>
              <div className="mt-2 h-2 bg-blue-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-bold uppercase">Total Batches</span>
              </div>
              <span className="text-4xl font-black text-white">{totalBatches}</span>
              <span className="text-emerald-200 text-xs block mt-1">Across all lines</span>
            </div>
          </div>

          {/* Daily Output Trend */}
          {dailyOutput.length > 0 && (
            <div className="h-[100px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-4 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Weekly Output</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyOutput} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorOutput)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">MANUFACTURING EXECUTION SYSTEM (MES)</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
            Last Sync: {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
};
