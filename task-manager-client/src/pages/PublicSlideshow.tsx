import React, { useMemo } from 'react';
import { useSlideshowData } from '../hooks/useSlideshowData';
import { SlideCarousel } from '../components/slideshow/SlideCarousel';
import V2Slideshow from '../components/slideshow/V2Slideshow';
import { Loader2, AlertCircle, RefreshCw, Activity, ShieldAlert, Zap, Clock } from 'lucide-react';

const PublicSlideshow: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useSlideshowData();
  const [useV2, setUseV2] = React.useState(true);

  if (useV2) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        <V2Slideshow />
        {/* Secret button to switch to legacy if needed (hold top right for 2s) */}
        <div 
          className="absolute top-0 right-0 w-20 h-20 z-[999] opacity-0 hover:opacity-10"
          onDoubleClick={() => setUseV2(false)}
          title="Switch to Dashboard Mode"
        />
      </div>
    );
  }

  const globalStats = useMemo(() => {
    if (!data || !data.slides) return null;

    const oeeSlide = data.slides.find(s => s.type === 'oee');
    const alertsSlide = data.slides.find(s => s.type === 'alerts');
    const kpiSlide = data.slides.find(s => s.type === 'kpi-summary');

    return {
      oee: oeeSlide?.data?.oee || 0,
      alerts: alertsSlide?.data?.alerts?.length || 0,
      uptime: kpiSlide?.data?.uptime || 0,
      timestamp: data.generatedAt
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-2xl text-white font-medium animate-pulse uppercase tracking-[0.3em]">Initializing Command Center...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 uppercase tracking-tight">Upstream Connection Failure</h1>
        <p className="text-2xl text-gray-400 mb-12 max-w-2xl font-medium">
          {error instanceof Error ? error.message : 'The monitoring system could not establish a connection to the data warehouse.'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-2xl font-black transition-all active:scale-95 shadow-2xl shadow-red-500/20 uppercase tracking-widest"
        >
          <RefreshCw className="w-6 h-6" />
          Re-initialize System
        </button>
      </div>
    );
  }

  if (!data || !data.slides || data.slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-8 border border-gray-700">
           <Activity className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 uppercase">No Telemetry Modules</h1>
        <p className="text-2xl text-gray-400">Please configure slideshow modules in the administration panel.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* High-Tech Global Header */}
      <div className="h-16 bg-dark-900 border-b border-white/10 flex items-center justify-between px-8 z-[100] backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
             </div>
             <span className="text-xl font-black text-white tracking-tighter uppercase">Factory Floor Intelligence</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
             <span className="flex items-center gap-2 text-emerald-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Telemetry
             </span>
             <span>Ver: 2.4.0-Pro</span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          {/* Global Metrics in Header */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-text-muted uppercase font-black tracking-widest">Overall OEE</span>
               <div className="flex items-center gap-2 leading-none">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-xl font-black text-white">{globalStats?.oee.toFixed(1)}%</span>
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-text-muted uppercase font-black tracking-widest">Active Alerts</span>
               <div className="flex items-center gap-2 leading-none">
                  <ShieldAlert className={`w-3 h-3 ${globalStats?.alerts && globalStats.alerts > 0 ? 'text-red-500 animate-bounce' : 'text-emerald-500'}`} />
                  <span className={`text-xl font-black ${globalStats?.alerts && globalStats.alerts > 0 ? 'text-red-500' : 'text-white'}`}>{globalStats?.alerts}</span>
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-text-muted uppercase font-black tracking-widest">Global Uptime</span>
               <div className="flex items-center gap-2 leading-none">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-xl font-black text-white">{globalStats?.uptime}%</span>
               </div>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <div className="text-right">
             <div className="text-xl font-black text-white leading-none tabular-nums">{new Date().toLocaleTimeString()}</div>
             <div className="text-[10px] text-text-muted uppercase font-bold tracking-tighter mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative">
        <SlideCarousel slides={data.slides} />
      </div>

      {/* Decorative Bottom Bar */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600" />
    </div>
  );
};

export default PublicSlideshow;
