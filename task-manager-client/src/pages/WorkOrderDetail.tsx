import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workOrdersAPI, assetsAPI, downtimeAPI, usersAPI, aiAPI } from '../services/api';
import { WorkOrder, DowntimeLog, User, FailureCode } from '../types';
import { RichTextViewer } from '../components/RichTextEditor';
import AssigneeMultiSelect from '../components/AssigneeMultiSelect';
import AIWritingAssistant from '../components/AIWritingAssistant';
import { Sparkles, Loader2 } from 'lucide-react';
import { formatDateTime, formatDurationMinutes, calculateDurationMinutes } from '../utils/dateUtils';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'In Progress' },
  on_hold: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'On Hold' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-800 dark:text-gray-300', label: 'Cancelled' },
};

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  preventive: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Preventive' },
  corrective: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Corrective' },
  emergency: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', label: 'Emergency' },
};

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-600 dark:text-slate-300', label: 'Low' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Medium' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'High' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Critical' },
};

// AI Assignee Button for Work Order
function AIAssigneeButton({
  workOrder,
  onSuggest,
  isDark
}: {
  workOrder: WorkOrder;
  onSuggest: (userId: number) => void;
  isDark: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    try {
      // Use new AITaskPrioritizer service (Story 7.3)
      const response = await aiAPI.suggestTechnician({
        taskType: 'work_order',
        priority: workOrder.priority,
        departmentId: workOrder.department_id || undefined,
        title: workOrder.title,
        assetId: workOrder.asset_id,
      });

      const mappedSuggestions = response.suggestions.map((s: any) => ({
        user: { id: s.userId, name: s.userName },
        score: s.matchScore,
        reason: s.reason,
      }));

      setSuggestions(mappedSuggestions);
      setShowDropdown(true);
    } catch (error) {
      toast.error('Gagal mendapatkan saran AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleGetSuggestions}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        } bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30`}
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Saran AI
      </button>

      {showDropdown && suggestions.length > 0 && (
        <div className={`absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-xl ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-3 py-2 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Rekomendasi Teknisi AI
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.user.id}
                type="button"
                onClick={() => {
                  onSuggest(suggestion.user.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-400/20 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {suggestion.user.name}
                  </p>
                  <p className={`text-[10px] truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Score: {suggestion.score} • {suggestion.reason}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: '',
    assignee_ids: [] as number[],
    scheduled_start: '',
    scheduled_end: '',
    failure_code_id: '',
  });
  
  const [completeForm, setCompleteForm] = useState({
    solution: '',
    root_cause: '',
    labor_hours: '',
    parts_used: '',
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [woRes, usersRes, fcRes] = await Promise.all([
        workOrdersAPI.getById(parseInt(id)),
        usersAPI.getAll(),
        assetsAPI.getFailureCodes(),
      ]);
      
      const wo = woRes.data;
      setWorkOrder(wo);
      setUsers(usersRes.data);
      setFailureCodes(fcRes.data);
      
      // Fetch downtime logs for this work order
      if (wo) {
        const dtRes = await downtimeAPI.getAll({ asset_id: wo.asset_id, limit: 50 });
        // Filter to show only downtime logs related to this work order or around the same time
        const relatedLogs = dtRes.data.filter((dt: DowntimeLog) => dt.work_order_id === wo.id);
        setDowntimeLogs(relatedLogs);
      }
      
      // Initialize edit form
      setEditForm({
        title: wo.title || '',
        description: wo.description || '',
        priority: wo.priority || 'medium',
        assignee_ids: wo.assignees?.map((a: { id: number }) => a.id) || [],
        scheduled_start: wo.scheduled_start?.slice(0, 16) || '',
        scheduled_end: wo.scheduled_end?.slice(0, 16) || '',
        failure_code_id: wo.failure_code_id?.toString() || '',
      });
    } catch (error) {
      console.error('Error fetching work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!workOrder) return;
    
    try {
      const result = await workOrdersAPI.start(workOrder.id);
      toast.success('Work order dimulai');
      if (result.data.downtime_created) {
        toast.success(`Downtime log dibuat otomatis`, { icon: '⏱️' });
      }
      if (result.data.ticketUpdated) {
        toast.success('Ticket status → In Progress', { icon: '📋' });
      }
      fetchData();
    } catch (error) {
      console.error('Error starting work order:', error);
      toast.error('Gagal memulai work order');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;
    
    try {
      const response = await workOrdersAPI.complete(workOrder.id, {
        solution: completeForm.solution || undefined,
        root_cause: completeForm.root_cause || undefined,
        labor_hours: completeForm.labor_hours ? parseFloat(completeForm.labor_hours) : undefined,
        parts_used: completeForm.parts_used || undefined,
      });
      
      toast.success('Work order selesai');
      
      // Show notification if parent ticket was auto-updated
      if (response.data.ticketUpdated) {
        toast.success('Ticket status → Done', { icon: '🎉' });
      }
      
      setShowCompleteModal(false);
      fetchData();
    } catch (error) {
      console.error('Error completing work order:', error);
      toast.error('Gagal menyelesaikan work order');
    }
  };

  const handleCancel = async () => {
    if (!workOrder) return;
    if (!window.confirm('Apakah Anda yakin ingin membatalkan work order ini?')) return;
    
    try {
      await workOrdersAPI.cancel(workOrder.id);
      fetchData();
    } catch (error) {
      console.error('Error cancelling work order:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrder) return;
    
    try {
      await workOrdersAPI.update(workOrder.id, {
        title: editForm.title,
        description: editForm.description || null,
        priority: editForm.priority,
        assignee_ids: editForm.assignee_ids,
        scheduled_start: editForm.scheduled_start || null,
        scheduled_end: editForm.scheduled_end || null,
        failure_code_id: editForm.failure_code_id ? parseInt(editForm.failure_code_id) : null,
      });
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating work order:', error);
    }
  };

  const toggleAssignee = (userId: number) => {
    setEditForm(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const calculateDuration = () => {
    if (!workOrder?.actual_start || !workOrder?.actual_end) return null;
    const minutes = calculateDurationMinutes(workOrder.actual_start, workOrder.actual_end);
    return minutes !== null ? formatDurationMinutes(minutes) : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Work Order tidak ditemukan</h2>
        <Link to="/work-orders" className="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke daftar work order
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
            onClick={() => navigate('/work-orders')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{workOrder.wo_number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[workOrder.type]?.bg} ${typeColors[workOrder.type]?.text}`}>
                {typeColors[workOrder.type]?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[workOrder.priority]?.bg} ${priorityColors[workOrder.priority]?.text}`}>
                {priorityColors[workOrder.priority]?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[workOrder.status]?.bg} ${statusColors[workOrder.status]?.text}`}>
                {statusColors[workOrder.status]?.label}
              </span>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{workOrder.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {workOrder.status === 'open' && (
            <>
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mulai Kerjakan
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Edit
              </button>
            </>
          )}
          {workOrder.status === 'in_progress' && (
            <>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Selesaikan
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Edit
              </button>
            </>
          )}
          {['open', 'in_progress', 'on_hold'].includes(workOrder.status) && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Batalkan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Deskripsi</h2>
            </div>
            <div className="p-6">
              {workOrder.description ? (
                <RichTextViewer content={workOrder.description} isDark={document.documentElement.classList.contains('dark')} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada deskripsi</p>
              )}
            </div>
          </div>

          {/* Solution & Root Cause (if completed) */}
          {workOrder.status === 'completed' && (workOrder.solution || workOrder.root_cause) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hasil Perbaikan</h2>
              </div>
              <div className="p-6 space-y-4">
                {workOrder.root_cause && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Root Cause</div>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{workOrder.root_cause}</p>
                  </div>
                )}
                {workOrder.solution && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Solusi</div>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{workOrder.solution}</p>
                  </div>
                )}
                {workOrder.parts_used && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Parts yang Digunakan</div>
                    <p className="text-gray-900 dark:text-white">{workOrder.parts_used}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Downtime Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Downtime Terkait</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {downtimeLogs.length > 0 ? (
                downtimeLogs.map((dt) => (
                  <div key={dt.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium
                            ${dt.downtime_type === 'planned' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {dt.downtime_type}
                          </span>
                          {dt.classification_name && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {dt.classification_name}
                            </span>
                          )}
                          {dt.counts_as_downtime ? (
                            <span className="text-xs text-green-600 dark:text-green-400">✓ Dihitung</span>
                          ) : (
                            <span className="text-xs text-gray-400">✗ Tidak dihitung</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDateTime(dt.start_time)} - {dt.end_time ? formatDateTime(dt.end_time) : 'Aktif'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatDurationMinutes(dt.duration_minutes || dt.current_duration_minutes)}
                        </div>
                        {dt.reason && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {dt.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada downtime log yang terkait
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Parent Ticket */}
              {workOrder.related_ticket_id && (
                <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Parent Ticket</div>
                  <Link 
                    to={`/tickets/${workOrder.related_ticket_id}`}
                    className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm text-blue-600 dark:text-blue-400">
                        {workOrder.related_ticket_key}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Klik untuk lihat ticket
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Asset</div>
                <Link 
                  to={`/assets/${workOrder.asset_id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {workOrder.asset_code} - {workOrder.asset_name}
                </Link>
                {workOrder.asset_location && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{workOrder.asset_location}</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Failure Code</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {workOrder.failure_code ? `${workOrder.failure_code} - ${workOrder.failure_description}` : '-'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Assigned To</div>
                {workOrder.assignees && workOrder.assignees.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {workOrder.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{assignee.name}</div>
                          {assignee.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{assignee.email}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="font-medium text-gray-500 dark:text-gray-400">Belum ditugaskan</div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Reported By</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {workOrder.reporter_name || '-'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Scheduled</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDateTime(workOrder.scheduled_start)} - {formatDateTime(workOrder.scheduled_end)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Actual</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDateTime(workOrder.actual_start)} - {formatDateTime(workOrder.actual_end)}
                </div>
                {calculateDuration() && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Durasi: {calculateDuration()}
                  </div>
                )}
              </div>

              {workOrder.labor_hours && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Labor Hours</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {workOrder.labor_hours} jam
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDateTime(workOrder.created_at)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Updated</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDateTime(workOrder.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Work Order</h2>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={editForm.description}
                    onChange={(value) => setEditForm({ ...editForm, description: value })}
                    context={{
                      type: 'work_order',
                      title: editForm.title,
                      asset: workOrder?.asset_name,
                      priority: editForm.priority
                    }}
                    workOrderId={workOrder?.id}
                    assetId={workOrder?.asset_id}
                    placeholder="Deskripsi pekerjaan..."
                    minHeight="120px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assign ke Teknisi
                    </label>
                    {workOrder && (
                      <AIAssigneeButton
                        workOrder={workOrder}
                        isDark={document.documentElement.classList.contains('dark')}
                        onSuggest={toggleAssignee}
                      />
                    )}
                  </div>
                  <AssigneeMultiSelect
                    users={users}
                    selectedIds={editForm.assignee_ids}
                    onChange={(ids) => setEditForm({ ...editForm, assignee_ids: ids })}
                    isDark={document.documentElement.classList.contains('dark')}
                    placeholder="Pilih teknisi..."
                    required={false}
                    filterRole={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Failure Code</label>
                  <select
                    value={editForm.failure_code_id}
                    onChange={(e) => setEditForm({ ...editForm, failure_code_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Pilih Failure Code</option>
                    {failureCodes.map((fc) => (
                      <option key={fc.id} value={fc.id}>{fc.code} - {fc.description}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled Start</label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduled_start}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheduled End</label>
                    <input
                      type="datetime-local"
                      value={editForm.scheduled_end}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCompleteModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selesaikan Work Order</h2>
              </div>
              <form onSubmit={handleComplete} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Root Cause
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={completeForm.root_cause}
                    onChange={(value) => setCompleteForm({ ...completeForm, root_cause: value })}
                    context={{
                      type: 'work_order',
                      title: workOrder?.title || '',
                      asset: workOrder?.asset_name
                    }}
                    workOrderId={workOrder?.id}
                    assetId={workOrder?.asset_id}
                    placeholder="Apa penyebab masalah?"
                    minHeight="100px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Solusi
                    <span className="ml-2 text-xs text-indigo-500 font-normal">✨ AI Assisted</span>
                  </label>
                  <AIWritingAssistant
                    value={completeForm.solution}
                    onChange={(value) => setCompleteForm({ ...completeForm, solution: value })}
                    context={{
                      type: 'work_order',
                      title: workOrder?.title || '',
                      asset: workOrder?.asset_name
                    }}
                    workOrderId={workOrder?.id}
                    assetId={workOrder?.asset_id}
                    placeholder="Apa yang dilakukan untuk menyelesaikan masalah?"
                    minHeight="100px"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Labor Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={completeForm.labor_hours}
                      onChange={(e) => setCompleteForm({ ...completeForm, labor_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Jam kerja"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parts Used</label>
                    <input
                      type="text"
                      value={completeForm.parts_used}
                      onChange={(e) => setCompleteForm({ ...completeForm, parts_used: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Spare part yang digunakan"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Selesaikan
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

