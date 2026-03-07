import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assetsAPI, workOrdersAPI, downtimeAPI, maintenanceAPI, reportsAPI } from '../services/api';
import { Asset, WorkOrder, DowntimeLog, MaintenanceSchedule } from '../types';
import { formatDate, formatDateTime, formatDurationMinutes } from '../utils/dateUtils';
import RCAPanel from '../components/RCAPanel';
import MachineRCASummaryWidget from '../components/MachineRCASummaryWidget';
import MachineParameterHistory from '../components/machine/MachineParameterHistory';
import AGGridWrapper, { ColDef } from '../components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  operational: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Operational' },
  maintenance: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Maintenance' },
  breakdown: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Breakdown' },
  retired: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-800 dark:text-gray-300', label: 'Retired' },
};

const criticalityColors: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300', label: 'Low' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Medium' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'High' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Critical' },
};

const woStatusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  in_progress: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
  on_hold: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-800 dark:text-gray-300' },
};

const woTypeColors: Record<string, { bg: string; text: string }> = {
  preventive: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  corrective: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300' },
  emergency: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
};

interface KPIData {
  availability: number;
  mtbf: number;
  mttr: number;
  totalDowntimeMinutes: number;
  totalIncidents: number;
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'workorders' | 'downtime' | 'schedules' | 'ai_analysis'>('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetchAssetData();
    }
  }, [id]);

  const fetchAssetData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [assetRes, woRes, dtRes, schedRes, kpiRes] = await Promise.all([
        assetsAPI.getById(parseInt(id)),
        workOrdersAPI.getAll({ asset_id: parseInt(id), limit: 20 }),
        downtimeAPI.getAll({ asset_id: parseInt(id), limit: 20 }),
        maintenanceAPI.getSchedules({ asset_id: parseInt(id) }),
        reportsAPI.getKPIDashboard({ asset_id: parseInt(id), days: 30 }).catch(() => null),
      ]);
      
      setAsset(assetRes.data);
      setWorkOrders(woRes.data);
      setDowntimeLogs(dtRes.data);
      setSchedules(schedRes.data);
      
      if (kpiRes?.data) {
        setKpi({
          availability: kpiRes.data.kpi?.availability || 0,
          mtbf: kpiRes.data.kpi?.mtbf || 0,
          mttr: kpiRes.data.kpi?.mttr || 0,
          totalDowntimeMinutes: (kpiRes.data.kpi?.downtimeHours || 0) * 60,
          totalIncidents: kpiRes.data.kpi?.totalIncidents || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching asset data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!asset || !newStatus) return;
    
    try {
      await assetsAPI.updateStatus(asset.id, newStatus);
      setAsset({ ...asset, status: newStatus as Asset['status'] });
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Work Orders AG Grid column definitions
  const workOrderColumnDefs = useMemo<ColDef<WorkOrder>[]>(() => [
    {
      headerName: 'WO Number',
      field: 'wo_number',
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <Link to={`/work-orders/${params.data?.id}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
          {params.value}
        </Link>
      ),
    },
    {
      headerName: 'Title',
      field: 'title',
      flex: 2.5,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <span className="truncate" style={{ color: 'var(--color-text)' }} title={params.value}>
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Type',
      field: 'type',
      flex: 0.8,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const type = params.value as string;
        const colors = woTypeColors[type];
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors?.bg} ${colors?.text}`}>
            {type}
          </span>
        );
      },
    },
    {
      headerName: 'Priority',
      field: 'priority',
      flex: 0.8,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const priority = params.value as string;
        const colors = criticalityColors[priority];
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors?.bg} ${colors?.text}`}>
            {priority}
          </span>
        );
      },
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 0.9,
      minWidth: 90,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const status = params.value as string;
        const colors = woStatusColors[status];
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors?.bg} ${colors?.text}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      headerName: 'Assigned',
      field: 'assigned_to_name',
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }} title={params.value || '-'}>
          {params.value || '-'}
        </span>
      ),
    },
    {
      headerName: 'Created',
      field: 'created_at',
      flex: 0.9,
      minWidth: 90,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {formatDate(params.value)}
        </span>
      ),
    },
  ], []);

  // Downtime AG Grid column definitions
  const downtimeColumnDefs = useMemo<ColDef<DowntimeLog>[]>(() => [
    {
      headerName: 'Start Time',
      field: 'start_time',
      flex: 1.2,
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => (
        <span style={{ color: 'var(--color-text)' }}>
          {formatDateTime(params.value)}
        </span>
      ),
    },
    {
      headerName: 'End Time',
      field: 'end_time',
      flex: 1.2,
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return params.data.end_time ? (
          <span style={{ color: 'var(--color-text)' }}>
            {formatDateTime(params.data.end_time)}
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400 font-medium">Aktif</span>
        );
      },
    },
    {
      headerName: 'Duration',
      field: 'duration_minutes',
      flex: 0.8,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            {formatDurationMinutes(params.data.duration_minutes || params.data.current_duration_minutes)}
          </span>
        );
      },
    },
    {
      headerName: 'Type',
      field: 'downtime_type',
      flex: 0.7,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            params.data.downtime_type === 'planned'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {params.data.downtime_type}
          </span>
        );
      },
    },
    {
      headerName: 'Classification',
      field: 'classification_name',
      flex: 1.2,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return (
          <span className="truncate" style={{ color: 'var(--color-text-secondary)' }} title={params.data.classification_name || params.data.classification_code || '-'}>
            {params.data.classification_name || params.data.classification_code || '-'}
          </span>
        );
      },
    },
    {
      headerName: 'Counts',
      field: 'counts_as_downtime',
      flex: 0.6,
      minWidth: 70,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => {
        if (!params.data) return null;
        return params.data.counts_as_downtime ? (
          <span className="text-green-600 dark:text-green-400 text-sm">✓ Ya</span>
        ) : (
          <span className="text-gray-400 text-sm">✗ Tidak</span>
        );
      },
    },
    {
      headerName: 'Reason',
      field: 'reason',
      flex: 2,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<DowntimeLog>) => (
        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }} title={params.value || '-'}>
          {params.value || '-'}
        </span>
      ),
    },
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset tidak ditemukan</h2>
        <Link to="/assets" className="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke daftar asset
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{asset.asset_code}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]?.bg} ${statusColors[asset.status]?.text}`}>
                {statusColors[asset.status]?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${criticalityColors[asset.criticality]?.bg} ${criticalityColors[asset.criticality]?.text}`}>
                {criticalityColors[asset.criticality]?.label}
              </span>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{asset.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewStatus(asset.status);
              setShowStatusModal(true);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Ubah Status
          </button>
          <Link
            to={`/work-orders?asset_id=${asset.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Lihat Work Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Availability (30 hari)</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {kpi.availability.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">MTBF</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {kpi.mtbf.toFixed(1)} jam
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">MTTR</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {kpi.mttr.toFixed(1)} jam
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Downtime</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatDurationMinutes(kpi.totalDowntimeMinutes)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {kpi.totalIncidents} insiden
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'production', label: 'Laporan Produksi' },
            { id: 'workorders', label: `Work Orders (${workOrders.length})` },
            { id: 'downtime', label: `Downtime (${downtimeLogs.length})` },
            { id: 'schedules', label: `Jadwal PM (${schedules.length})` },
            { id: 'ai_analysis', label: '🧠 AI Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Asset</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Kategori</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.category_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Departemen</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.department_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Lokasi</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.location || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Manufacturer</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.manufacturer || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Model</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.model || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Serial Number</div>
                  <div className="font-medium text-gray-900 dark:text-white">{asset.serial_number || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tanggal Pembelian</div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatDate(asset.purchase_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Garansi Berakhir</div>
                  <div className="font-medium text-gray-900 dark:text-white">{formatDate(asset.warranty_expiry)}</div>
                </div>
              </div>
              {asset.specifications && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Spesifikasi</div>
                  <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{asset.specifications}</div>
                </div>
              )}
              {asset.notes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Catatan</div>
                  <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{asset.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Work Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Work Order Terbaru</h2>
              <Link to={`/work-orders?asset_id=${asset.id}`} className="text-sm text-blue-600 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {workOrders.slice(0, 5).map((wo) => (
                <Link
                  key={wo.id}
                  to={`/work-orders/${wo.id}`}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{wo.wo_number}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{wo.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${woTypeColors[wo.type]?.bg} ${woTypeColors[wo.type]?.text}`}>
                      {wo.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${woStatusColors[wo.status]?.bg} ${woStatusColors[wo.status]?.text}`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
              {workOrders.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Belum ada work order
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'production' && (
        <MachineParameterHistory
          assetId={asset.id}
          assetName={asset.name}
          onClose={() => {}}
        />
      )}

      {activeTab === 'workorders' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AGGridWrapper<WorkOrder>
            rowData={workOrders}
            columnDefs={workOrderColumnDefs}
            loading={false}
            height={400}
            emptyMessage="Belum ada work order untuk asset ini"
          />
        </div>
      )}

      {activeTab === 'downtime' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AGGridWrapper<DowntimeLog>
            rowData={downtimeLogs}
            columnDefs={downtimeColumnDefs}
            loading={false}
            height={400}
            emptyMessage="Belum ada log downtime untuk asset ini"
          />
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{schedule.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{schedule.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Frekuensi: {schedule.frequency_value}x {schedule.frequency_type}
                      </span>
                      {schedule.estimated_duration_minutes && (
                        <span>Durasi: {formatDurationMinutes(schedule.estimated_duration_minutes)}</span>
                      )}
                      {schedule.assigned_to_name && (
                        <span>Assigned: {schedule.assigned_to_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Next Due</div>
                    <div className={`font-medium ${schedule.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {formatDate(schedule.next_due)}
                    </div>
                    {schedule.is_overdue && (
                      <span className="text-xs text-red-600 dark:text-red-400">Overdue!</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {schedules.length === 0 && (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                Belum ada jadwal maintenance untuk asset ini
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'ai_analysis' && asset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RCA Panel - Main analysis component */}
          <div className="lg:col-span-2">
            <RCAPanel
              machineId={asset.id}
              machineName={asset.name}
              onCreateWO={(data) => {
                navigate(`/work-orders/create?asset_id=${data.asset_id}&title=${encodeURIComponent(data.title)}&type=${data.type}`);
              }}
            />
          </div>

          {/* RCA History Widget - Sidebar */}
          <div className="lg:col-span-1">
            <MachineRCASummaryWidget
              machineId={asset.id}
              machineName={asset.name}
              onAnalysisClick={(analysisId) => {
                // Could navigate to analysis detail or scroll to panel
                console.log('View analysis:', analysisId);
              }}
            />
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowStatusModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ubah Status Asset</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Baru
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="breakdown">Breakdown</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleStatusChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Simpan
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

