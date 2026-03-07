import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { downtimeAPI, assetsAPI, quickActionsAPI } from '../services/api';
import { DowntimeLog, Asset, DowntimeClassification, ProductionQuickAction } from '../types';
import { formatDateTime, formatDurationMinutes, formatLiveDuration } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { Settings, Plus, Pencil, Trash2, GripVertical, X, Play } from 'lucide-react';
import AIWritingAssistant from '../components/AIWritingAssistant';

// Preset colors for quick actions
const PRESET_COLORS = [
  { name: 'Blue', value: 'bg-blue-500 hover:bg-blue-600' },
  { name: 'Purple', value: 'bg-purple-500 hover:bg-purple-600' },
  { name: 'Orange', value: 'bg-orange-500 hover:bg-orange-600' },
  { name: 'Yellow', value: 'bg-yellow-500 hover:bg-yellow-600' },
  { name: 'Pink', value: 'bg-pink-500 hover:bg-pink-600' },
  { name: 'Red', value: 'bg-red-500 hover:bg-red-600' },
  { name: 'Green', value: 'bg-green-500 hover:bg-green-600' },
  { name: 'Teal', value: 'bg-teal-500 hover:bg-teal-600' },
  { name: 'Indigo', value: 'bg-indigo-500 hover:bg-indigo-600' },
  { name: 'Cyan', value: 'bg-cyan-500 hover:bg-cyan-600' },
];

// Common emoji icons for quick actions
const PRESET_ICONS = ['🔄', '🔧', '⚙️', '📦', '🎨', '⚠️', '⏱️', '🛠️', '📋', '🔍', '✅', '❌', '🚫', '⏸️', '▶️'];

