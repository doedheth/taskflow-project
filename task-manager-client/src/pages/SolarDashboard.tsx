import { useState, useEffect, useMemo, useRef } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import {
    Sun, RefreshCw, Settings, Info,
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Zap, TrendingUp, Maximize2, Minimize2, Download
} from 'lucide-react';
import { solarAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLatestEnergy, useEnergyRevenue, useEnergyHistory } from '../hooks/dashboard/useEnergyDashboard';
import { EnergyStatusCard, NetRevenueSummaryWidget, EnergyLoadWidget } from './Dashboard/widgets';

export default function SolarDashboard() {
    const { isAdmin, isManagerOrAdmin } = useAuth();
    const queryClient = useQueryClient();

    // Filters & Navigation
    const [trendDate, setTrendDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [timeDimension, setTimeDimension] = useState<number>(4); // 2=Day, 4=Month, 5=Year
    const [activeTable, setActiveTable] = useState<'comparison' | 'pv_history'>('comparison');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const chartCardRef = useRef<HTMLDivElement>(null);

    // Energy Data (PLN Integration)
    const today = new Date();
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd'T'00:00:00'Z'");
    const monthEnd = format(endOfMonth(today), "yyyy-MM-dd'T'23:59:59'Z'");

    const { data: latestEnergy, isLoading: isLoadingLatest } = useLatestEnergy();
    const { data: revenueData, isLoading: isLoadingRevenue } = useEnergyRevenue(monthStart, monthEnd);
    const { data: energyHistory, isLoading: isLoadingHistory } = useEnergyHistory(
        format(today, "yyyy-MM-dd'T'00:00:00'Z'"),
        format(today, "yyyy-MM-dd'T'23:59:59'Z'")
    );

    // Fullscreen handler - Targets the chart card specifically
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            chartCardRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Range for Comparison
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Config State
    const [showConfig, setShowConfig] = useState(false);
    const [configForm, setConfigForm] = useState({ username: '', password: '', station_dn: '', price_per_kwh: 1500 });

    // Fetch trend data (Solar V3 API)
    const { data: trendResponse, isLoading: isTrendLoading } = useQuery({
        queryKey: ['solar', 'trend', trendDate, timeDimension],
        queryFn: () => solarAPI.getTrend(trendDate, timeDimension).then(res => res.data.data || res.data),
    });

    // Fetch real-time flow data (Solar V3 API)
    const { data: realtimeData } = useQuery({
        queryKey: ['solar', 'realtime'],
        queryFn: () => solarAPI.getRealtime().then(res => res.data.data || res.data),
        refetchInterval: 15000,
    });

    // Fetch comparison data (Solar V2 API)
    const { data: comparisonData } = useQuery({
        queryKey: ['solar', 'comparison', startDate, endDate],
        queryFn: () => solarAPI.getComparison(startDate, endDate).then(res => res.data.data || res.data),
    });

    // Fetch config
    const { data: serverConfig } = useQuery({
        queryKey: ['solar', 'config'],
        queryFn: () => solarAPI.getConfig().then(res => res.data.data || res.data),
        enabled: isAdmin,
    });

    useEffect(() => {
        if (serverConfig) {
            setConfigForm({
                username: serverConfig.username || '',
                password: '',
                station_dn: serverConfig.station_dn || '',
                price_per_kwh: serverConfig.price_per_kwh || 1500,
            });
        }
    }, [serverConfig]);

    // Mutations
    const saveConfigMutation = useMutation({
        mutationFn: (data: any) => solarAPI.saveConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solar', 'config'] });
            setShowConfig(false);
        },
        onError: (error: any) => alert('Gagal menyimpan konfigurasi: ' + error.message),
    });

    const syncMutation = useMutation({
        mutationFn: ({ date, range }: { date?: string, range?: 'day' | 'month' }) => solarAPI.syncData(date, range),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solar'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'energy'] });
            alert('Sinkronisasi berhasil! Data terbaru telah dimuat.');
        },
        onError: (error: any) => alert('Sinkronisasi gagal: ' + error.message),
    });

    const handleConfigSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfigMutation.mutate(configForm);
    };

    const handleExport = async () => {
        try {
            const response = await solarAPI.exportCsv(startDate, endDate);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `solar-report-${startDate}-to-${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            alert('Gagal mengekspor CSV: ' + error.message);
        }
    };

    // Date Navigation
    const navigateDate = (direction: 'prev' | 'next') => {
        const current = parseISO(trendDate);
        let updated;
        if (timeDimension === 2) { // Day
            updated = direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        } else if (timeDimension === 4) { // Month
            const d = new Date(current);
            d.setMonth(d.getMonth() + (direction === 'prev' ? -1 : 1));
            updated = d;
        } else { // Year
            const d = new Date(current);
            d.setFullYear(d.getFullYear() + (direction === 'prev' ? -1 : 1));
            updated = d;
        }
        setTrendDate(format(updated, 'yyyy-MM-dd'));
    };

    // Trend Parsing
    const chartData = useMemo(() => {
        if (!trendResponse || !trendResponse.xAxis || !trendResponse.productPower) return [];

        const labels = trendResponse.xAxis;
        const productPower = trendResponse.productPower;
        const values = typeof productPower === 'string' ? productPower.split(',') : (Array.isArray(productPower) ? productPower : []);

        if (!Array.isArray(labels)) return [];

        let items = labels.map((label: string, index: number) => {
            const val = values[index];
            let name = label;
            const match = comparisonData?.find(d => d.date === label || d.date.startsWith(label));

            if (timeDimension === 2 && label.includes(' ')) {
                try { name = label.split(' ')[1].substring(0, 5); } catch (e) { name = label; }
            }

            return {
                name: name,
                value: (val === '--' || val === undefined || val === null) ? 0 : parseFloat(val.toString()),
                manualValue: match?.manual_kwh || 0
            };
        });

        if (timeDimension === 2) {
            items = items.filter(item => item.value > 0);
        }

        return items;
    }, [trendResponse, timeDimension, comparisonData]);

    const totalYield = useMemo(() => {
        if (!trendResponse) return 0;
        return trendResponse.totalProductPower || trendResponse.productPower || 0;
    }, [trendResponse]);

    const compStats = useMemo(() => {
        if (!Array.isArray(comparisonData)) return { totalHuawei: 0, totalManual: 0 };
        return comparisonData.reduce((acc, curr) => {
            acc.totalHuawei += curr.product_power || 0;
            acc.totalManual += curr.manual_kwh || 0;
            return acc;
        }, { totalHuawei: 0, totalManual: 0 });
    }, [comparisonData]);

    const sortedHistory = useMemo(() => {
        if (!Array.isArray(comparisonData)) return [];
        return [...comparisonData].sort((a, b) => b.date.localeCompare(a.date));
    }, [comparisonData]);

    const todayRevenue = useMemo(() => {
        const price = serverConfig?.price_per_kwh || 1500;
        return Number(totalYield) * price;
    }, [totalYield, serverConfig]);

    const livePower = useMemo(() => {
        if (!realtimeData?.flow?.nodes) return 0;
        const pvNode = realtimeData.flow.nodes.find((n: any) => n.mocId === 20812 || n.id === "0");
        return pvNode?.value || 0;
    }, [realtimeData]);

    const gap = compStats.totalHuawei - compStats.totalManual;

    if (isTrendLoading && !trendResponse) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
        );
    }

    const formatTooltipValue = (value: number) => {
        if (timeDimension === 2) return `${value.toLocaleString()} kW`;
        if (value >= 1000) return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} MWh`;
        return `${value.toLocaleString()} kWh`;
    };

    return (
        <div className={`space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all ${isFullScreen ? 'bg-white dark:bg-dark-950 max-w-full h-screen overflow-y-auto' : ''}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                            <Sun className="w-8 h-8 text-yellow-500" />
                        </div>
                        Solar Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monitoring & Komparasi Efisiensi Energi Surya</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowConfig(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm active:scale-95"
                        >
                            <Settings className="w-4 h-4" />
                            API Config
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => syncMutation.mutate({ date: trendDate, range: 'month' })}
                        disabled={syncMutation.isPending}
                        className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-90"
                    >
                        <RefreshCw className={`w-5 h-5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* PLN Integration Widgets Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EnergyStatusCard
                    data={latestEnergy}
                    isLoading={isLoadingLatest}
                />
                <NetRevenueSummaryWidget
                    data={revenueData}
                    isLoading={isLoadingRevenue}
                />
                <div className="lg:col-span-1">
                    <EnergyLoadWidget
                        data={energyHistory}
                        isLoading={isLoadingHistory}
                    />
                </div>
            </div>

            {/* Original Energy Trend Chart Card */}
            <div
                ref={chartCardRef}
                className={`bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden p-6 sm:p-8 transition-all ${isFullScreen ? 'fixed inset-0 z-[100] !rounded-none h-screen' : ''}`}
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Energy Trend</h2>
                        {isFullScreen && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/50 ml-4 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Live Monitoring</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            {[ { id: 2, name: 'Day' }, { id: 4, name: 'Month' }, { id: 5, name: 'Year' } ].map((dim) => (
                                <button
                                    key={dim.id}
                                    onClick={() => setTimeDimension(dim.id)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${timeDimension === dim.id
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {dim.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-transparent dark:border-gray-750">
                            <button onClick={() => navigateDate('prev')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
                            <div className="px-3 min-w-[100px] text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                                {timeDimension === 2 ? trendDate : timeDimension === 4 ? format(parseISO(trendDate), 'MMMM yyyy') : format(parseISO(trendDate), 'yyyy')}
                            </div>
                            <button onClick={() => navigateDate('next')} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500"><ChevronRight className="w-5 h-5" /></button>
                        </div>

                        <button
                            onClick={toggleFullScreen}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Prominent Yield Display */}
                <div className="flex flex-col items-center justify-center py-4 mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Today's Accumulated Yield</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
                            {Number(totalYield) >= 1000
                                ? (Number(totalYield) / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                : Number(totalYield).toLocaleString()}
                        </span>
                        <span className="text-2xl font-bold text-gray-400">
                            {Number(totalYield) >= 1000 ? 'MWh' : 'kWh'}
                        </span>
                    </div>
                </div>

                <div className="h-[400px] w-full relative mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        {timeDimension === 2 ? (
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} minTickGap={30} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} unit=" kW" hide={window.innerWidth < 640} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.3)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: number, name: string) => [ formatTooltipValue(value), name ]}
                                />
                                <Area type="monotone" dataKey="value" name="Huawei" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
                                <Area type="monotone" dataKey="manualValue" name="Lokal" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fill="transparent" />
                                <Legend verticalAlign="top" height={36}/>
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} unit=" kWh" hide={window.innerWidth < 640} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(75, 85, 99, 0.3)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: number, name: string) => [ formatTooltipValue(value), name ]}
                                />
                                <Bar dataKey="value" name="Huawei" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                <Bar dataKey="manualValue" name="Lokal" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                <Legend verticalAlign="top" height={36}/>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Huawei Total Pill */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl shadow-sm">
                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest text-opacity-70">Huawei:</span>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                                {compStats.totalHuawei.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                            <span className="text-[10px] font-bold text-blue-400/60 uppercase">kWh</span>
                        </div>

                        {/* Local Total Pill */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl shadow-sm">
                            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest text-opacity-70">Lokal:</span>
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                {compStats.totalManual.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400/60 uppercase">kWh</span>
                        </div>

                        {/* Live Power Pill */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl shadow-sm">
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute inset-0"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Live:</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                    {livePower.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70">kW</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl shadow-sm">
                            <Zap className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Revenue:</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-bold text-blue-400">Rp</span>
                                <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                                    {todayRevenue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-2 shadow-sm ${gap >= 0 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                        <span>Gap: {Math.abs(gap).toFixed(1)} kWh</span>
                        <span className="opacity-70 text-[10px] italic">({gap >= 0 ? 'Surplus' : 'Deficit'})</span>
                    </div>
                </div>

                {!isFullScreen && (
                    <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Detailed Logs</h4>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 px-2">
                                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 p-1"
                                        />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 p-1"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit border dark:border-gray-800">
                                <button onClick={() => setActiveTable('comparison')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTable === 'comparison' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Comparison</button>
                                <button onClick={() => setActiveTable('pv_history')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTable === 'pv_history' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>PV History</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                            {activeTable === 'comparison' ? (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Tanggal</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Huawei (kWh)</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Lokal (kWh)</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Selisih</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Gap %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedHistory.length > 0 ? sortedHistory.map((row: any) => {
                                            const rowGap = (row.product_power || 0) - (row.manual_kwh || 0);
                                            const rowGapPercent = row.manual_kwh > 0 ? (rowGap / row.manual_kwh) * 100 : 0;
                                            return (
                                                <tr key={row.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium dark:text-gray-300 border-b dark:border-gray-700">{format(parseISO(row.date), 'dd MMM yyyy')}</td>
                                                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 border-b dark:border-gray-700">{row.product_power?.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 border-b dark:border-gray-700">{row.manual_kwh?.toLocaleString() || '-'}</td>
                                                    <td className={`px-4 py-3 font-black border-b dark:border-gray-700 ${rowGap >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>{rowGap !== 0 ? `${rowGap > 0 ? '+' : ''}${rowGap.toFixed(1)}` : '0'}</td>
                                                    <td className="px-4 py-3 border-b dark:border-gray-700"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${Math.abs(rowGapPercent) < 5 ? 'bg-emerald-100 text-emerald-700' : Math.abs(rowGapPercent) < 10 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{rowGapPercent.toFixed(1)}%</span></td>
                                                </tr>
                                            );
                                        }) : <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Belum ada data untuk range ini</td></tr>}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Tanggal</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Daily Yield</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Status</th>
                                            <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">Last Sync</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedHistory.length > 0 ? sortedHistory.map((row: any) => (
                                            <tr key={`pv-${row.date}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3 font-medium dark:text-gray-300 border-b dark:border-gray-700">{format(parseISO(row.date), 'dd MMMM yyyy')}</td>
                                                <td className="px-4 py-3 border-b dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Sun className="w-3.5 h-3.5 text-yellow-500" />
                                                        <span className="font-black text-gray-900 dark:text-white">{row.product_power >= 1000 ? `${(row.product_power / 1000).toFixed(2)} MWh` : `${row.product_power.toLocaleString()} kWh`}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-b dark:border-gray-700"><span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Synced</span></td>
                                                <td className="px-4 py-3 text-gray-400 text-xs border-b dark:border-gray-700">{row.updated_at ? format(parseISO(row.updated_at), 'HH:mm:ss') : '-'}</td>
                                            </tr>
                                        )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">Belum ada data historis PV</td></tr>}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Config Modal */}
            {showConfig && isAdmin && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-10 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-8">
                            <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">API Configuration</h2>
                        </div>
                        <form onSubmit={handleConfigSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Username</label>
                                <input type="text" value={configForm.username} onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })} className="w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                                <input type="password" value={configForm.password} onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })} placeholder="••••••••" className="w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Station DN</label>
                                <input type="text" value={configForm.station_dn} onChange={(e) => setConfigForm({ ...configForm, station_dn: e.target.value })} className="w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Price per kWh (Rp)</label>
                                <input type="number" value={configForm.price_per_kwh} onChange={(e) => setConfigForm({ ...configForm, price_per_kwh: Number(e.target.value) })} className="w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setShowConfig(false)} className="flex-1 px-6 py-4 text-gray-500 font-bold uppercase tracking-widest hover:text-gray-900 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl active:scale-95 transition-all">Save Config</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
