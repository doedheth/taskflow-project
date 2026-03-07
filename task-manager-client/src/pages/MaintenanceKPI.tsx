import { useState, useEffect } from 'react';
import { reportsAPI, assetsAPI } from '../services/api';
import { MaintenanceKPI as MaintenanceKPIType, Asset } from '../types';
import { formatDurationMinutes } from '../utils/dateUtils';
import { HelpCircle } from 'lucide-react';

// Tooltip component for info icons
const InfoTooltip = ({ title, formula, description, position = 'bottom' }: { title: string; formula?: string; description: string; position?: 'top' | 'bottom' }) => (
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

export default function MaintenanceKPI() {
  const [kpiData, setKpiData] = useState<MaintenanceKPIType | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [period, setPeriod] = useState<number>(30);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchKPI();
  }, [selectedAsset, period]);

  const fetchAssets = async () => {
    try {
      const res = await assetsAPI.getAll();
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchKPI = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getKPIDashboard({
        asset_id: selectedAsset ? parseInt(selectedAsset) : undefined,
        days: period,
      });
      setKpiData(res.data);
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (value: number) => {
    if (value >= 95) return 'text-green-600 dark:text-green-400';
    if (value >= 85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!kpiData || !kpiData.kpi) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance KPI Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor kinerja maintenance dan downtime</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tidak ada data KPI</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Data KPI tidak tersedia. Pastikan data maintenance dan downtime sudah diisi.
          </p>
          <button
            onClick={fetchKPI}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance KPI Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor kinerja maintenance dan downtime</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={7}>7 Hari</option>
            <option value={30}>30 Hari</option>
            <option value={90}>90 Hari</option>
            <option value={365}>1 Tahun</option>
          </select>
        </div>
      </div>

      {kpiData && kpiData.kpi && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Availability */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Availability
                  <InfoTooltip 
                    title="Equipment Availability"
                    formula="((Scheduled Time - Downtime) / Scheduled Time) × 100%"
                    description="Persentase waktu mesin tersedia untuk beroperasi. Semakin tinggi semakin baik. Target ideal ≥95%."
                  />
                </h3>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className={`text-3xl font-bold ${getAvailabilityColor(kpiData.kpi.availability)}`}>
                {kpiData.kpi.availability.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: ≥95%
              </p>
            </div>

            {/* MTBF */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  MTBF
                  <InfoTooltip 
                    title="Mean Time Between Failures"
                    formula="Operating Time / Number of Failures"
                    description="Rata-rata waktu operasi antar kegagalan. Semakin tinggi semakin baik, menunjukkan reliabilitas mesin yang lebih baik."
                  />
                </h3>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.kpi.mtbf.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">jam antar kegagalan</p>
            </div>

            {/* MTTR */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  MTTR
                  <InfoTooltip 
                    title="Mean Time To Repair"
                    formula="Total Repair Time / Number of Repairs"
                    description="Rata-rata waktu yang dibutuhkan untuk memperbaiki mesin. Semakin rendah semakin baik, menunjukkan efisiensi tim maintenance."
                  />
                </h3>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.kpi.mttr.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">jam rata-rata repair</p>
            </div>

            {/* Total Downtime */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Downtime
                  <InfoTooltip 
                    title="Total Downtime"
                    formula="Σ (Semua durasi downtime)"
                    description="Total waktu mesin tidak beroperasi karena kerusakan (unplanned) dalam periode ini. Termasuk semua kejadian breakdown."
                  />
                </h3>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {kpiData.kpi.downtimeHours.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                jam ({kpiData.kpi.failureCount} kejadian)
              </p>
            </div>
          </div>

          {/* PM Compliance Section */}
          {kpiData.pmCompliance && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  PM Compliance
                  <InfoTooltip 
                    title="Preventive Maintenance Compliance"
                    formula="(PM Selesai Tepat Waktu / Total PM Terjadwal) × 100%"
                    description="Mengukur kepatuhan penyelesaian jadwal PM. Target ideal ≥90%. PM yang terlambat atau overdue menunjukkan gap dalam eksekusi maintenance."
                  />
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  kpiData.pmCompliance.complianceRate >= 90 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : kpiData.pmCompliance.complianceRate >= 70
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {kpiData.pmCompliance.complianceRate}% Compliance
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {kpiData.pmCompliance.totalScheduled}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Terjadwal</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {kpiData.pmCompliance.completedOnTime}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tepat Waktu</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {kpiData.pmCompliance.completedLate}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Terlambat</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {kpiData.pmCompliance.overdue}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  {kpiData.pmCompliance.totalScheduled > 0 && (
                    <>
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${(kpiData.pmCompliance.completedOnTime / kpiData.pmCompliance.totalScheduled) * 100}%` }}
                      />
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${(kpiData.pmCompliance.completedLate / kpiData.pmCompliance.totalScheduled) * 100}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${(kpiData.pmCompliance.overdue / kpiData.pmCompliance.totalScheduled) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming PM */}
          {kpiData.upcomingPM && kpiData.upcomingPM.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming PM (Next 7 Days)
                <InfoTooltip 
                  title="Upcoming Preventive Maintenance"
                  description="Jadwal PM yang akan datang dalam 7 hari ke depan. PM overdue ditampilkan pertama. Klik untuk membuat Work Order."
                />
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Asset</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">PM Title</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Due Date</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Frequency</th>
                      <th className="text-left py-2 text-gray-600 dark:text-gray-400">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.upcomingPM.map((pm: any) => (
                      <tr key={pm.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            pm.status === 'overdue' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : pm.status === 'due_today'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {pm.status === 'overdue' ? '⚠️ Overdue' : pm.status === 'due_today' ? '📅 Hari Ini' : '🔔 Akan Datang'}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className="font-mono text-blue-600 dark:text-blue-400">{pm.asset_code}</span>
                          <span className={`ml-1 text-xs px-1 rounded ${
                            pm.criticality === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            pm.criticality === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>{pm.criticality}</span>
                        </td>
                        <td className="py-2 text-gray-900 dark:text-white">{pm.title}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">
                          {new Date(pm.next_due).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-2">
                          <span className="capitalize text-gray-600 dark:text-gray-400">{pm.frequency_type}</span>
                        </td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{pm.assigned_to_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Downtime by Classification */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Downtime by Classification
                <InfoTooltip 
                  title="Downtime by Classification"
                  description="Breakdown downtime berdasarkan klasifikasi. Titik merah menandakan downtime yang dihitung (counts_as_downtime), titik abu-abu adalah downtime yang tidak dihitung."
                />
              </h3>
              <div className="space-y-3">
                {kpiData.downtimeByType?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${item.counts_as_downtime ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.incidents} kejadian</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDurationMinutes(item.total_minutes)}</span>
                    </div>
                  </div>
                ))}
                {(!kpiData.downtimeByType || kpiData.downtimeByType.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada data downtime</p>
                )}
              </div>
            </div>

            {/* Top Failing Assets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Failing Assets
                <InfoTooltip 
                  title="Top Failing Assets"
                  description="Aset dengan jumlah kegagalan (unplanned downtime) terbanyak. Gunakan untuk prioritas maintenance preventif."
                />
              </h3>
              <div className="space-y-3">
                {kpiData.topFailingAssets?.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-blue-600 dark:text-blue-400">{asset.asset_code}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{asset.failures} failures</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDurationMinutes(asset.total_downtime_minutes)}</p>
                    </div>
                  </div>
                ))}
                {(!kpiData.topFailingAssets || kpiData.topFailingAssets.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada kegagalan tercatat</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Order Stats & Top Failure Codes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Order Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Work Order Statistics
                <InfoTooltip 
                  title="Work Order Statistics"
                  description="Statistik work order berdasarkan tipe (preventive, corrective, emergency). Avg = rata-rata waktu penyelesaian dalam jam."
                />
              </h3>
              <div className="space-y-4">
                {kpiData.workOrderStats?.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{stat.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Avg: {stat.avg_completion_hours?.toFixed(1) || 0} jam
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.count}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{stat.completed} completed</p>
                    </div>
                  </div>
                ))}
                {(!kpiData.workOrderStats || kpiData.workOrderStats.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada data work order</p>
                )}
              </div>
            </div>

            {/* Top Failure Codes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Failure Codes
                <InfoTooltip 
                  title="Top Failure Codes"
                  description="Kode kegagalan yang paling sering terjadi. Gunakan untuk analisis akar masalah (Root Cause Analysis) dan prioritas perbaikan."
                />
              </h3>
              <div className="space-y-3">
                {kpiData.topFailureCodes?.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-mono text-sm text-gray-900 dark:text-white">{code.code}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{code.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{code.occurrences}x</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDurationMinutes(code.total_downtime_minutes)}</p>
                    </div>
                  </div>
                ))}
                {(!kpiData.topFailureCodes || kpiData.topFailureCodes.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada failure codes tercatat</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Downtime Trend (Weekly)
              <InfoTooltip 
                title="Downtime Trend"
                description="Tren downtime per minggu. 'Counted Downtime' adalah downtime yang dihitung ke dalam kalkulasi availability (hanya yang counts_as_downtime = true)."
              />
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="pb-3">Week</th>
                    <th className="pb-3">Incidents</th>
                    <th className="pb-3">Total Downtime</th>
                    <th className="pb-3">Counted Downtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {kpiData.weeklyTrend?.map((week, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm text-gray-900 dark:text-white">{week.week}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{week.incidents}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{formatDurationMinutes(week.total_minutes)}</td>
                      <td className="py-3 text-sm font-medium text-red-600 dark:text-red-400">{formatDurationMinutes(week.counted_minutes)}</td>
                    </tr>
                  ))}
                  {(!kpiData.weeklyTrend || kpiData.weeklyTrend.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada data trend
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Time Breakdown
              <InfoTooltip 
                title="Time Breakdown"
                formula="Scheduled = Operating + Downtime"
                description="Pembagian waktu produksi. Scheduled Time = waktu yang dijadwalkan. Operating Time = waktu mesin beroperasi. Downtime = waktu mesin tidak beroperasi."
              />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{kpiData.kpi.scheduledTimeHours.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled Time (jam)</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{kpiData.kpi.operatingTimeHours.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Operating Time (jam)</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{kpiData.kpi.downtimeHours.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Downtime (jam)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

