import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, assetsAPI, maintenanceAPI, downtimeAPI } from '../services/api';
import { Asset, DowntimeLog } from '../types';
import { formatDurationMinutes, formatDateTime } from '../utils/dateUtils';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Factory, Clock, TrendingUp, AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight, BarChart3, HelpCircle, Calendar, X, Wrench, Settings, Package, CheckCircle } from 'lucide-react';

// Tooltip component for info icons
const InfoTooltip = ({ title, formula, description, position = 'top' }: { title: string; formula?: string; description: string; position?: 'top' | 'bottom' }) => (
  <div className="group relative inline-block ml-1">
    <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help inline" />
    <div className={`absolute left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
      position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
    }`}>
      <div className="font-semibold mb-1">{title}</div>
      {formula && (
        <div className="bg-gray-800 dark:bg-gray-600 rounded px-2 py-1 mb-2 font-mono text-[10px]">
          {formula}
        </div>
      )}
      <div className="text-gray-300">{description}</div>
      {/* Arrow */}
      <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
        position === 'top' 
          ? 'top-full border-t-gray-900 dark:border-t-gray-700' 
          : 'bottom-full border-b-gray-900 dark:border-b-gray-700'
      }`}></div>
    </div>
  </div>
);

interface ShiftPattern {
  id: number;
  name: string;
  start_time: string; // "06:00"
  end_time: string;   // "14:00"
  break_minutes: number;
  is_active?: boolean;
}

interface ProductionKPIData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalDowntimeMinutes: number;
    totalDowntimeHours: number;
    totalIncidents: number;
    avgDowntimeMinutes: number;
    scheduledProductionHours: number;
    scheduledProductionMinutes: number;
    productionEfficiency: number;
    totalChangeoverMinutes: number;
    avgChangeoverMinutes: number;
    changeoverCount: number;
    // Timeline data
    maintenanceDowntimeMinutes: number;
    maintenanceDowntimeHours: number;
    maintenanceIncidents: number;
    plannedMaintenanceMinutes: number;
    unplannedMaintenanceMinutes: number;
    productiveMinutes: number;
    productiveHours: number;
    totalAllDowntimeMinutes: number;
    gapMinutes: number;
  };
  breakdown: {
    changeover: {
      product: number;
      mold: number;
      setup: number;
      color: number;
    };
    material: {
      wait: number;
      change: number;
    };
    quality: number;
    operator: number;
  };
  changeoverStats: Array<{
    code: string;
    name: string;
    count: number;
    avg_minutes: number;
    min_minutes: number;
    max_minutes: number;
    total_minutes: number;
  }>;
  downtimeByClassification: Array<{
    code: string;
    name: string;
    category: string;
    incidents: number;
    total_minutes: number;
    avg_minutes: number;
  }>;
  downtimeByAsset: Array<{
    asset_id: number;
    asset_code: string;
    asset_name: string;
    incidents: number;
    total_minutes: number;
    avg_minutes: number;
    changeover_minutes: number;
    material_minutes: number;
    quality_minutes: number;
  }>;
  dailyTrend: Array<{
    date: string;
    incidents: number;
    total_minutes: number;
    changeover_minutes: number;
    material_minutes: number;
    quality_minutes: number;
  }>;
  weeklyComparison: Array<{
    week: string;
    incidents: number;
    total_minutes: number;
    changeover_minutes: number;
  }>;
  recentDowntimes: Array<{
    id: number;
    reason: string;
    classification_code: string;
    classification_name: string;
    classification_category: string;
    duration_minutes: number;
    downtime_type: string;
    asset_code: string;
    asset_name: string;
    start_time: string;
    end_time: string;
  }>;
  maintenanceDowntime: {
    totalMinutes: number;
    incidents: number;
    plannedMinutes: number;
    unplannedMinutes: number;
  };
  dailyBreakdown: Array<{
    date: string;
    production_downtime: number;
    maintenance_downtime: number;
    changeover_minutes: number;
    material_minutes: number;
    quality_minutes: number;
    breakdown_minutes: number;
    pm_minutes: number;
  }>;
  dailyScheduled: Array<{
    date: string;
    scheduled_minutes: number;
  }>;
  scheduleBreakdown: {
    totalShiftMinutesPerDay: number;
    totalShiftMinutesPeriod: number;
    scheduled: number;
    noOrder: number;
    holiday: number;
    maintenanceWindow: number;
    unscheduled: number;
  };
  shifts: Array<{
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
  }>;
  dailyScheduleStatus: Array<{
    date: string;
    shift_pattern_id: number | null;
    shift_name: string | null;
    shift_start: string | null;
    shift_end: string | null;
    status: string;
    planned_minutes: number;
    product_name: string | null;
    notes: string | null;
  }>;
  dailyShiftDowntime: Array<{
    date: string;
    shift_pattern_id: number;
    changeover_minutes: number;
    material_minutes: number;
    quality_minutes: number;
    breakdown_minutes: number;
    pm_minutes: number;
    segments: Array<{
      startPercent: number;
      widthPercent: number;
      category: 'changeover' | 'material' | 'quality' | 'breakdown' | 'pm';
      durationMinutes: number;
      logId: number;
      actualStartTime: string;
      actualEndTime: string;
    }>;
  }>;
}

export default function ProductionKPI() {
  const [kpiData, setKpiData] = useState<ProductionKPIData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [shifts, setShifts] = useState<ShiftPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [period, setPeriod] = useState<number>(30);
  const [dateRangeMode, setDateRangeMode] = useState<'preset' | 'custom'>('preset');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    date: string;
    category: string;
    categoryLabel: string;
    categoryColor: string;
    timeRange?: string;  // Actual time range (e.g., "09:18 - 09:48")
    logs: DowntimeLog[];
  } | null>(null);

  // Recent downtime filter state
  const [recentDowntimeFilter, setRecentDowntimeFilter] = useState<{
    category: string;
    search: string;
  }>({ category: '', search: '' });

  // Category config for colors and labels
  const categoryConfig: Record<string, { label: string; color: string }> = {
    productive: { label: 'Produktif', color: 'bg-green-500' },
    changeover: { label: 'Changeover', color: 'bg-purple-500' },
    material: { label: 'Material', color: 'bg-yellow-500' },
    quality: { label: 'Quality', color: 'bg-orange-500' },
    breakdown: { label: 'Breakdown', color: 'bg-red-500' },
    pm: { label: 'Planned Maintenance', color: 'bg-blue-500' },
  };

  // Fetch downtime details for a specific log ID
  const fetchDowntimeById = async (
    logId: number,
    date: string,
    category: string,
    timeRange: string
  ) => {
    const config = categoryConfig[category];
    if (!config || category === 'productive') return;

    setDetailLoading(true);
    setDetailData({
      date,
      category,
      categoryLabel: config.label,
      categoryColor: config.color,
      timeRange,
      logs: [],
    });
    setShowDetailModal(true);

    try {
      // Fetch specific downtime log by ID
      const res = await downtimeAPI.getById(logId);
      if (res.data) {
        setDetailData(prev => prev ? { ...prev, logs: [res.data] } : null);
      }
    } catch (error) {
      console.error('Error fetching downtime details:', error);
      // Fallback: try to fetch from date range
      try {
        const res = await downtimeAPI.getAll({
          start_date: `${date}T00:00:00`,
          end_date: `${date}T23:59:59`,
          asset_id: selectedAsset ? parseInt(selectedAsset) : undefined,
          limit: 100,
        });
        const log = res.data.find((l: DowntimeLog) => l.id === logId);
        if (log) {
          setDetailData(prev => prev ? { ...prev, logs: [log] } : null);
        }
      } catch (e) {
        console.error('Fallback fetch failed:', e);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Quick date range presets
  const applyPreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setStartDate(format(yesterday, 'yyyy-MM-dd'));
        setEndDate(format(yesterday, 'yyyy-MM-dd'));
        break;
      case 'thisWeek':
        setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'thisMonth':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last7':
        setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last30':
        setStartDate(format(subDays(today, 29), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'last90':
        setStartDate(format(subDays(today, 89), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
    }
    setDateRangeMode('custom');
  };

  useEffect(() => {
    fetchAssets();
    fetchShifts();
  }, []);

  useEffect(() => {
    fetchKPI();
  }, [selectedAsset, period, dateRangeMode, startDate, endDate]);

  const fetchAssets = async () => {
    try {
      const res = await assetsAPI.getAll();
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await maintenanceAPI.getShifts();
      setShifts(res.data.filter((s: ShiftPattern) => s.is_active !== false));
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  // Calculate total shift time dynamically
  const shiftInfo = useMemo(() => {
    if (shifts.length === 0) {
      // Default fallback if no shifts defined
      return {
        totalMinutes: 960, // 16 hours default
        startTime: '06:00',
        endTime: '22:00',
        shifts: [
          { id: 1, name: 'Shift 1', start: '06:00', end: '14:00', widthPercent: 50 },
          { id: 2, name: 'Shift 2', start: '14:00', end: '22:00', widthPercent: 50 },
        ],
        timeMarkers: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
      };
    }

    // Sort shifts by start time
    const sortedShifts = [...shifts].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    // Get earliest start and latest end
    const startTime = sortedShifts[0].start_time;
    const endTime = sortedShifts[sortedShifts.length - 1].end_time;
    
    // Calculate total minutes
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    let startMinutes = parseTime(startTime);
    let endMinutes = parseTime(endTime);
    
    // Handle overnight shifts (end time < start time means next day)
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes;
    
    // Calculate each shift's width percentage - include ID for matching with backend data
    const shiftWidths = sortedShifts.map(s => {
      let sStart = parseTime(s.start_time);
      let sEnd = parseTime(s.end_time);
      if (sEnd <= sStart) sEnd += 24 * 60;
      const duration = sEnd - sStart;
      return {
        id: s.id,  // Include shift ID for matching with dailyShiftDowntime
        name: s.name,
        start: s.start_time,
        end: s.end_time,
        widthPercent: (duration / totalMinutes) * 100
      };
    });

    // Generate time markers (every 2 hours)
    const markers: string[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 120) {
      const adjustedM = m % (24 * 60);
      const h = Math.floor(adjustedM / 60);
      const min = adjustedM % 60;
      markers.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    return {
      totalMinutes,
      startTime,
      endTime,
      shifts: shiftWidths,
      timeMarkers: markers
    };
  }, [shifts]);

  const fetchKPI = async () => {
    try {
      setLoading(true);
      const params: { asset_id?: number; days?: number; start_date?: string; end_date?: string } = {
        asset_id: selectedAsset ? parseInt(selectedAsset) : undefined,
      };
      
      if (dateRangeMode === 'custom') {
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        params.days = period;
      }
      
      const res = await reportsAPI.getProductionKPI(params);
      setKpiData(res.data);
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return 'text-green-600 dark:text-green-400';
    if (value >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getEfficiencyBg = (value: number) => {
    if (value >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (value >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!kpiData || !kpiData.summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI Produksi</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor efisiensi produksi dan changeover time</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tidak ada data KPI</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Data KPI tidak tersedia. Pastikan jadwal produksi dan data downtime sudah diisi.
          </p>
          <button
            onClick={fetchKPI}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KPI Produksi</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor efisiensi produksi dan changeover time</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Semua Mesin</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
            ))}
          </select>
          <button
            onClick={fetchKPI}
            className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setDateRangeMode('preset')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRangeMode === 'preset' 
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Preset
            </button>
            <button
              onClick={() => setDateRangeMode('custom')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRangeMode === 'custom' 
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Custom
            </button>
          </div>

          {dateRangeMode === 'preset' ? (
            /* Preset Options */
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={7}>7 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
                <option value={90}>90 Hari Terakhir</option>
                <option value={365}>1 Tahun Terakhir</option>
              </select>
            </div>
          ) : (
            /* Custom Date Range */
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Dari:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Sampai:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              {/* Quick presets */}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Quick:</span>
                <button
                  onClick={() => applyPreset('today')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => applyPreset('yesterday')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Kemarin
                </button>
                <button
                  onClick={() => applyPreset('thisWeek')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Minggu Ini
                </button>
                <button
                  onClick={() => applyPreset('thisMonth')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => applyPreset('last7')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  7 Hari
                </button>
                <button
                  onClick={() => applyPreset('last30')}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  30 Hari
                </button>
              </div>
            </div>
          )}

          {/* Show selected period */}
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {dateRangeMode === 'custom' ? (
              <span>Periode: {format(new Date(startDate), 'dd MMM yyyy')} - {format(new Date(endDate), 'dd MMM yyyy')}</span>
            ) : (
              <span>Periode: {period} hari terakhir</span>
            )}
          </div>
        </div>
      </div>

      {kpiData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Production Efficiency */}
            <div className={`rounded-xl p-6 border ${getEfficiencyBg(kpiData.summary.productionEfficiency)} border-gray-200 dark:border-gray-700`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Efisiensi Produksi
                  <InfoTooltip 
                    title="Efisiensi Produksi"
                    formula="(Waktu Produktif / Waktu Dijadwalkan) × 100%"
                    description="Persentase waktu produksi efektif dibanding waktu yang dijadwalkan. Waktu Produktif = Dijadwalkan - Total Downtime"
                    position="bottom"
                  />
                </h3>
                <Factory className={`w-5 h-5 ${getEfficiencyColor(kpiData.summary.productionEfficiency)}`} />
              </div>
              <p className={`text-3xl font-bold ${getEfficiencyColor(kpiData.summary.productionEfficiency)}`}>
                {kpiData.summary.productionEfficiency.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: ≥90%
              </p>
            </div>

            {/* Total Downtime */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Downtime
                  <InfoTooltip 
                    title="Total Downtime Produksi"
                    formula="Σ (Semua kejadian downtime produksi)"
                    description="Total waktu mesin berhenti akibat masalah produksi (changeover, material, quality, dll). Tidak termasuk downtime maintenance."
                    position="bottom"
                  />
                </h3>
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.summary.totalDowntimeHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                jam ({kpiData.summary.totalIncidents} kejadian)
              </p>
            </div>

            {/* Avg Changeover Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Changeover
                  <InfoTooltip 
                    title="Rata-rata Waktu Changeover"
                    formula="Total Changeover / Jumlah Changeover"
                    description="Rata-rata durasi setiap pergantian (produk, mold, setup, warna). Semakin rendah semakin baik."
                    position="bottom"
                  />
                </h3>
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.summary.avgChangeoverMinutes.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                menit ({kpiData.summary.changeoverCount}x changeover)
              </p>
            </div>

            {/* Avg Downtime Per Incident */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg per Kejadian
                  <InfoTooltip 
                    title="Rata-rata Downtime per Kejadian"
                    formula="Total Downtime / Jumlah Kejadian"
                    description="Rata-rata durasi setiap kejadian downtime. Membantu identifikasi apakah downtime singkat tapi sering, atau jarang tapi lama."
                    position="bottom"
                  />
                </h3>
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.summary.avgDowntimeMinutes.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                menit rata-rata
              </p>
            </div>
          </div>

          {/* Summary Stats - Ringkasan Periode */}
          {kpiData.scheduleBreakdown && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ringkasan Periode ({period} Hari)
                <InfoTooltip 
                  title="Ringkasan Periode"
                  description="Gambaran umum alokasi waktu produksi. Semua nilai dihitung berdasarkan konfigurasi shift aktif dan jadwal produksi yang sudah diinput."
                  position="bottom"
                />
              </h3>
              
              {/* Warning if no schedule data */}
              {kpiData.scheduleBreakdown.scheduled === 0 && kpiData.scheduleBreakdown.unscheduled > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>
                      Belum ada jadwal produksi untuk periode ini. 
                      <Link to="/production-schedule" className="underline ml-1">Buat jadwal produksi</Link>
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {/* Total Waktu Tersedia */}
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDurationMinutes(kpiData.scheduleBreakdown.totalShiftMinutesPeriod)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total Waktu Tersedia
                    <InfoTooltip 
                      title="Total Waktu Tersedia"
                      formula="(Shift 1 + Shift 2 + ...) × Jumlah Hari"
                      description="Kapasitas maksimum waktu produksi berdasarkan konfigurasi shift aktif. Contoh: 2 shift × 7 jam × 30 hari = 420 jam"
                      position="bottom"
                    />
                  </p>
                </div>
                {/* Dijadwalkan Produksi */}
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatDurationMinutes(kpiData.scheduleBreakdown.scheduled)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dijadwalkan Produksi
                    <InfoTooltip 
                      title="Dijadwalkan Produksi"
                      formula="Σ (Hari dengan status 'scheduled' × Waktu shift)"
                      description="Total waktu yang sudah dijadwalkan untuk produksi di menu Jadwal Produksi. Jika 0, berarti belum ada jadwal dibuat."
                      position="bottom"
                    />
                  </p>
                </div>
                {/* No Order / Unscheduled */}
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {formatDurationMinutes(kpiData.scheduleBreakdown.noOrder + kpiData.scheduleBreakdown.unscheduled)}
                  </p>
                  <p className="text-xs text-gray-500">
                    No Order / Unscheduled
                    <InfoTooltip 
                      title="No Order / Unscheduled"
                      formula="(Hari 'no_order' × Shift) + (Hari tanpa jadwal × Shift)"
                      description="Waktu yang tidak dijadwalkan produksi karena tidak ada order atau belum diinput ke sistem jadwal."
                      position="bottom"
                    />
                  </p>
                </div>
                {/* Libur */}
                <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {formatDurationMinutes(kpiData.scheduleBreakdown.holiday)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Libur
                    <InfoTooltip 
                      title="Libur"
                      formula="Hari dengan status 'holiday' × Waktu shift"
                      description="Total waktu yang dijadwalkan sebagai hari libur (tanggal merah, cuti bersama, dll)."
                      position="bottom"
                    />
                  </p>
                </div>
                {/* Maintenance Window */}
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatDurationMinutes(kpiData.scheduleBreakdown.maintenanceWindow)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Maintenance Window
                    <InfoTooltip 
                      title="Maintenance Window"
                      formula="Hari dengan status 'maintenance_window' × Waktu shift"
                      description="Waktu yang dialokasikan khusus untuk maintenance terjadwal (PM, overhaul, dll)."
                      position="bottom"
                    />
                  </p>
                </div>
                {/* Total Downtime */}
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatDurationMinutes(kpiData.summary.totalDowntimeMinutes + kpiData.summary.maintenanceDowntimeMinutes)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total Downtime
                    <InfoTooltip 
                      title="Total Downtime"
                      formula="Downtime Produksi + Downtime Maintenance"
                      description="Total waktu mesin berhenti (tidak produktif) yang tercatat dari downtime tracker dan work order."
                      position="bottom"
                    />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Changeover Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-500" />
                Breakdown Changeover
                <InfoTooltip 
                  title="Breakdown Changeover"
                  description="Rincian waktu pergantian (changeover) berdasarkan jenisnya. Changeover adalah waktu yang dibutuhkan untuk beralih dari satu produk/mold/warna ke yang lain."
                  position="bottom"
                />
              </h3>
              <div className="space-y-4">
                {/* Product Changeover */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔄</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ganti Produk</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.changeover.product)}
                  </span>
                </div>
                {/* Mold Changeover */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔧</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ganti Mold</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.changeover.mold)}
                  </span>
                </div>
                {/* Setup */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚙️</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Setup Mesin</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.changeover.setup)}
                  </span>
                </div>
                {/* Color Changeover */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎨</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ganti Warna</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.changeover.color)}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Total Changeover</span>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatDurationMinutes(kpiData.summary.totalChangeoverMinutes)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Breakdown Lainnya
                <InfoTooltip 
                  title="Breakdown Lainnya"
                  description="Rincian downtime produksi selain changeover. Termasuk: tunggu material, ganti material, quality issues (reject/rework), dan kesalahan operator."
                  position="bottom"
                />
              </h3>
              <div className="space-y-4">
                {/* Material Wait */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📦</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tunggu Material</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.material.wait)}
                  </span>
                </div>
                {/* Material Change */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔁</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Ganti Material</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.material.change)}
                  </span>
                </div>
                {/* Quality */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Quality Issues</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.quality)}
                  </span>
                </div>
                {/* Operator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👷</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Operator</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(kpiData.breakdown.operator)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Changeover Statistics Table */}
          {kpiData.changeoverStats && kpiData.changeoverStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistik Changeover
                <InfoTooltip 
                  title="Statistik Changeover"
                  formula="Min = tercepat, Avg = rata-rata, Max = terlama"
                  description="Tabel statistik detail setiap jenis changeover. Gunakan untuk mengidentifikasi changeover yang perlu dioptimalkan (SMED)."
                  position="bottom"
                />
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3">Tipe</th>
                      <th className="pb-3 text-center">Jumlah</th>
                      <th className="pb-3 text-right">Min</th>
                      <th className="pb-3 text-right">Avg</th>
                      <th className="pb-3 text-right">Max</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {kpiData.changeoverStats.map((stat, index) => (
                      <tr key={index}>
                        <td className="py-3 text-sm text-gray-900 dark:text-white">{stat.name}</td>
                        <td className="py-3 text-sm text-center text-gray-600 dark:text-gray-300">{stat.count}x</td>
                        <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">{stat.min_minutes}m</td>
                        <td className="py-3 text-sm text-right font-medium text-purple-600 dark:text-purple-400">{stat.avg_minutes.toFixed(0)}m</td>
                        <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">{stat.max_minutes}m</td>
                        <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatDurationMinutes(stat.total_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Downtime by Asset */}
          {kpiData.downtimeByAsset && kpiData.downtimeByAsset.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Downtime per Mesin
                <InfoTooltip 
                  title="Downtime per Mesin"
                  description="Breakdown downtime produksi untuk setiap mesin. Klik kode asset untuk melihat detail mesin. Kolom menunjukkan distribusi downtime per kategori."
                  position="bottom"
                />
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3">Asset</th>
                      <th className="pb-3 text-center">Kejadian</th>
                      <th className="pb-3 text-right">Changeover</th>
                      <th className="pb-3 text-right">Material</th>
                      <th className="pb-3 text-right">Quality</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {kpiData.downtimeByAsset.map((asset, index) => (
                      <tr key={index}>
                        <td className="py-3">
                          <Link 
                            to={`/assets/${asset.asset_id}`}
                            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            {asset.asset_code}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{asset.asset_name}</p>
                        </td>
                        <td className="py-3 text-sm text-center text-gray-600 dark:text-gray-300">{asset.incidents}</td>
                        <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatDurationMinutes(asset.changeover_minutes)}</td>
                        <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatDurationMinutes(asset.material_minutes)}</td>
                        <td className="py-3 text-sm text-right text-gray-600 dark:text-gray-300">{formatDurationMinutes(asset.quality_minutes)}</td>
                        <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatDurationMinutes(asset.total_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Comparison */}
          {kpiData.weeklyComparison && kpiData.weeklyComparison.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Perbandingan Mingguan
                <InfoTooltip 
                  title="Perbandingan Mingguan"
                  description="Tren downtime per minggu. Panah hijau = downtime menurun (bagus), panah merah = downtime meningkat. Gunakan untuk melihat progress improvement."
                  position="bottom"
                />
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {kpiData.weeklyComparison.map((week, index) => {
                  const prevWeek = index > 0 ? kpiData.weeklyComparison[index - 1] : null;
                  const trend = prevWeek 
                    ? week.total_minutes - prevWeek.total_minutes 
                    : 0;
                  
                  return (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{week.week}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {formatDurationMinutes(week.total_minutes)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {trend !== 0 && (
                          <>
                            {trend > 0 ? (
                              <ArrowUpRight className="w-4 h-4 text-red-500" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-green-500" />
                            )}
                            <span className={`text-xs ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {Math.abs(trend)}m
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{week.incidents} kejadian</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Downtimes with Filter */}
          {kpiData.recentDowntimes && kpiData.recentDowntimes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Downtime Terbaru
                  <InfoTooltip 
                    title="Downtime Terbaru"
                    description="Daftar kejadian downtime produksi terbaru. Filter berdasarkan kategori atau asset untuk analisis lebih detail."
                    position="bottom"
                  />
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {kpiData.recentDowntimes.length} kejadian
                </span>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Category Filter Buttons */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: '' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      !recentDowntimeFilter.category 
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: 'CO-' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      recentDowntimeFilter.category === 'CO-' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    }`}
                  >
                    Changeover
                  </button>
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: 'BD-' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      recentDowntimeFilter.category === 'BD-' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                    }`}
                  >
                    Breakdown
                  </button>
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: 'PM-' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      recentDowntimeFilter.category === 'PM-' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    }`}
                  >
                    PM
                  </button>
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: 'MAT-' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      recentDowntimeFilter.category === 'MAT-' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                    }`}
                  >
                    Material
                  </button>
                  <button
                    onClick={() => setRecentDowntimeFilter(prev => ({ ...prev, category: 'QC-' }))}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      recentDowntimeFilter.category === 'QC-' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                    }`}
                  >
                    Quality
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Cari keterangan..."
                    value={recentDowntimeFilter.search}
                    onChange={(e) => setRecentDowntimeFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Scrollable List */}
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const filtered = kpiData.recentDowntimes.filter(dt => {
                    // Category filter
                    if (recentDowntimeFilter.category) {
                      const code = dt.classification_code || '';
                      if (!code.startsWith(recentDowntimeFilter.category)) return false;
                    }
                    // Search filter
                    if (recentDowntimeFilter.search) {
                      const searchLower = recentDowntimeFilter.search.toLowerCase();
                      const reason = (dt.reason || '').toLowerCase();
                      const asset = (dt.asset_name || '').toLowerCase();
                      const classification = (dt.classification_name || '').toLowerCase();
                      if (!reason.includes(searchLower) && !asset.includes(searchLower) && !classification.includes(searchLower)) {
                        return false;
                      }
                    }
                    return true;
                  });
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada downtime yang cocok dengan filter</p>
                      </div>
                    );
                  }
                  
                  return filtered.map((dt, index) => {
                    // Determine category color
                    const code = dt.classification_code || '';
                    let categoryColor = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    if (code.startsWith('CO-')) categoryColor = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
                    else if (code.startsWith('BD-')) categoryColor = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                    else if (code.startsWith('PM-')) categoryColor = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                    else if (code.startsWith('MAT-')) categoryColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
                    else if (code.startsWith('QC-')) categoryColor = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
                    
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{dt.asset_code}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryColor}`}>
                              {dt.classification_name}
                            </span>
                          </div>
                          {dt.reason && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{dt.reason}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDurationMinutes(dt.duration_minutes)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(dt.start_time).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Summary Footer */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Total: {kpiData.recentDowntimes.filter(dt => {
                    if (recentDowntimeFilter.category) {
                      const code = dt.classification_code || '';
                      if (!code.startsWith(recentDowntimeFilter.category)) return false;
                    }
                    if (recentDowntimeFilter.search) {
                      const searchLower = recentDowntimeFilter.search.toLowerCase();
                      const reason = (dt.reason || '').toLowerCase();
                      const asset = (dt.asset_name || '').toLowerCase();
                      if (!reason.includes(searchLower) && !asset.includes(searchLower)) return false;
                    }
                    return true;
                  }).length} kejadian
                </span>
                <span>
                  Durasi: {formatDurationMinutes(
                    kpiData.recentDowntimes.filter(dt => {
                      if (recentDowntimeFilter.category) {
                        const code = dt.classification_code || '';
                        if (!code.startsWith(recentDowntimeFilter.category)) return false;
                      }
                      if (recentDowntimeFilter.search) {
                        const searchLower = recentDowntimeFilter.search.toLowerCase();
                        const reason = (dt.reason || '').toLowerCase();
                        const asset = (dt.asset_name || '').toLowerCase();
                        if (!reason.includes(searchLower) && !asset.includes(searchLower)) return false;
                      }
                      return true;
                    }).reduce((sum, dt) => sum + (dt.duration_minutes || 0), 0)
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Shift-based Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline Shift ({shiftInfo.startTime} - {shiftInfo.endTime})
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({Math.round(shiftInfo.totalMinutes / 60)} jam)
              </span>
              <InfoTooltip 
                title="Timeline Shift"
                description="Visualisasi timeline harian berdasarkan shift. Menampilkan status jadwal produksi dan breakdown waktu untuk setiap hari dalam periode yang dipilih."
                position="bottom"
              />
            </h3>
            
            {/* Daily Timeline - Per Day View */}
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {/* Header Row with Time markers aligned to Timeline column */}
              <div className="flex items-end gap-2 pb-1 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                {/* Empty space for Tanggal column */}
                <div className="w-24 flex-shrink-0"></div>
                {/* Empty space for Status Shift column */}
                <div className="w-24 flex-shrink-0"></div>
                {/* Time markers - aligned with Timeline column */}
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {shiftInfo.timeMarkers.map((time, idx) => (
                      <span key={idx}>{time}</span>
                    ))}
                  </div>
                  {/* Shift indicators */}
                  <div className="flex h-5 rounded overflow-hidden">
                    {shiftInfo.shifts.map((shift, idx) => {
                      const colors = [
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                        'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
                      ];
                      return (
                        <div 
                          key={idx}
                          className={`${colors[idx % colors.length]} border-r border-white dark:border-gray-800 last:border-r-0 flex items-center justify-center`}
                          style={{ width: `${shift.widthPercent}%` }}
                        >
                          <span className="text-xs font-medium truncate px-1">
                            {shift.name} ({shift.start}-{shift.end})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Empty space for Downtime column */}
                <div className="w-16 flex-shrink-0"></div>
              </div>
              
              {/* Column Labels */}
              <div className="flex items-center gap-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="w-24 flex-shrink-0">Tanggal</div>
                <div className="w-24 flex-shrink-0 text-center">Status Shift</div>
                <div className="flex-1">Timeline Produksi</div>
                <div className="w-16 flex-shrink-0 text-right">Downtime</div>
              </div>

              {/* Daily Rows */}
              {(() => {
                // Create a map for quick lookup - now per date AND per shift
                type ShiftSchedule = { status: string; planned_minutes: number; product_name: string | null; shift_pattern_id: number | null; shift_name: string | null };
                const scheduleMap = new Map<string, Map<number | null, ShiftSchedule>>();
                (kpiData.dailyScheduleStatus || []).forEach(s => {
                  if (!scheduleMap.has(s.date)) {
                    scheduleMap.set(s.date, new Map());
                  }
                  scheduleMap.get(s.date)!.set(s.shift_pattern_id, { 
                    status: s.status, 
                    planned_minutes: s.planned_minutes, 
                    product_name: s.product_name,
                    shift_pattern_id: s.shift_pattern_id,
                    shift_name: s.shift_name
                  });
                });

                const downtimeMap = new Map<string, typeof kpiData.dailyBreakdown[0]>();
                (kpiData.dailyBreakdown || []).forEach(d => {
                  downtimeMap.set(d.date, d);
                });

                // Generate dates for the period
                const dates: string[] = [];
                for (let i = 0; i < period; i++) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  dates.push(d.toISOString().split('T')[0]);
                }

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'scheduled': return 'bg-green-500';
                    case 'no_order': return 'bg-gray-400';
                    case 'holiday': return 'bg-pink-400';
                    case 'maintenance_window': return 'bg-blue-400';
                    default: return 'bg-gray-300 dark:bg-gray-600';
                  }
                };

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'scheduled': return 'Produksi';
                    case 'no_order': return 'No Order';
                    case 'holiday': return 'Libur';
                    case 'maintenance_window': return 'Maint.';
                    default: return '-';
                  }
                };

                return dates.map((date) => {
                  const dateSchedules = scheduleMap.get(date);
                  const downtime = downtimeMap.get(date);
                  
                  // Calculate total planned minutes from scheduled shifts only
                  let plannedMin = 0;
                  if (dateSchedules) {
                    dateSchedules.forEach(s => {
                      if (s.status === 'scheduled') {
                        plannedMin += s.planned_minutes || 0;
                      }
                    });
                  }

                  // Calculate total downtime from daily breakdown
                  const totalDowntime = (downtime?.production_downtime || 0) + (downtime?.maintenance_downtime || 0);

                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  return (
                    <div 
                      key={date} 
                      className={`flex items-center gap-2 py-1 ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/20 -mx-2 px-2 rounded' : ''} ${isWeekend ? 'opacity-75' : ''}`}
                    >
                      {/* Date */}
                      <div className="w-24 flex-shrink-0">
                        <div className={`text-xs font-medium ${isToday ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {dateObj.toLocaleDateString('id-ID', { month: 'short' })}
                        </div>
                      </div>

                      {/* Per-Shift Status Badges */}
                      <div className="w-24 flex-shrink-0 flex gap-0.5">
                        {shiftInfo.shifts.map((shift, sIdx) => {
                          // Find matching shift by name/time
                          const shiftSchedule = dateSchedules ? Array.from(dateSchedules.values()).find(
                            s => s.shift_name === shift.name || 
                                 (s.shift_pattern_id && shifts.find(sp => sp.id === s.shift_pattern_id)?.name === shift.name)
                          ) : null;
                          const shiftStatus = shiftSchedule?.status || 'unscheduled';
                          
                          return (
                            <span 
                              key={sIdx}
                              className={`flex-1 h-5 rounded-sm flex items-center justify-center text-[8px] font-medium text-white ${getStatusColor(shiftStatus)}`}
                              title={`${shift.name}: ${getStatusLabel(shiftStatus)}`}
                            >
                              S{sIdx + 1}
                            </span>
                          );
                        })}
                      </div>

                      {/* Timeline Bar - Per Shift with Actual Time-Based Downtime */}
                      <div className="flex-1">
                        <div className="h-6 bg-gray-100 dark:bg-gray-700/50 rounded overflow-hidden flex">
                          {shiftInfo.shifts.map((shift, sIdx) => {
                            // Find matching shift schedule
                            const shiftSchedule = dateSchedules ? Array.from(dateSchedules.values()).find(
                              s => s.shift_name === shift.name || 
                                   (s.shift_pattern_id && shifts.find(sp => sp.id === s.shift_pattern_id)?.name === shift.name)
                            ) : null;
                            const shiftStatus = shiftSchedule?.status || 'unscheduled';
                            const shiftPlannedMin = shiftSchedule?.planned_minutes || 0;
                            const isScheduled = shiftStatus === 'scheduled';
                            
                            // Get actual per-shift downtime from dailyShiftDowntime using shift.id directly
                            const shiftPatternId = shift.id;  // Use ID from shiftInfo.shifts
                            const actualShiftDowntime = kpiData?.dailyShiftDowntime?.find(
                              sd => sd.date === date && sd.shift_pattern_id === shiftPatternId
                            );
                            
                            // Calculate total downtime for this shift
                            const shiftTotalDowntime = (actualShiftDowntime?.changeover_minutes || 0) +
                              (actualShiftDowntime?.material_minutes || 0) +
                              (actualShiftDowntime?.quality_minutes || 0) +
                              (actualShiftDowntime?.breakdown_minutes || 0) +
                              (actualShiftDowntime?.pm_minutes || 0);
                            const shiftProductive = isScheduled ? Math.max(0, shiftPlannedMin - shiftTotalDowntime) : 0;
                            
                            {/* Get positioned segments for this shift */}
                            const segments = actualShiftDowntime?.segments || [];
                            
                            // Category colors and click handlers
                            const getCategoryColor = (cat: string) => {
                              switch (cat) {
                                case 'changeover': return 'bg-purple-500';
                                case 'material': return 'bg-yellow-500';
                                case 'quality': return 'bg-orange-500';
                                case 'breakdown': return 'bg-red-500';
                                case 'pm': return 'bg-blue-500';
                                default: return 'bg-red-400';
                              }
                            };
                            
                            const getCategoryLabel = (cat: string) => {
                              switch (cat) {
                                case 'changeover': return 'Changeover';
                                case 'material': return 'Material';
                                case 'quality': return 'Quality';
                                case 'breakdown': return 'Breakdown';
                                case 'pm': return 'PM';
                                default: return cat;
                              }
                            };
                            
                            return (
                              <div 
                                key={sIdx}
                                className="h-full relative"
                                style={{ width: `${shift.widthPercent}%` }}
                              >
                                {isScheduled ? (
                                  <>
                                    {/* Green background for productive time */}
                                    <div 
                                      className="absolute inset-0 bg-green-500"
                                      title={`${shift.name} - Produktif: ${formatDurationMinutes(shiftProductive)}`}
                                    />
                                    
                                    {/* Positioned downtime segments overlay */}
                                    {segments.map((segment, segIdx) => (
                                      <div
                                        key={segIdx}
                                        className={`absolute top-0 bottom-0 ${getCategoryColor(segment.category)} cursor-pointer hover:opacity-80 transition-opacity`}
                                        style={{
                                          left: `${segment.startPercent}%`,
                                          width: `${Math.max(segment.widthPercent, 0.5)}%` // Minimum width for visibility
                                        }}
                                        title={`${segment.actualStartTime} - ${segment.actualEndTime} | ${getCategoryLabel(segment.category)}: ${formatDurationMinutes(segment.durationMinutes)} - Klik untuk detail`}
                                        onClick={() => fetchDowntimeById(
                                          segment.logId,
                                          date,
                                          segment.category,
                                          `${segment.actualStartTime} - ${segment.actualEndTime}`
                                        )}
                                      />
                                    ))}
                                  </>
                                ) : (
                                  <div className={`w-full h-full ${getStatusColor(shiftStatus)} flex items-center justify-center`}>
                                    <span className="text-white text-[8px] font-medium">
                                      {shiftStatus === 'holiday' ? '🏖️' : shiftStatus === 'no_order' ? '📭' : shiftStatus === 'maintenance_window' ? '🔧' : '—'}
                                    </span>
                                  </div>
                                )}
                                {/* Shift separator */}
                                {sIdx < shiftInfo.shifts.length - 1 && (
                                  <div className="absolute right-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 z-10" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Downtime Summary */}
                      <div className="w-16 text-right flex-shrink-0">
                        {totalDowntime > 0 ? (
                          <span className={`text-xs font-medium ${totalDowntime > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                            {formatDurationMinutes(totalDowntime)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-[10px]">
              <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded"></div><span className="text-gray-500">Produksi</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-400 rounded"></div><span className="text-gray-500">No Order</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-pink-400 rounded"></div><span className="text-gray-500">Libur</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded"></div><span className="text-gray-500">Maint.</span></div>
              <span className="mx-2">|</span>
              <span className="font-medium text-gray-600 dark:text-gray-400">Timeline:</span>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded"></div><span className="text-gray-500">Produktif</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded"></div><span className="text-gray-500">Changeover</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded"></div><span className="text-gray-500">Quality</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded"></div><span className="text-gray-500">Breakdown</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded"></div><span className="text-gray-500">PM</span></div>
            </div>
          </div>

        </>
      )}

      {/* Downtime Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${detailData.categoryColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    {detailData.category === 'breakdown' && <AlertTriangle className="w-6 h-6" />}
                    {detailData.category === 'pm' && <Wrench className="w-6 h-6" />}
                    {detailData.category === 'changeover' && <Settings className="w-6 h-6" />}
                    {detailData.category === 'material' && <Package className="w-6 h-6" />}
                    {detailData.category === 'quality' && <CheckCircle className="w-6 h-6" />}
                    <div>
                      <h2 className="text-lg font-semibold">{detailData.categoryLabel}</h2>
                      <p className="text-sm opacity-90">
                        {new Date(detailData.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {detailData.timeRange && (
                          <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs font-mono">
                            🕐 {detailData.timeRange}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-3 text-gray-500">Memuat data...</span>
                  </div>
                ) : detailData.logs.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Tidak ada data downtime untuk kategori ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {detailData.logs.length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Kejadian</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatDurationMinutes(detailData.logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total Durasi</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatDurationMinutes(Math.round(detailData.logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / detailData.logs.length))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</div>
                      </div>
                    </div>

                    {/* Log List */}
                    <div className="space-y-3">
                      {detailData.logs.map((log, idx) => (
                        <div 
                          key={log.id || idx} 
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {log.classification_name || 'Unknown Classification'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {log.asset_code} - {log.asset_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${detailData.category === 'breakdown' ? 'text-red-600' : detailData.category === 'pm' ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                                {formatDurationMinutes(log.duration_minutes || 0)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {log.downtime_type === 'planned' ? '📅 Planned' : '⚠️ Unplanned'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Time Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span>🕐 Mulai: {formatDateTime(log.start_time)}</span>
                            {log.end_time && <span>🏁 Selesai: {formatDateTime(log.end_time)}</span>}
                          </div>

                          {/* Reason */}
                          {log.reason && (
                            <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Keterangan:</div>
                              <div 
                                className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: log.reason }}
                              />
                            </div>
                          )}

                          {/* Failure Code */}
                          {log.failure_code_code && (
                            <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {log.failure_code_code}: {log.failure_code_description}
                            </div>
                          )}

                          {/* Work Order Link */}
                          {log.work_order_id && (
                            <div className="mt-2">
                              <Link 
                                to={`/work-orders/${log.work_order_id}`}
                                className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Wrench className="w-3 h-3 mr-1" />
                                Lihat Work Order #{log.work_order_number || log.work_order_id}
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Menampilkan {detailData.logs.length} log downtime
                  </span>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

