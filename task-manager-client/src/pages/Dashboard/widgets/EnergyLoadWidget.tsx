import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { format, parseISO } from 'date-fns';

interface EnergyLoadWidgetProps {
  data?: Array<{
    timestamp: string;
    pln_kw: number;
    solar_kw: number;
    total_kw: number;
  }>;
  isLoading: boolean;
}

export function EnergyLoadWidget({ data, isLoading }: EnergyLoadWidgetProps) {
  if (isLoading) return <WidgetSkeleton />;

  const chartData = data?.map(item => ({
    ...item,
    time: format(parseISO(item.timestamp), 'HH:mm'),
  })) || [];

  return (
    <WidgetCard title="Energy Load Profile" subtitle="PLN vs Solar distribution (Today)">
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPln" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              unit="kW"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Area
              type="monotone"
              dataKey="pln_kw"
              name="PLN"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPln)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="solar_kw"
              name="Solar"
              stroke="#eab308"
              fillOpacity={1}
              fill="url(#colorSolar)"
              stackId="1"
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
