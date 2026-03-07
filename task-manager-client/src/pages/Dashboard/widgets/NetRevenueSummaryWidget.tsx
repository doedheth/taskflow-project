import { Wallet, TrendingUp, Percent } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';

interface NetRevenueSummaryWidgetProps {
  data?: {
    savings_today: number;
    savings_month: number;
    solar_contribution_percent: number;
    pln_cost_mtd: number;
  };
  isLoading: boolean;
}

export function NetRevenueSummaryWidget({ data, isLoading }: NetRevenueSummaryWidgetProps) {
  if (isLoading) return <WidgetSkeleton />;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <WidgetCard title="Energy Savings Summary" subtitle="Financial impact of solar integration">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
              <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Savings Today</p>
              <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                {formatIDR(data?.savings_today ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Savings This Month</p>
              <p className="text-xl font-black text-emerald-700 dark:text-indigo-300">
                {formatIDR(data?.savings_month ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Solar Contribution</p>
              <p className="text-xl font-black text-amber-700 dark:text-amber-300">
                {(data?.solar_contribution_percent ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
