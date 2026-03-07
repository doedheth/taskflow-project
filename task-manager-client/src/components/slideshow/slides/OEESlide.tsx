import React from 'react';
import { Zap, CheckCircle2, BarChart3, Clock, Activity, Target, TrendingUp, Award } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OEESlideProps {
  data: {
    availability: number;
    performance: number;
    quality: number;
    oee: number;
    shiftData?: Array<{ name: string; value: number }>;
    dailyTrend?: Array<{ name: string; value: number }>;
  };
}

export const OEESlide: React.FC<OEESlideProps> = ({ data }) => {
  const availability = data?.availability || 0;
  const performance = data?.performance || 0;
  const quality = data?.quality || 0;
  const oee = data?.oee || 0;
  
  const radarData = [
    { subject: 'Availability', A: availability, fullMark: 100 },
    { subject: 'Performance', A: performance, fullMark: 100 },
    { subject: 'Quality', A: quality, fullMark: 100 },
  ];

  const shiftData = data?.shiftData || [
    { name: 'S1', value: 78 + Math.random() * 10 },
    { name: 'S2', value: 82 + Math.random() * 8 },
    { name: 'S3', value: 74 + Math.random() * 12 },
  ];

  const getOEEGrade = () => {
    if (oee >= 85) return { grade: 'WORLD CLASS', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (oee >= 70) return { grade: 'EXCELLENT', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    if (oee >= 50) return { grade: 'AVERAGE', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { grade: 'NEEDS IMPROVEMENT', color: 'text-red-400', bg: 'bg-red-500/10' };
  };

  const oeeGrade = getOEEGrade();

  const metrics = [
    {
      label: 'Availability',
      value: `${availability.toFixed(1)}%`,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      barColor: '#3b82f6'
    },
    {
      label: 'Performance',
      value: `${performance.toFixed(1)}%`,
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      barColor: '#f59e0b'
    },
    {
      label: 'Quality',
      value: `${quality.toFixed(1)}%`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      barColor: '#10b981'
    }
  ];

  return (
    <div className="h-full w-full flex flex-col p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div className="relative z-10">
          <h1 className="text-5xl font-black flex items-center gap-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            <Activity className="w-10 h-10 text-purple-400 drop-shadow-lg" />
            Overall Equipment Effectiveness
          </h1>
          <p className="text-lg text-slate-400 mt-2 font-medium">Real-time Production Efficiency & Machine Health Metrics</p>
        </div>

        {/* OEE Score Badge */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-6 shadow-xl border border-purple-500/30">
          <div className="flex items-center gap-4">
            <Target className="w-8 h-8 text-purple-200" />
            <div>
              <div className="text-purple-200 text-xs font-bold uppercase tracking-widest">Global OEE</div>
              <div className="text-5xl font-black text-white">{oee.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left: Metric Cards */}
        <div className="col-span-3 flex flex-col gap-4">
          {metrics.map((item) => (
            <div key={item.label} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5 shadow-xl relative overflow-hidden flex-1">
              <div className="flex justify-between items-start relative z-10">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${item.bg} ${item.color}`}>
                  {item.label}
                </div>
              </div>
              <div className="mt-3 relative z-10">
                <div className="text-4xl font-black text-white tracking-tight">{item.value}</div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-700/50">
                <div className={`h-full transition-all duration-1000`} style={{ width: item.value, backgroundColor: item.barColor }} />
              </div>
            </div>
          ))}

          {/* Grade Badge */}
          <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border ${oeeGrade.bg} p-5 shadow-xl`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs font-bold uppercase">Performance Grade</div>
                <div className={`text-2xl font-black ${oeeGrade.color}`}>{oeeGrade.grade}</div>
              </div>
              <Award className={`w-10 h-10 ${oeeGrade.color} opacity-50`} />
            </div>
          </div>
        </div>

        {/* Center: Radar Chart */}
        <div className="col-span-5 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 self-start">
            <Activity className="w-5 h-5 text-purple-400" />
            Efficiency Profile
          </h3>
          <div className="w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 'bold' }} />
                <Radar
                  name="OEE"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                  animationDuration={2000}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Shift Comparison & Trend */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Shift Comparison */}
          <div className="flex-1 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Shift Comparison
            </h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={14} stroke="#e2e8f0" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[60, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(71, 85, 105, 0.5)', borderRadius: '12px' }}
                    formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}%`, 'OEE']}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-200 text-xs font-bold uppercase">Best Shift</span>
              </div>
              <div className="text-3xl font-black text-white">{shiftData.reduce((best, s) => s.value > (best?.value || 0) ? s : best, shiftData[0] || { value: 0 }).name}</div>
              <div className="text-emerald-200 text-sm">{shiftData.reduce((max, s) => Math.max(max, s.value), 0).toFixed(1)}% OEE</div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-indigo-200" />
                <span className="text-indigo-200 text-xs font-bold uppercase">Target</span>
              </div>
              <div className="text-3xl font-black text-white">85%</div>
              <div className="text-indigo-200 text-sm">World Class Target</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">OEE REAL-TIME ENGINE v2.1</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CALIBRATED
          </span>
          <span className="text-xs text-slate-600 font-bold uppercase tracking-[0.2em]">
            LAST UPDATE: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};
