import { Zap, Sun, Activity } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';

interface EnergyStatusCardProps {
  data?: {
    pln_kw: number;
    solar_kw: number;
    total_kw: number;
    power_factor: number;
  };
  isLoading: boolean;
}

export function EnergyStatusCard({ data, isLoading }: EnergyStatusCardProps) {
  if (isLoading) return <WidgetSkeleton />;

  const solarPercent = data?.total_kw ? (data.solar_kw / data.total_kw) * 100 : 0;

  return (
    <WidgetCard title="Real-time Energy Status" subtitle="Live feed from PLN & Solar meters">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">PLN Supply</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {data?.pln_kw?.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-bold text-blue-400">kW</span>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-600 dark:text-blue-400 uppercase">Solar Supply</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-yellow-700 dark:text-yellow-300">
              {data?.solar_kw?.toLocaleString() ?? 0}
            </span>
            <span className="text-xs font-bold text-yellow-400">kW</span>
          </div>
        </div>

        <div className="col-span-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Factory Load</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {data?.total_kw?.toLocaleString() ?? 0}
              </span>
              <span className="text-sm font-bold text-emerald-400">kW</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Solar Share</div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {solarPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
