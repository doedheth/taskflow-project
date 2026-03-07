import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workOrdersAPI, assetsAPI, usersAPI, ticketsAPI } from '../services/api';
import { WorkOrder, Asset, User } from '../types';
import toast from 'react-hot-toast';
import AssigneeMultiSelect from '../components/AssigneeMultiSelect';
import AIWritingAssistant from '../components/AIWritingAssistant';
import { SmartWOButton } from '../components/SmartWOButton';
import { SmartWOSuggestionPanel } from '../components/SmartWOSuggestionPanel';
import { DuplicateWarningBanner } from '../components/DuplicateWarningBanner';
import { useSmartWOGeneration } from '../hooks/useSmartWOGeneration';
import { useDuplicateCheck } from '../hooks/useDuplicateCheck';
import { useTheme } from '../context/ThemeContext';
import AGGridWrapper, { ColDef } from '../components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'In Progress' },
  on_hold: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'On Hold' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', label: 'Cancelled' },
};

const typeColors: Record<string, { bg: string; text: string }> = {
  preventive: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  corrective: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  emergency: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cancel Confirm Modal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelWOId, setCancelWOId] = useState<number | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assetFilter, setAssetFilter] = useState('');

  // Quick Maintenance Ticket form
  const [quickForm, setQuickForm] = useState({
    title: '',
    description: '',
    asset_id: '',
    wo_type: 'corrective' as 'preventive' | 'corrective' | 'emergency',
    priority: 'medium',
    assignee_ids: [] as number[],
  });

  // AI Smart WO Generation
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const smartWO = useSmartWOGeneration({
    onError: (error) => toast.error(error),
  });

  // Duplicate Detection (Story 7.5)
  const duplicateCheck = useDuplicateCheck('wo');

  // Check for duplicates when title changes
  useEffect(() => {
    if (quickForm.title.length > 20) {
      duplicateCheck.checkDuplicate(
        quickForm.title,
        quickForm.asset_id ? parseInt(quickForm.asset_id) : undefined
      );
    }
  }, [quickForm.title, quickForm.asset_id]);

  const handleAIGenerate = () => {
    if (!quickForm.title.trim()) {
      toast.error('Masukkan deskripsi masalah terlebih dahulu');
      return;
    }
    smartWO.generate(
      quickForm.title,
      quickForm.asset_id ? parseInt(quickForm.asset_id) : undefined,
      quickForm.wo_type
    );
    setShowAISuggestion(true);
  };

  const handleAcceptAISuggestion = () => {
    if (!smartWO.suggestion?.generated) return;

    const gen = smartWO.suggestion.generated;
    setQuickForm(prev => ({
      ...prev,
      title: gen.title,
      description: gen.description,
      priority: gen.priority,
      wo_type: gen.wo_type,
    }));

    setShowAISuggestion(false);
    toast.success('Suggestion applied');
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, assetFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, assetsRes, usersRes] = await Promise.all([
        workOrdersAPI.getAll({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          asset_id: assetFilter ? parseInt(assetFilter) : undefined,
        }),
        assetsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setWorkOrders(woRes.data);
      setAssets(assetsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.asset_id || !quickForm.title.trim()) {
      toast.error('Asset dan Judul harus diisi');
      return;
    }
    
    if (quickForm.assignee_ids.length === 0) {
      toast.error('Minimal satu teknisi harus dipilih untuk ditugaskan');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await ticketsAPI.quickMaintenance({
        title: quickForm.title,
        description: quickForm.description || undefined,
        asset_id: parseInt(quickForm.asset_id),
        wo_type: quickForm.wo_type,
        priority: quickForm.priority,
        assignee_ids: quickForm.assignee_ids,
      });
      
      toast.success(response.data.message);
      setShowQuickModal(false);
      resetForm();
      fetchData();
      
      // Navigate to the new work order
      navigate(`/work-orders/${response.data.workOrder.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal membuat maintenance ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (id: number) => {
    try {
      const result = await workOrdersAPI.start(id);
      toast.success('Work order dimulai');
      if (result.data.downtime_created) {
        toast.success(`Downtime log dibuat otomatis`, { icon: '⏱️' });
      }
      if (result.data.ticketUpdated) {
        toast.success('Ticket status → In Progress', { icon: '📋' });
      }
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal memulai work order');
    }
  };

  const openCancelConfirm = (id: number) => {
    setCancelWOId(id);
    setShowCancelConfirm(true);
  };

  const handleCancel = async () => {
    if (!cancelWOId) return;
    
    setIsSubmitting(true);
    try {
      await workOrdersAPI.cancel(cancelWOId);
      toast.success('Work order dibatalkan');
      setShowCancelConfirm(false);
      setCancelWOId(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal membatalkan work order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (userId: number) => {
    setQuickForm(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const resetForm = () => {
    setQuickForm({
      title: '',
      description: '',
      asset_id: '',
      wo_type: 'corrective',
      priority: 'medium',
      assignee_ids: [],
    });
    setShowAISuggestion(false);
    smartWO.clear();
    duplicateCheck.reset();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStats = () => {
    return {
      open: workOrders.filter(wo => wo.status === 'open').length,
      in_progress: workOrders.filter(wo => wo.status === 'in_progress').length,
      on_hold: workOrders.filter(wo => wo.status === 'on_hold').length,
      completed: workOrders.filter(wo => wo.status === 'completed').length,
    };
  };

  const stats = getStatusStats();

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<WorkOrder>[]>(() => [
    {
      field: 'wo_number',
      headerName: 'WO Number',
      flex: 1,
      minWidth: 100,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <Link
          to={`/work-orders/${params.data?.id}`}
          className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
        >
          {params.value}
        </Link>
      ),
    },
    {
      headerName: 'Asset',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => params.data?.asset_code,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => (
        <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }} title={params.data?.asset_name}>
          {params.data?.asset_code}
        </span>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 3,
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        if (!params.data) return null;
        return (
          <span
            className="truncate block"
            style={{ color: 'var(--color-text)' }}
            title={params.data.title}
          >
            {params.data.title}
          </span>
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const type = params.value as string;
        const colors = typeColors[type];
        return (
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${colors?.bg} ${colors?.text}`}>
            {type}
          </span>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.8,
      minWidth: 70,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const priority = params.value as string;
        const colors = priorityColors[priority];
        return (
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${colors?.bg} ${colors?.text}`}>
            {priority}
          </span>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const status = params.value as string;
        const colors = statusColors[status];
        return (
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors?.bg} ${colors?.text}`}>
            {colors?.label}
          </span>
        );
      },
    },
    {
      field: 'assignees',
      headerName: 'Assignees',
      flex: 0.8,
      minWidth: 80,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const assignees = params.data?.assignees;
        if (!assignees || assignees.length === 0) {
          return <span className="text-gray-400 text-sm">-</span>;
        }
        return (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.id}
                className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        );
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      flex: 1,
      minWidth: 90,
      valueFormatter: (params) => formatDate(params.value),
      cellClass: 'text-sm text-gray-600 dark:text-gray-300',
    },
    {
      headerName: 'Aksi',
      flex: 0.6,
      minWidth: 70,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<WorkOrder>) => {
        const wo = params.data;
        if (!wo) return null;
        return (
          <div className="flex items-center gap-1">
            {wo.status === 'open' && (
              <button
                onClick={() => handleStart(wo.id)}
                className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                title="Mulai - Buat downtime log"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {wo.status === 'in_progress' && (
              <Link
                to="/downtime-tracker"
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                title="Selesaikan via Downtime Tracker"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            )}
            {wo.status !== 'completed' && wo.status !== 'cancelled' && (
              <button
                onClick={() => openCancelConfirm(wo.id)}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                title="Batalkan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola work order maintenance</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowQuickModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Maintenance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.open}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.in_progress}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">On Hold</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.on_hold}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Tipe</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="emergency">Emergency</option>
          </select>
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Work Orders List - AG Grid */}
      <AGGridWrapper<WorkOrder>
        rowData={workOrders}
        columnDefs={columnDefs}
        loading={loading}
        height={500}
        emptyMessage="Tidak ada work order ditemukan"
      />

      {/* Quick Maintenance Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowQuickModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Maintenance</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Buat Ticket + Work Order sekaligus</p>
                  </div>
                </div>
                <button onClick={() => setShowQuickModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleQuickMaintenance} className="p-6 space-y-4">
                {/* Asset */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={quickForm.asset_id}
                    onChange={(e) => setQuickForm({ ...quickForm, asset_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Pilih Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Masalah / Judul <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickForm.title}
                    onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Contoh: Motor tidak berputar, bearing bunyi"
                    required
                  />

                  {/* AI Generate Button */}
                  <div className="mt-2">
                    <SmartWOButton
                      onClick={handleAIGenerate}
                      isLoading={smartWO.isLoading}
                      disabled={!quickForm.title.trim()}
                    />
                  </div>

                  {/* AI Suggestion Panel */}
                  {showAISuggestion && smartWO.suggestion && (
                    <SmartWOSuggestionPanel
                      generated={smartWO.suggestion.generated}
                      technicianSuggestion={smartWO.suggestion.technicianSuggestion}
                      similarWOs={smartWO.suggestion.similarWOs}
                      onAccept={handleAcceptAISuggestion}
                      onRegenerate={handleAIGenerate}
                      onClose={() => setShowAISuggestion(false)}
                      isRegenerating={smartWO.isLoading}
                    />
                  )}
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe Maintenance</label>
                    <select
                      value={quickForm.wo_type}
                      onChange={(e) => setQuickForm({ ...quickForm, wo_type: e.target.value as 'preventive' | 'corrective' | 'emergency' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="corrective">🔧 Corrective</option>
                      <option value="preventive">📅 Preventive</option>
                      <option value="emergency">🚨 Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select
                      value={quickForm.priority}
                      onChange={(e) => setQuickForm({ ...quickForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Description with AI Assistant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={quickForm.description}
                    onChange={(value) => setQuickForm({ ...quickForm, description: value })}
                    context={{
                      type: 'work_order',
                      title: quickForm.title,
                      asset: assets.find(a => a.id === parseInt(quickForm.asset_id))?.name,
                      priority: quickForm.priority
                    }}
                    assetId={quickForm.asset_id ? parseInt(quickForm.asset_id) : undefined}
                    placeholder="Detail masalah atau gejala yang diamati..."
                    minHeight="100px"
                  />

                  {/* Duplicate Warning Banner (Story 7.5) */}
                  {duplicateCheck.hasDuplicates && (
                    <div className="mt-3">
                      <DuplicateWarningBanner
                        similar={duplicateCheck.similarEntries}
                        suggestion={duplicateCheck.suggestion}
                        entityType="wo"
                        onDismiss={duplicateCheck.dismiss}
                      />
                    </div>
                  )}
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign ke Teknisi <span className="text-red-500">*</span>
                    {quickForm.assignee_ids.length === 0 && (
                      <span className="ml-2 text-xs text-red-500">(minimal 1 teknisi)</span>
                    )}
                  </label>
                  <AssigneeMultiSelect
                    users={users}
                    selectedIds={quickForm.assignee_ids}
                    onChange={(ids) => setQuickForm({ ...quickForm, assignee_ids: ids })}
                    isDark={isDark}
                    placeholder="Pilih teknisi..."
                    required={true}
                    filterRole={true}
                  />
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Akan dibuat:</p>
                    <ul className="mt-1 space-y-0.5 text-xs opacity-80">
                      <li>• 1 Ticket untuk tracking & history</li>
                      <li>• 1 Work Order untuk eksekusi maintenance</li>
                      <li>• Keduanya saling ter-link otomatis</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowQuickModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !quickForm.asset_id || !quickForm.title.trim()}
                    className={`px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2
                      ${(isSubmitting || !quickForm.asset_id || !quickForm.title.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Membuat...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Buat Ticket + WO
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCancelConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Batalkan Work Order?</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Tindakan ini akan membatalkan work order dan menutup downtime log yang terkait.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Tidak
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Membatalkan...
                      </>
                    ) : (
                      'Ya, Batalkan'
                    )}
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
