import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { downtimeAPI, assetsAPI } from '../services/api';
import { DowntimeLog, DowntimeClassification, FailureCode } from '../types';
import { formatDateTime, formatLiveDuration, parseUTCDate } from '../utils/dateUtils';
import AIWritingAssistant from '../components/AIWritingAssistant';
import AGGridWrapper, { ColDef } from '@/components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';

type DowntimeCategory = 'maintenance' | 'production';
type FilterTab = 'all' | 'maintenance' | 'production';

// Map classification categories to our broader categories
const categoryMapping: Record<string, DowntimeCategory> = {
  breakdown: 'maintenance',
  planned_maintenance: 'maintenance',
  changeover: 'production',
  idle: 'production',
  production: 'production',
};

export default function DowntimeTracker() {
  const navigate = useNavigate();
  const [activeDowntimes, setActiveDowntimes] = useState<DowntimeLog[]>([]);
  const [recentDowntimes, setRecentDowntimes] = useState<DowntimeLog[]>([]);
  const [allClassifications, setAllClassifications] = useState<DowntimeClassification[]>([]);
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedDowntime, setSelectedDowntime] = useState<DowntimeLog | null>(null);
  const [tick, setTick] = useState(0);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [componentPath, setComponentPath] = useState<string[]>([]);
  const [componentRaw, setComponentRaw] = useState<string>('');

  const [endForm, setEndForm] = useState({
    reason: '',
    failure_code_id: '',
    units_lost: '',
    batch_affected: '',
  });

  // Timer update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const refreshInterval = setInterval(fetchData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activeRes, recentRes, classRes, fcRes] = await Promise.all([
        downtimeAPI.getActive(),
        downtimeAPI.getAll({ limit: 50 }),
        downtimeAPI.getClassifications(),
        assetsAPI.getFailureCodes(),
      ]);
      
      setActiveDowntimes(activeRes.data);
      setRecentDowntimes(recentRes.data.filter((dt: DowntimeLog) => dt.end_time));
      setAllClassifications(classRes.data);
      setFailureCodes(fcRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // handleCategoryChange removed - maintenance only, production has dedicated page
  const resolveMappedCategory = (classificationId?: number, classificationCategory?: string): DowntimeCategory => {
    const raw = classificationCategory || allClassifications.find(c => c.id === classificationId)?.category || 'breakdown';
    return categoryMapping[raw] || 'maintenance';
  };

  // Filter recent downtimes based on tab
  const filteredRecentDowntimes = recentDowntimes.filter(dt => {
    if (filterTab === 'all') return true;
    const mappedCategory = resolveMappedCategory(dt.classification_id, dt.classification_category as any);
    return mappedCategory === filterTab;
  });

  // Filter active downtimes based on tab
  const filteredActiveDowntimes = activeDowntimes.filter(dt => {
    if (filterTab === 'all') return true;
    const mappedCategory = resolveMappedCategory(dt.classification_id, dt.classification_category as any);
    return mappedCategory === filterTab;
  });

  // Count by category for stats
  const maintenanceCount = activeDowntimes.filter(dt => {
    const category = resolveMappedCategory(dt.classification_id, dt.classification_category as any);
    return category === 'maintenance';
  }).length;

  const productionCount = activeDowntimes.filter(dt => {
    const category = resolveMappedCategory(dt.classification_id, dt.classification_category as any);
    return category === 'production';
  }).length;

  const handleEndDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDowntime) return;
    
    try {
      // Only send failure_code_id if not already set on the downtime (from WO)
      const response = await downtimeAPI.end(selectedDowntime.id, {
        reason: endForm.reason || undefined,
        failure_code_id: !selectedDowntime.failure_code_id && endForm.failure_code_id 
          ? parseInt(endForm.failure_code_id) 
          : undefined,
        production_impact: (endForm.units_lost || endForm.batch_affected) ? {
          units_lost: endForm.units_lost ? parseInt(endForm.units_lost) : undefined,
          batch_affected: endForm.batch_affected || undefined,
        } : undefined,
      });
      
      // Show success message
      toast.success('Downtime berhasil diakhiri');
      
      // Show additional notifications if WO/Ticket were auto-completed
      if (response.data.workOrderCompleted) {
        toast.success('Work Order terkait otomatis selesai', { icon: '✅' });
      }
      if (response.data.ticketUpdated) {
        toast.success('Ticket status → Done', { icon: '🎉' });
      }
      
      setShowEndModal(false);
      setSelectedDowntime(null);
      setEndForm({ reason: '', failure_code_id: '', units_lost: '', batch_affected: '' });
      fetchData();
    } catch (error) {
      console.error('Error ending downtime:', error);
      toast.error('Gagal mengakhiri downtime');
    }
  };

  const openEndModal = (downtime: DowntimeLog) => {
    navigate(`/downtime/end/${downtime.id}`);
  };

  const openComponentModal = (path?: string | null) => {
    if (!path) return;
    const segs = path.split('>').map(s => s.trim()).filter(Boolean);
    setComponentPath(segs);
    setComponentRaw(path);
    setShowComponentModal(true);
  };

  // Get category badge color
  const getCategoryBadge = (classificationId?: number, classificationCategory?: string) => {
    const category = resolveMappedCategory(classificationId, classificationCategory);

    if (category === 'production') {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
          Production
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
        Maintenance
      </span>
    );
  };

  // AG Grid column definitions with flex proportions
  const recentColumnDefs = useMemo<ColDef<DowntimeLog>[]>(() => [
    {
      headerName: 'Asset',
      field: 'asset_code',
      flex: 0.6,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <Link to={`/assets/${params.data.asset_id}`} className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline" title={params.data.asset_name}>
            {params.data.asset_code}
          </Link>
        );
      },
    },
    {
      headerName: 'Category',
      field: 'classification_id',
      flex: 0.5,
      minWidth: 70,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return getCategoryBadge(params.data.classification_id, params.data.classification_category as any);
      },
    },
    {
      headerName: 'Type',
      field: 'downtime_type',
      flex: 0.5,
      minWidth: 70,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            params.data.downtime_type === 'unplanned'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            {params.data.downtime_type === 'unplanned' ? 'Breakdown' : 'Planned'}
          </span>
        );
      },
    },
    {
      headerName: 'Mulai',
      field: 'start_time',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className="font-mono text-[10px]">
            {(() => {
              const d = parseUTCDate(params.data.start_time || '');
              return d ? format(d, 'dd/MM HH:mm') : '-';
            })()}
          </span>
        );
      },
    },
    {
      headerName: 'Selesai',
      field: 'end_time',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className="font-mono text-[10px]">
            {(() => {
              const d = parseUTCDate(params.data.end_time || '');
              return d ? format(d, 'dd/MM HH:mm') : 'Aktif';
            })()}
          </span>
        );
      },
    },
    {
      headerName: 'Durasi',
      field: 'duration_minutes',
      flex: 0.5,
      minWidth: 60,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className="font-bold text-center block w-full text-[10px]">
            {params.data.duration_minutes || 0} m
          </span>
        );
      },
    },
    {
      headerName: 'Komponen',
      field: 'failure_category',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <button
            type="button"
            onClick={() => openComponentModal(params.data?.failure_category)}
            className="text-left text-[10px] truncate block text-blue-600 dark:text-blue-400 hover:underline"
            title={params.data.failure_category || '-'}
          >
            {params.data.failure_category || '-'}
          </button>
        );
      },
    },
    {
      headerName: 'Nama Masalah',
      field: 'failure_code_description',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        const anyData = params.data as any;
        const code: string | undefined = anyData?.failure_code || anyData?.failure_code_code;
        const desc = params.data.failure_code_description || params.data.failure_description || '-';
        const title = code ? `${code} • ${desc}` : desc;
        return (
          <span className="text-[10px] truncate block" title={title}>
            {code ? `${code} • ` : ''}{desc}
          </span>
        );
      },
    },
    {
      headerName: 'Deskripsi / Alasan',
      field: 'reason',
      flex: 1.5,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        const rawReason = params.data.reason || '-';
        const cleanReason = rawReason.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '-';
        return (
          <span className="truncate text-[10px] block" title={cleanReason}>
            {cleanReason}
          </span>
        );
      },
    },
  ], [allClassifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        .downtime-grid .ag-header-cell-label {
          font-size: 10px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
        }
        .downtime-grid .ag-cell {
          font-size: 10px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Downtime Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor dan catat downtime maintenance secara real-time</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Semua ({activeDowntimes.length})
          </button>
          <button
            onClick={() => setFilterTab('maintenance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filterTab === 'maintenance'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Maintenance ({maintenanceCount})
          </button>
          <button
            onClick={() => setFilterTab('production')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filterTab === 'production'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Production ({productionCount})
          </button>
        </div>
      </div>

      {/* Active Downtimes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Downtime Aktif ({filteredActiveDowntimes.length})
            </h2>
          </div>
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {filteredActiveDowntimes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredActiveDowntimes.map((dt) => (
              <div
                key={dt.id}
                className={`border-2 rounded-lg p-4 ${
                  dt.downtime_type === 'unplanned' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link 
                      to={`/assets/${dt.asset_id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-blue-600"
                    >
                      {dt.asset_code}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dt.asset_name}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                      ${dt.downtime_type === 'unplanned' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {dt.downtime_type}
                    </span>
                    {getCategoryBadge(dt.classification_id, dt.classification_category as any)}
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className={`text-4xl font-mono font-bold ${
                    dt.downtime_type === 'unplanned' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {formatLiveDuration(dt.start_time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Mulai: {formatDateTime(dt.start_time)}
                  </div>
                </div>

                {dt.classification_name && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Klasifikasi:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dt.classification_name}</span>
                    {dt.counts_as_downtime ? (
                      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                    ) : (
                      <span className="text-xs text-gray-400">✗</span>
                    )}
                  </div>
                )}

                {dt.reason && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {dt.reason}
                  </p>
                )}

                <button
                  onClick={() => openEndModal(dt)}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Akhiri Downtime
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Semua Mesin Berjalan Normal</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {filterTab === 'all' 
                ? 'Tidak ada downtime aktif saat ini'
                : `Tidak ada ${filterTab === 'maintenance' ? 'maintenance' : 'production'} downtime aktif`
              }
            </p>
          </div>
        )}
      </div>

      {/* Recent Downtimes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Downtime Terbaru</h2>
        </div>
        <AGGridWrapper<DowntimeLog>
          rowData={filteredRecentDowntimes}
          columnDefs={recentColumnDefs}
          loading={false}
          height={500}
          emptyMessage="Belum ada riwayat downtime"
          rowHeight={28}
          headerHeight={32}
          className="downtime-grid"
        />
      </div>

      {/* Component Flow Modal */}
      {showComponentModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowComponentModal(false)} />
          <div className="relative max-w-2xl mx-auto mt-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alur Komponen</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{componentRaw}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {componentPath.map((seg, idx) => (
                  <div key={`${seg}-${idx}`} className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Level {idx + 1}</div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white truncate" title={seg}>{seg}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowComponentModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Downtime Modal hidden per new menu structure */}

      {/* End Downtime Modal */}
      {showEndModal && selectedDowntime && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowEndModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Akhiri Downtime</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDowntime.asset_code} - {selectedDowntime.asset_name}
                </p>
              </div>
              <form onSubmit={handleEndDowntime} className="p-6 space-y-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                    {formatLiveDuration(selectedDowntime.start_time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total durasi downtime</div>
                </div>

                {/* Only show Failure Code field if not already set (e.g., from WO) */}
                {selectedDowntime.failure_code_id ? (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Failure Code (dari Work Order)
                    </label>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {failureCodes.find(fc => fc.id === selectedDowntime.failure_code_id)?.code || 'N/A'} - {failureCodes.find(fc => fc.id === selectedDowntime.failure_code_id)?.description || ''}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Failure Code
                      <span className="ml-2 text-xs text-gray-500 font-normal">(opsional)</span>
                    </label>
                    <select
                      value={endForm.failure_code_id}
                      onChange={(e) => setEndForm({ ...endForm, failure_code_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Pilih Failure Code (opsional)</option>
                      {failureCodes.map((fc) => (
                        <option key={fc.id} value={fc.id}>
                          {fc.code} - {fc.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alasan/Keterangan
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={endForm.reason}
                    onChange={(value) => setEndForm({ ...endForm, reason: value })}
                    context={{
                      type: 'downtime',
                      asset: selectedDowntime?.asset_name
                    }}
                    assetId={selectedDowntime?.asset_id}
                    placeholder="Jelaskan penyebab dan solusi..."
                    minHeight="100px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Units Lost
                    </label>
                    <input
                      type="number"
                      value={endForm.units_lost}
                      onChange={(e) => setEndForm({ ...endForm, units_lost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Jumlah unit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch Affected
                    </label>
                    <input
                      type="text"
                      value={endForm.batch_affected}
                      onChange={(e) => setEndForm({ ...endForm, batch_affected: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="No. Batch"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEndModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Akhiri Downtime
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