export default function ProductionDowntime() {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';
  
  const [activeDowntimes, setActiveDowntimes] = useState<DowntimeLog[]>([]);
  const [todayDowntimes, setTodayDowntimes] = useState<DowntimeLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [classifications, setClassifications] = useState<DowntimeClassification[]>([]);
  const [quickActions, setQuickActions] = useState<ProductionQuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showActionFormModal, setShowActionFormModal] = useState(false);
  const [selectedDowntime, setSelectedDowntime] = useState<DowntimeLog | null>(null);
  const [quickActionCode, setQuickActionCode] = useState<string>('');
  const [editingAction, setEditingAction] = useState<ProductionQuickAction | null>(null);
  // const [tick, setTick] = useState(0); // Unused

  const [startForm, setStartForm] = useState({
    asset_id: '',
    classification_id: '',
    reason: '',
  });

  const [endForm, setEndForm] = useState({
    reason: '',
    units_lost: '',
    batch_affected: '',
  });

  const [actionForm, setActionForm] = useState({
    label: '',
    icon: '⚡',
    color: 'bg-blue-500 hover:bg-blue-600',
    classification_code: '',
  });

  // Timer update every second - removed unused tick state
  useEffect(() => {
    const interval = setInterval(() => {
      // setTick((t) => t + 1);
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
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [activeRes, todayRes, assetsRes, classRes, actionsRes] = await Promise.all([
        downtimeAPI.getActive(),
        downtimeAPI.getAll({ 
          start_date: today.toISOString(),
          end_date: tomorrow.toISOString(),
          limit: 50 
        }),
        assetsAPI.getAll({ status: 'operational' }),
        downtimeAPI.getClassifications('production,changeover,idle'),
        quickActionsAPI.getAll(),
      ]);
      
      // Filter active downtimes to only production category
      const productionActive = activeRes.data.filter((dt: DowntimeLog) => {
        const classification = classRes.data.find((c: DowntimeClassification) => c.id === dt.classification_id);
        return classification && ['production', 'changeover', 'idle'].includes(classification.category);
      });

      // Filter today's downtimes to only production category (completed ones)
      const productionToday = todayRes.data.filter((dt: DowntimeLog) => {
        if (!dt.end_time) return false; // Only completed
        const classification = classRes.data.find((c: DowntimeClassification) => c.id === dt.classification_id);
        return classification && ['production', 'changeover', 'idle'].includes(classification.category);
      });

      setActiveDowntimes(productionActive);
      setTodayDowntimes(productionToday);
      setAssets(assetsRes.data);
      setClassifications(classRes.data);
      setQuickActions(actionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: ProductionQuickAction) => {
    const classification = classifications.find(c => c.code === action.classification_code);
    
    if (!classification) {
      toast.error(`Klasifikasi "${action.classification_code}" tidak ditemukan. Silakan refresh halaman.`);
      return;
    }
    
    setQuickActionCode(action.classification_code);
    setStartForm({
      asset_id: '',
      classification_id: classification.id.toString(),
      reason: '',
    });
    setShowStartModal(true);
  };

  // openStartModal removed - now only accessible via Quick Actions

  const handleStartDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await downtimeAPI.create({
        asset_id: parseInt(startForm.asset_id),
        downtime_type: 'planned', // Production downtime is always planned
        classification_id: parseInt(startForm.classification_id),
        start_time: new Date().toISOString(),
        reason: startForm.reason || undefined,
      });
      
      setShowStartModal(false);
      setStartForm({ asset_id: '', classification_id: '', reason: '' });
      setQuickActionCode('');
      fetchData();
    } catch (error) {
      console.error('Error starting downtime:', error);
    }
  };

  const handleEndDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDowntime) return;
    
    try {
      const response = await downtimeAPI.end(selectedDowntime.id, {
        reason: endForm.reason || undefined,
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
      setEndForm({ reason: '', units_lost: '', batch_affected: '' });
      fetchData();
    } catch (error) {
      console.error('Error ending downtime:', error);
      toast.error('Gagal mengakhiri downtime');
    }
  };

  const openEndModal = (downtime: DowntimeLog) => {
    setSelectedDowntime(downtime);
    setEndForm({
      reason: downtime.reason || '',
      units_lost: '',
      batch_affected: '',
    });
    setShowEndModal(true);
  };

  // Quick Actions Management
  const openAddActionModal = () => {
    setEditingAction(null);
    setActionForm({
      label: '',
      icon: '⚡',
      color: 'bg-blue-500 hover:bg-blue-600',
      classification_code: '',
    });
    setShowActionFormModal(true);
  };

  const openEditActionModal = (action: ProductionQuickAction) => {
    setEditingAction(action);
    setActionForm({
      label: action.label,
      icon: action.icon,
      color: action.color,
      classification_code: action.classification_code,
    });
    setShowActionFormModal(true);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAction) {
        await quickActionsAPI.update(editingAction.id, actionForm);
      } else {
        await quickActionsAPI.create(actionForm);
      }
      setShowActionFormModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving quick action:', error);
    }
  };

  const handleDeleteAction = async (id: number) => {
    if (!confirm('Hapus quick action ini?')) return;
    try {
      await quickActionsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting quick action:', error);
    }
  };

  const handleToggleActive = async (action: ProductionQuickAction) => {
    try {
      await quickActionsAPI.update(action.id, { is_active: !action.is_active });
      fetchData();
    } catch (error) {
      console.error('Error toggling quick action:', error);
    }
  };

  // Calculate today's summary
  const todaySummary = {
    totalStops: todayDowntimes.length + activeDowntimes.length,
    totalMinutes: todayDowntimes.reduce((sum, dt) => sum + (dt.duration_minutes || 0), 0),
    activeCount: activeDowntimes.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Downtime Produksi</h1>
          <p className="text-gray-600 dark:text-gray-400">Log downtime produksi menggunakan Quick Actions di bawah</p>
        </div>
        <div className="flex gap-2">
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowManageModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Settings className="w-5 h-5" />
              Kelola Quick Actions
            </button>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Stop Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{todaySummary.totalStops}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Waktu Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDurationMinutes(todaySummary.totalMinutes)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${todaySummary.activeCount > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {todaySummary.activeCount > 0 ? (
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sedang Berjalan</p>
              <p className={`text-2xl font-bold ${todaySummary.activeCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {todaySummary.activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions</h2>
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowManageModal(true)}
              className="text-xs text-purple-600 hover:underline"
            >
              Kelola Quick Actions
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.filter(a => a.is_active).map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={`inline-flex items-center gap-2 px-4 py-2 ${action.color} text-white rounded-lg transition-colors`}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
          {quickActions.filter(a => a.is_active).length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Belum ada quick action. {isManagerOrAdmin && 'Klik "Kelola Quick Actions" untuk menambah.'}
            </p>
          )}
        </div>
      </div>

      {/* Active Downtimes */}
      {activeDowntimes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sedang Berjalan ({activeDowntimes.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {activeDowntimes.map((dt) => (
              <div
                key={dt.id}
                className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link 
                      to={`/assets/${dt.asset_id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-purple-600"
                    >
                      {dt.asset_code}
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dt.asset_name}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    {dt.classification_name}
                  </span>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="text-4xl font-mono font-bold text-purple-600 dark:text-purple-400">
                    {formatLiveDuration(dt.start_time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Mulai: {formatDateTime(dt.start_time)}
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Dibuat oleh: {dt.logged_by_name || '-'}
                </div>
                {dt.reason && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {dt.reason}
                  </p>
                )}

                <button
                  onClick={() => openEndModal(dt)}
                  className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  ✓ Selesai
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Hari Ini</h2>
          <button
            onClick={fetchData}
            className="text-sm text-purple-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sub Komponen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dibuat Oleh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durasi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {todayDowntimes.map((dt) => (
                <tr key={dt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <Link to={`/assets/${dt.asset_id}`} className="font-medium text-purple-600 hover:underline">
                      {dt.asset_code}
                    </Link>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{dt.asset_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {dt.failure_category ? (
                      <span className="truncate" title={dt.failure_category}>
                        {dt.failure_category}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {dt.logged_by_name ? (
                      <span className="truncate" title={dt.logged_by_name}>
                        {dt.logged_by_name}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {dt.classification_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {formatDateTime(dt.start_time)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {formatDurationMinutes(dt.duration_minutes)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {dt.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {todayDowntimes.length === 0 && activeDowntimes.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Belum ada downtime produksi hari ini
            </div>
          )}
        </div>
      </div>

      {/* Start Downtime Modal - Simplified (classification from quick action) */}
      {showStartModal && quickActionCode && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowStartModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {quickActions.find(a => a.classification_code === quickActionCode)?.icon || '⏱️'}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {quickActions.find(a => a.classification_code === quickActionCode)?.label || 'Log Downtime'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Klasifikasi otomatis: {classifications.find(c => c.code === quickActionCode)?.name || quickActionCode}
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleStartDowntime} className="p-6 space-y-4">
                {/* Asset Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pilih Mesin/Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={startForm.asset_id}
                    onChange={(e) => setStartForm({ ...startForm, asset_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    autoFocus
                  >
                    <option value="">Pilih Mesin</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_code} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason/Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Keterangan <span className="text-xs text-gray-400">(opsional)</span>
                  </label>
                  <AIWritingAssistant
                    value={startForm.reason}
                    onChange={(value) => setStartForm({ ...startForm, reason: value })}
                    context={{
                      type: 'downtime',
                      asset: assets.find(a => a.id === parseInt(startForm.asset_id))?.name,
                      category: 'production',
                      // action: quickActions.find(a => a.classification_code === quickActionCode)?.label
                    }}
                    placeholder="Contoh: Ganti mold ke produk ABC..."
                    minHeight="80px"
                  />
                </div>

                {/* Info Badge */}
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
                  <span className="text-purple-600 dark:text-purple-400">ℹ️</span>
                  <span className="text-purple-700 dark:text-purple-300">
                    Timer akan mulai setelah klik "Mulai Downtime"
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartModal(false);
                      setQuickActionCode('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!startForm.asset_id}
                    className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 ${!startForm.asset_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Play className="w-4 h-4" />
                    Mulai Downtime
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* End Downtime Modal */}
      {showEndModal && selectedDowntime && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowEndModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selesai Downtime</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDowntime.asset_code} - {selectedDowntime.classification_name}
                </p>
              </div>
              <form onSubmit={handleEndDowntime} className="p-6 space-y-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400">
                    {formatLiveDuration(selectedDowntime.start_time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total durasi</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Keterangan
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={endForm.reason}
                    onChange={(value) => setEndForm({ ...endForm, reason: value })}
                    context={{
                      type: 'downtime',
                      asset: selectedDowntime?.asset_name,
                      category: 'production'
                    }}
                    placeholder="Catatan tambahan (opsional)..."
                    minHeight="80px"
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
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch
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
                    ✓ Selesai
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Quick Actions Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowManageModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kelola Quick Actions</h2>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tombol shortcut untuk log downtime dengan cepat
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/downtime-classifications"
                      onClick={() => setShowManageModal(false)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Kelola Klasifikasi
                    </Link>
                    <button
                      onClick={openAddActionModal}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <div
                      key={action.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        action.is_active 
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60'
                      }`}
                    >
                      <div className="cursor-grab text-gray-400">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className={`px-3 py-1.5 ${action.color} text-white rounded-lg flex items-center gap-2`}>
                        <span>{action.icon}</span>
                        <span className="font-medium text-sm">{action.label}</span>
                      </div>
                      <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                        {action.classification_name || action.classification_code}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(action)}
                          className={`px-2 py-1 text-xs rounded ${
                            action.is_active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {action.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                        <button
                          onClick={() => openEditActionModal(action)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAction(action.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {quickActions.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Belum ada quick action
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Quick Action Modal */}
      {showActionFormModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowActionFormModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAction ? 'Edit Quick Action' : 'Tambah Quick Action'}
                </h2>
              </div>
              <form onSubmit={handleSaveAction} className="p-6 space-y-4">
                {/* Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 px-4 py-2 ${actionForm.color} text-white rounded-lg`}
                  >
                    <span className="text-lg">{actionForm.icon}</span>
                    <span className="font-medium">{actionForm.label || 'Label'}</span>
                  </button>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={actionForm.label}
                    onChange={(e) => setActionForm({ ...actionForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ganti Produk"
                    required
                  />
                </div>

                {/* Classification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Klasifikasi Downtime <span className="text-red-500">*</span>
                    </label>
                    <Link 
                      to="/downtime-classifications" 
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                      onClick={() => setShowActionFormModal(false)}
                    >
                      Kelola Klasifikasi →
                    </Link>
                  </div>
                  <select
                    value={actionForm.classification_code}
                    onChange={(e) => setActionForm({ ...actionForm, classification_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Pilih Klasifikasi</option>
                    {classifications.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                    {PRESET_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setActionForm({ ...actionForm, icon })}
                        className={`w-8 h-8 flex items-center justify-center text-lg rounded ${
                          actionForm.icon === icon
                            ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={actionForm.icon}
                    onChange={(e) => setActionForm({ ...actionForm, icon: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl"
                    placeholder="Atau ketik emoji"
                    maxLength={2}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Warna
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setActionForm({ ...actionForm, color: color.value })}
                        className={`w-8 h-8 rounded ${color.value.split(' ')[0]} ${
                          actionForm.color === color.value ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowActionFormModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingAction ? 'Simpan' : 'Tambah'}
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
