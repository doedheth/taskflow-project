import React from 'react';
import { Sun, Zap, TrendingUp, Battery, Activity, CloudRain, Leaf, Target, Bot, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SolarSlideProps {
  data: {
    energy_yield: number;
    power_output: number;
    status: string;
    revenue?: number;
    monthly_revenue?: number;
    efficiency?: string;
    accuracy?: string;
    co2_savings?: string;
    peak_hours?: number;
    avg_daily_yield?: string;
    trend: Array<{ name: string; value: number; manualValue: number }>;
    monthly_comparison?: Array<{ name: string; huawei: number; lokal: number }>;
    realtime?: {
      pvPower?: number;
      loadPower?: number;
      gridPower?: number;
      dailyRevenue?: number;
      deviceOnline?: boolean;
    };
    ai_insights?: {
      status: string;
      recommendation: string;
      forecast: string;
      alerts: string[];
    };
  };
}

// Colorful palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const SolarSlide: React.FC<SolarSlideProps> = ({ data }) => {
  const totalYield = data?.energy_yield || 0;
  const todayRevenue = data?.revenue || data?.realtime?.dailyRevenue || 0;
  const monthlyRevenue = data?.monthly_revenue || 0;
  const powerOutput = data?.power_output || data?.realtime?.pvPower || 0;
  const efficiency = data?.efficiency || '94.2';
  const accuracy = data?.accuracy || '0';
  const co2Savings = data?.co2_savings || '0';
  const peakHours = data?.peak_hours || 0;
  const isOnline = data?.status === 'online' || data?.realtime?.deviceOnline === true;
  const aiInsights = data?.ai_insights;

  const chartData = data?.trend || [];
  const monthlyData = data?.monthly_comparison || [];

  const formatTooltipValue = (value: number) => {
    return `${value.toLocaleString()} kW`;
  };

  const formatXAxis = (val: string) => {
    if (val && val.includes(' ')) {
      return val.split(' ')[1]?.substring(0, 5) || val;
    }
    return val;
  };

  // Data for efficiency pie chart
  const efficiencyData = [
    { name: 'Produktif', value: parseFloat(efficiency) },
    { name: 'Idle', value: 100 - parseFloat(efficiency) }
  ];

  // Status color based on AI insights
  const getStatusColor = () => {
    if (!isOnline) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (aiInsights?.status === 'optimal') return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
    return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header with animated background */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            <Sun className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
            Solar Analytics
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Real-Time Monitoring & AI Insights</p>
        </div>
        
        {/* AI Status Badge */}
        {aiInsights && (
          <div className={`px-6 py-3 rounded-2xl border ${statusStyle.bg} ${statusStyle.border} flex items-center gap-3 backdrop-blur-md`}>
            <Bot className={`w-6 h-6 ${statusStyle.text}`} />
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text} block`}>AI Status</span>
              <span className="text-sm font-black text-white capitalize">{aiInsights.status}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot} ${isOnline ? 'animate-pulse' : ''}`} />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel - Main Metrics */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Hero Yield Display */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTIwIDIwTDIwLjUgMjAuNUwyMCAyMEwyMC41IDIwTDIwIDIwLjVMMjAgMjAiLz48L2c+PC9zdmc+')] opacity-50"></div>
            <Sun className="absolute -right-4 -bottom-4 w-48 h-48 text-yellow-400/20 rotate-12" />
            <span className="relative z-10 text-blue-200 text-sm font-bold uppercase tracking-widest">Today's Accumulated Yield</span>
            <div className="relative z-10 flex items-baseline gap-3 mt-2">
              <span className="text-7xl font-black text-white tracking-tighter drop-shadow-lg">
                {totalYield >= 1000 ? (totalYield / 1000).toFixed(2) : totalYield.toLocaleString()}
              </span>
              <span className="text-3xl font-bold text-blue-200">
                {totalYield >= 1000 ? 'MWh' : 'kWh'}
              </span>
            </div>
            {/* Revenue Badge */}
            <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-blue-200 text-sm font-medium">Est. Revenue:</span>
              <span className="text-white font-black text-lg">Rp {todayRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Efficiency */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-300" />
                <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Efficiency</span>
              </div>
              <span className="text-4xl font-black text-white">{efficiency}%</span>
              <div className="mt-2 h-2 bg-emerald-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${efficiency}%` }}></div>
              </div>
            </div>

            {/* CO2 Savings */}
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-green-300" />
                <span className="text-green-200 text-xs font-bold uppercase tracking-wider">CO₂ Savings</span>
              </div>
              <span className="text-4xl font-black text-white">{co2Savings}</span>
              <span className="text-green-200 text-sm font-medium">kg CO₂</span>
            </div>

            {/* Live Power */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-300 animate-pulse" />
                <span className="text-purple-200 text-xs font-bold uppercase tracking-wider">Live Power</span>
              </div>
              <span className="text-4xl font-black text-white">{powerOutput.toFixed(1)}</span>
              <span className="text-purple-200 text-sm font-medium">kW</span>
            </div>

            {/* Peak Hours */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-5 h-5 text-amber-300" />
                <span className="text-amber-200 text-xs font-bold uppercase tracking-wider">Peak Hours</span>
              </div>
              <span className="text-4xl font-black text-white">{peakHours}</span>
              <span className="text-amber-200 text-sm font-medium">hours</span>
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Monthly Revenue</span>
              <div className="text-3xl font-black text-white mt-1">Rp {(monthlyRevenue / 1000000).toFixed(1)}M</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Center Panel - Charts */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Main Trend Chart */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-400" />
                Energy Trend Today
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-400">Huawei</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500 border-dashed"></div>
                  <span className="text-xs text-slate-400">Lokal</span>
                </div>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSolarMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSolarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatXAxis} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" kW" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px' }} formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} kW`, '']} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSolarMain)" animationDuration={1500} />
                  <Area type="monotone" dataKey="manualValue" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorSolarFill)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Comparison Bar Chart */}
          {monthlyData.length > 0 && (
            <div className="h-[180px] bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Weekly Comparison (Huawei vs Lokal)
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '8px' }} />
                  <Bar dataKey="huawei" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000} />
                  <Bar dataKey="lokal" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Panel - AI Insights & Status */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* AI Recommendations Card */}
          {aiInsights && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 p-6 shadow-xl flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">AI Insights</h3>
              </div>
              
              {/* Recommendation */}
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-4 mb-4 border border-purple-500/20">
                <span className="text-purple-300 text-xs font-bold uppercase tracking-wider block mb-2">Recommendation</span>
                <p className="text-white text-sm font-medium leading-relaxed">{aiInsights.recommendation}</p>
              </div>

              {/* Forecast */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-2xl p-4 mb-4 border border-emerald-500/20">
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider block mb-2">Forecast</span>
                <p className="text-white text-sm font-medium leading-relaxed">{aiInsights.forecast}</p>
              </div>

              {/* Alerts */}
              {aiInsights.alerts && aiInsights.alerts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-red-300 text-xs font-bold uppercase tracking-wider block">Alerts</span>
                  {aiInsights.alerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-red-200 text-xs font-medium">{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System Status Card */}
          <div className={`rounded-3xl p-6 shadow-xl border ${isOnline ? 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 border-emerald-500/30' : 'bg-gradient-to-br from-red-900/50 to-rose-900/50 border-red-500/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white uppercase tracking-wider">System Status</span>
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
            <div className="flex items-center gap-3">
              <Sun className={`w-12 h-12 ${isOnline ? 'text-yellow-400' : 'text-slate-500'}`} />
              <div>
                <div className={`text-2xl font-black ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
                <div className="text-slate-400 text-sm">{isOnline ? 'Monitoring active' : 'Connection lost'}</div>
              </div>
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-3xl p-6 shadow-xl border border-blue-500/30">
            <span className="text-blue-300 text-xs font-bold uppercase tracking-wider block mb-2">Data Accuracy</span>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{accuracy}%</span>
              <span className="text-blue-300 text-sm mb-1">match rate</span>
            </div>
            <div className="mt-3 h-2 bg-blue-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${accuracy}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-500 font-medium">Huawei FusionSolar API</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full border-2 border-emerald-500 border-dashed"></div>
            <span className="text-xs text-slate-500 font-medium">Manual Input</span>
          </div>
        </div>
        <div className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
          Solar Analytics v2.0 • AI Powered
        </div>
      </div>
    </div>
  );
};
