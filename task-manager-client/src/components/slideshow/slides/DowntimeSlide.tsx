import React, { useState, useEffect } from 'react';
import { AlertOctagon, Settings, Package, Clock, ShieldAlert, TrendingDown, Target, Activity, Bot, AlertTriangle, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

interface DowntimeSlideProps {
  data: {
    recentDowntime: Array<{
      id: number;
      asset_name: string;
      duration_minutes: number;
      start_time: string;
      classification: string;
    }>;
    activeDowntime: Array<{
      id: number;
      asset_id: number;
      asset_code: string;
      asset_name: string;
      start_time: string;
      downtime_type: string;
      reason: string | null;
      classification_name: string | null;
      counts_as_downtime: number | null;
      duration_minutes: number;
    }>;
    classificationBreakdown: Array<{ name: string; value: number }>;
    totalDowntime?: number;
    criticalCount?: number;
    avgDuration?: number;
    dailyTrend?: Array<{ name: string; value: number }>;
    aiInsights?: {
      status: string;
      recommendation: string;
      forecast: string;
      topIssue: string;
    };
  };
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

// Countdown timer hook
const useCountdown = (startTime: string) => {
  const [duration, setDuration] = useState('0:00');
  
  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(startTime);
      const now = new Date();
      const totalSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      if (totalSeconds < 0) {
        setDuration('0:00');
        return;
      }
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      if (hours > 0) {
        setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  return duration;
};

export const DowntimeSlide: React.FC<DowntimeSlideProps> = ({ data }) => {
  const recentDowntime = data?.recentDowntime || [];
  const activeDowntime = data?.activeDowntime || [];
  const classificationBreakdown = data?.classificationBreakdown || [];
  const totalDowntime = data?.totalDowntime || classificationBreakdown.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const criticalCount = data?.criticalCount || 0;
  const avgDuration = data?.avgDuration || 0;
  const dailyTrend = data?.dailyTrend || [];
  const aiInsights = data?.aiInsights;

  // Determine status color
  const getStatusColor = () => {
    if (totalDowntime > 60 || criticalCount > 2) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' };
    if (totalDowntime > 30 || criticalCount > 0) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' };
  };

  const statusStyle = getStatusColor();

  // Get severity color for classification
  const getSeverityColor = (classification: string) => {
    const lower = (classification || '').toLowerCase();
    if (lower.includes('technical') || lower.includes('quality')) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (lower.includes('material')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  return (
    <div className="h-full w-full flex flex-col p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 bg-gradient-to-r from-red-400 via-rose-500 to-red-400 bg-clip-text text-transparent">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            Downtime Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">Machine Interruptions & Recovery (7 Days)</p>
        </div>

        {/* AI Status Badge */}
        {aiInsights && (
          <div className={`px-4 py-2 rounded-xl border ${statusStyle.bg} ${statusStyle.border} flex items-center gap-2 backdrop-blur-md`}>
            <Bot className={`w-5 h-5 ${statusStyle.text}`} />
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${statusStyle.text} block`}>AI Status</span>
              <span className="text-xs font-black text-white capitalize">{aiInsights.status}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusStyle.dot} ${totalDowntime > 30 ? 'animate-pulse' : ''}`} />
          </div>
        )}
      </div>

      {/* Compact Active Downtime Table */}
      {activeDowntime.length > 0 && (
        <div className="mb-3 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-red-900/30 to-slate-900 border-b border-slate-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Downtime Aktif <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">{activeDowntime.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/80">
                <tr>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Asset</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-center">Tipe</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-center">Mulai</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-center">Countdown</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {activeDowntime.map((dt) => {
                  const countdown = useCountdown(dt.start_time);
                  const isUnplanned = dt.downtime_type === 'unplanned';
                  
                  return (
                    <tr key={dt.id} className={`${isUnplanned ? 'bg-red-500/5' : 'bg-blue-500/5'} hover:bg-slate-700/50 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Wrench className={`w-4 h-4 ${isUnplanned ? 'text-red-400' : 'text-blue-400'}`} />
                          <div>
                            <span className="font-bold text-white text-sm">{dt.asset_code}</span>
                            <div className="text-xs text-slate-500">{dt.asset_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isUnplanned 
                          ? 'bg-red-500/30 text-red-300' 
                          : 'bg-blue-500/30 text-blue-300'
                        }`}>
                          {dt.downtime_type === 'unplanned' ? 'UNPLAN' : 'PLANNED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-slate-300">
                          {dt.start_time ? new Date(dt.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dt.start_time ? new Date(dt.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xl font-mono font-bold ${isUnplanned ? 'text-red-400' : 'text-blue-400'}`}>
                          {countdown}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400 truncate block max-w-[200px]">
                          {dt.reason || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Grid - Compact */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel - Recent Downtime Table */}
        <div className="col-span-5 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 flex flex-col shadow-xl overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Recent Interruptions
            </h3>
            <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-700">TOP {recentDowntime.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-800/90 z-10 backdrop-blur-sm">
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">Machine</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-center">Time</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-center">Duration</th>
                  <th className="px-4 py-2 text-xs font-bold text-slate-400 uppercase text-right">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentDowntime.slice(0, 6).map((item, index) => (
                  <tr key={item.id} className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30'} hover:bg-slate-700/50 transition-colors`}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-slate-500" />
                        <span className="text-sm font-bold text-white whitespace-nowrap">{item.asset_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-xs text-slate-300 font-medium">
                        {item.start_time ? new Date(item.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </span>
                      <div className="text-xs text-slate-500">
                        {item.start_time ? new Date(item.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded font-bold text-xs ${getSeverityColor(item.classification)}`}>
                        {item.duration_minutes || 0}m
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSeverityColor(item.classification)}`}>
                        {item.classification || 'Other'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentDowntime.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-emerald-500/50" />
                        <span className="text-sm text-slate-400 italic">Zero interruptions reported.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Center Panel - Charts */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Classification Breakdown */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-white">Downtime by Category</h3>
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classificationBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={true} vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit=" min" />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fill="#e2e8f0" width={60} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '8px' }}
                    formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} minutes`, '']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                    {classificationBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Trend */}
          {dailyTrend.length > 0 && (
            <div className="h-[100px] bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white">7-Day Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDowntime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} unit=" m" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="url(#colorDowntime)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Panel - KPIs & AI Insights */}
        <div className="col-span-3 flex flex-col gap-3">
          {/* Impact Card */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4 text-red-200" />
              <span className="text-red-200 text-xs font-bold uppercase tracking-wider">Impact This Week</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalDowntime.toLocaleString()}</span>
              <span className="text-sm font-bold text-red-200">min</span>
            </div>
            <div className="mt-2 h-1.5 bg-red-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (totalDowntime / 120) * 100)}%` }}></div>
            </div>
            <div className="mt-1 text-xs text-red-300">Target: &lt;60 min/week</div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3 h-3 text-amber-200" />
                <span className="text-amber-200 text-xs font-bold uppercase">Critical</span>
              </div>
              <span className="text-2xl font-black text-white">{criticalCount}</span>
              <span className="text-amber-200 text-xs block">events</span>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-purple-200" />
                <span className="text-purple-200 text-xs font-bold uppercase">Avg Duration</span>
              </div>
              <span className="text-2xl font-black text-white">{avgDuration}</span>
              <span className="text-purple-200 text-xs block">min/event</span>
            </div>
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-3 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white">AI Analysis</h3>
              </div>
              <div className="space-y-2">
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Recommendation</span>
                  <p className="text-white text-xs font-medium leading-relaxed">{aiInsights.recommendation}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                  <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Top Issue</span>
                  <p className="text-red-400 text-xs font-bold">{aiInsights.topIssue}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3 text-red-500" />
            <span className="text-xs text-slate-500 font-medium">TECHNICAL</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3 text-amber-500" />
            <span className="text-xs text-slate-500 font-medium">MATERIAL</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-500" />
            <span className="text-xs text-slate-500 font-medium">QUALITY</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 font-bold uppercase tracking-[0.1em]">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          Scanning...
        </div>
      </div>
    </div>
  );
};
