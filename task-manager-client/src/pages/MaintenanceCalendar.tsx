import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { maintenanceAPI, assetsAPI, usersAPI } from '../services/api';
import { aiAPI } from '../services/api-v2';
import { MaintenanceSchedule, Asset, User } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import { X, Plus, Calendar, Clock, Users, Check, Wrench, ChevronDown, AlertTriangle, Settings, Sparkles, Brain, Loader2, CheckSquare, ListChecks, TrendingUp, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Single Assignee Select Component (consistent with AssigneeMultiSelect style)
function AssigneeSelect({ 
  users, 
  selectedId, 
  onChange,
  isDark = true
}: { 
  users: User[]; 
  selectedId: number | null; 
  onChange: (id: number | null) => void;
  isDark?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUser = users.find(u => u.id === selectedId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
          isDark 
            ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!selectedUser ? (
            <span className={isDark ? 'text-dark-400' : 'text-gray-400'}>Pilih teknisi...</span>
          ) : (
            <div className="flex items-center gap-2">
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs text-white font-medium">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedUser.name}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto border ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          {/* Option to clear selection */}
          <button
            type="button"
            onClick={() => { onChange(null); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
              !selectedId 
                ? isDark ? 'bg-dark-700/50' : 'bg-blue-50' 
                : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-dark-600' : 'bg-gray-200'}`}>
              <X className={`w-3 h-3 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
            </div>
            <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Tidak ada</span>
          </button>
          
          {users.length === 0 ? (
            <div className={`p-3 text-sm text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Tidak ada teknisi tersedia
            </div>
          ) : (
            users.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => { onChange(user.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  selectedId === user.id 
                    ? isDark ? 'bg-dark-700/50' : 'bg-blue-50' 
                    : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  selectedId === user.id 
                    ? 'bg-blue-500 border-blue-500' 
                    : isDark ? 'border-dark-600' : 'border-gray-300'
                }`}>
                  {selectedId === user.id && <Check className="w-3 h-3 text-white" />}
                </div>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                  <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{user.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const frequencyLabels: Record<string, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  quarterly: 'Kuartalan',
  yearly: 'Tahunan',
  runtime_hours: 'Runtime Hours',
};

export default function MaintenanceCalendar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAsset, setSelectedAsset] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  
  const [formData, setFormData] = useState({
    asset_id: '',
    description: '',
    frequency_type: 'monthly',
    frequency_value: 1,
    next_due: '',
    estimated_duration_minutes: 60,
    assigned_to: null as number | null,
    checklist: [] as string[],
    // Loop feature
    loop_enabled: false,
    loop_end_date: '', // End date for loop generation
  });

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<{
    checklist: string[];
    analysis: {
      downtime_summary: string;
      common_issues: string[];
      recommendation: string;
      suggested_frequency?: string;
      suggested_duration?: number;
    };
    description_suggestion?: string;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedAsset, showOverdueOnly]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, assetsRes, usersRes] = await Promise.all([
        maintenanceAPI.getSchedules({
          asset_id: selectedAsset ? parseInt(selectedAsset) : undefined,
          overdue_only: showOverdueOnly || undefined,
          is_active: true,
        }),
        assetsAPI.getAll({ status: 'operational' }),
        usersAPI.getAll(),
      ]);
      
      setSchedules(schedulesRes.data);
      setAssets(assetsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Auto-generate title from frequency
      const selectedAsset = assets.find(a => a.id === parseInt(formData.asset_id));
      const autoTitle = `PM ${frequencyLabels[formData.frequency_type]} - ${selectedAsset?.asset_code || 'Asset'}`;
      
      const payload = {
        asset_id: parseInt(formData.asset_id),
        title: autoTitle,
        description: formData.description || undefined,
        frequency_type: formData.frequency_type,
        frequency_value: formData.frequency_value,
        next_due: formData.next_due || undefined,
        estimated_duration_minutes: formData.estimated_duration_minutes || undefined,
        assigned_to: formData.assigned_to || undefined,
        checklist: formData.checklist.length > 0 ? formData.checklist : undefined,
      };

      if (editingSchedule) {
        await maintenanceAPI.updateSchedule(editingSchedule.id, payload);
        toast.success('Jadwal berhasil diperbarui');
      } else if (formData.loop_enabled && formData.next_due) {
        // Use loop generation API
        const loopPayload = {
          ...payload,
          start_date: formData.next_due,
          end_date: formData.loop_end_date || undefined,
        };
        const response = await maintenanceAPI.generateLoopSchedules(loopPayload);
        toast.success(`${response.data.total_created} jadwal berhasil dibuat sampai ${response.data.date_range?.end || 'akhir tahun'}`);
      } else {
        await maintenanceAPI.createSchedule(payload);
        toast.success('Jadwal berhasil ditambahkan');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      console.error('Error saving schedule:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Gagal menyimpan jadwal';
      toast.error(errorMessage || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSchedule = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      asset_id: schedule.asset_id.toString(),
      description: schedule.description || '',
      frequency_type: schedule.frequency_type,
      frequency_value: schedule.frequency_value,
      next_due: schedule.next_due || '',
      estimated_duration_minutes: schedule.estimated_duration_minutes || 60,
      assigned_to: schedule.assigned_to || null,
      checklist: schedule.checklist ? JSON.parse(schedule.checklist) : [],
    });
    setAiSuggestions(null);
    setShowAIPanel(false);
    setShowModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
      await maintenanceAPI.deleteSchedule(scheduleId);
      toast.success('Jadwal berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Gagal menghapus jadwal');
    }
  };

  // Handle clicking on a date to create a new schedule
  const handleDateClick = (date: Date) => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      next_due: format(date, 'yyyy-MM-dd'),
    }));
    setShowModal(true);
  };

  // Fetch AI suggestions for PM
  const fetchAISuggestions = async () => {
    if (!formData.asset_id) {
      toast.error('Pilih asset terlebih dahulu');
      return;
    }

    setLoadingAI(true);
    setShowAIPanel(true);
    
    try {
      const selectedAsset = assets.find(a => a.id === parseInt(formData.asset_id));
      const response = await aiAPI.getPMSuggestions({
        asset_id: parseInt(formData.asset_id),
        title: `PM ${frequencyLabels[formData.frequency_type]} - ${selectedAsset?.asset_code || 'Asset'}`,
        frequency_type: formData.frequency_type,
      });

      if (response.data.success && response.data.data) {
        setAiSuggestions(response.data.data);
        toast.success('AI suggestions loaded');
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast.error('Gagal memuat saran AI');
    } finally {
      setLoadingAI(false);
    }
  };

  // Apply AI suggestions to form
  const applyAISuggestion = (type: 'checklist' | 'description' | 'frequency' | 'duration') => {
    if (!aiSuggestions) return;

    switch (type) {
      case 'checklist':
        setFormData(prev => ({ ...prev, checklist: aiSuggestions.checklist }));
        toast.success('Checklist diterapkan');
        break;
      case 'description':
        if (aiSuggestions.description_suggestion) {
          setFormData(prev => ({ ...prev, description: aiSuggestions.description_suggestion || '' }));
          toast.success('Deskripsi diterapkan');
        }
        break;
      case 'frequency':
        if (aiSuggestions.analysis.suggested_frequency) {
          setFormData(prev => ({ ...prev, frequency_type: aiSuggestions.analysis.suggested_frequency || 'monthly' }));
          toast.success('Frekuensi diterapkan');
        }
        break;
      case 'duration':
        if (aiSuggestions.analysis.suggested_duration) {
          setFormData(prev => ({ ...prev, estimated_duration_minutes: aiSuggestions.analysis.suggested_duration || 60 }));
          toast.success('Durasi diterapkan');
        }
        break;
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = (item: string) => {
    setFormData(prev => {
      const checklist = prev.checklist.includes(item)
        ? prev.checklist.filter(i => i !== item)
        : [...prev.checklist, item];
      return { ...prev, checklist };
    });
  };

  const handleGenerateWorkOrder = async (scheduleId: number) => {
    if (!window.confirm('Buat Work Order dari jadwal maintenance ini?')) return;
    
    try {
      await maintenanceAPI.generateWorkOrder(scheduleId);
      fetchData();
    } catch (error) {
      console.error('Error generating work order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      asset_id: '',
      description: '',
      frequency_type: 'monthly',
      frequency_value: 1,
      next_due: '',
      estimated_duration_minutes: 60,
      assigned_to: null,
      checklist: [],
      loop_enabled: false,
      loop_end_date: '',
    });
    setEditingSchedule(null);
    setSelectedSchedule(null);
    setAiSuggestions(null);
    setShowAIPanel(false);
  };

  // Get days for current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get schedules for a specific day
  const getSchedulesForDay = (date: Date) => {
    return schedules.filter((schedule) => {
      if (!schedule.next_due) return false;
      try {
        const dueDate = parseISO(schedule.next_due);
        return isSameDay(dueDate, date);
      } catch {
        return false;
      }
    });
  };

  // Get overdue schedules
  const overdueSchedules = schedules.filter((s) => {
    if (!s.next_due) return false;
    try {
      return isBefore(parseISO(s.next_due), new Date()) && s.is_active;
    } catch {
      return false;
    }
  });

  // Get upcoming schedules (next 7 days)
  const upcomingSchedules = schedules.filter((s) => {
    if (!s.next_due) return false;
    try {
      const dueDate = parseISO(s.next_due);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= nextWeek;
    } catch {
      return false;
    }
  });

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd MMM yyyy', { locale: localeId });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal Maintenance</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola jadwal preventive maintenance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Jadwal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Jadwal</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{schedules.length}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="text-sm text-red-600 dark:text-red-400">Overdue</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{overdueSchedules.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">7 Hari Kedepan</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{upcomingSchedules.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="text-sm text-green-600 dark:text-green-400">Assets Aktif</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{assets.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Semua Asset</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.asset_code} - {asset.name}
            </option>
          ))}
        </select>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOverdueOnly}
            onChange={(e) => setShowOverdueOnly(e.target.checked)}
            className="rounded text-red-600"
          />
          <span className="text-gray-700 dark:text-gray-300">Tampilkan Overdue Saja</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {dayNames.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" />
            ))}
            
            {daysInMonth.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              const isDayToday = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-1 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer group relative transition-colors
                    ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                    ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                  onClick={() => handleDateClick(day)}
                >
                  {/* Date number and add button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isDayToday 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {/* Add button - shows on hover */}
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                      isDark ? 'hover:bg-dark-600' : 'hover:bg-gray-200'
                    }`}>
                      <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>
                  
                  {/* Schedule items */}
                  <div className="space-y-1">
                    {daySchedules.slice(0, 2).map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`text-xs p-1.5 rounded cursor-pointer hover:ring-2 hover:ring-blue-400/50 transition-all
                          ${schedule.is_overdue 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-l-2 border-red-500' 
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-l-2 border-blue-500'
                          }`}
                        title={`${schedule.asset_code} - ${schedule.title}\nFrekuensi: ${schedule.frequency_value}x ${frequencyLabels[schedule.frequency_type] || schedule.frequency_type}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent date click
                          setSelectedSchedule(schedule);
                        }}
                      >
                        {/* Asset Code */}
                        <div className="font-semibold truncate">{schedule.asset_code}</div>
                        {/* PM Title */}
                        <div className="truncate opacity-90">{schedule.title}</div>
                        {/* Frequency badge */}
                        <div className={`mt-0.5 inline-flex items-center gap-1 text-[10px] px-1 rounded ${
                          schedule.is_overdue
                            ? 'bg-red-200 dark:bg-red-800/50'
                            : 'bg-blue-200 dark:bg-blue-800/50'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          {schedule.frequency_value}x {frequencyLabels[schedule.frequency_type]?.charAt(0).toUpperCase() || schedule.frequency_type.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div 
                        className={`text-xs py-1 px-1.5 rounded text-center cursor-pointer transition-colors ${
                          isDark 
                            ? 'text-dark-400 hover:bg-dark-700' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show first hidden schedule
                          setSelectedSchedule(daySchedules[2]);
                        }}
                      >
                        +{daySchedules.length - 2} lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Schedule List or Detail */}
        <div className="space-y-6">
          {/* Selected Schedule Detail */}
          {selectedSchedule ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Detail Jadwal</h3>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Asset</div>
                  <Link 
                    to={`/assets/${selectedSchedule.asset_id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {selectedSchedule.asset_code} - {selectedSchedule.asset_name}
                  </Link>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Title</div>
                  <div className="font-medium text-gray-900 dark:text-white">{selectedSchedule.title}</div>
                </div>
                {selectedSchedule.description && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Deskripsi</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{selectedSchedule.description}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Frekuensi</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {selectedSchedule.frequency_value}x {frequencyLabels[selectedSchedule.frequency_type] || selectedSchedule.frequency_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Durasi Est.</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {selectedSchedule.estimated_duration_minutes || '-'} menit
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Next Due</div>
                  <div className={`font-medium ${
                    selectedSchedule.is_overdue 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(selectedSchedule.next_due)}
                    {selectedSchedule.is_overdue && ' (Overdue!)'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Assigned To</div>
                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedSchedule.assigned_to_name ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs text-white font-medium">
                          {selectedSchedule.assigned_to_name.charAt(0).toUpperCase()}
                        </div>
                        {selectedSchedule.assigned_to_name}
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-dark-400">Belum ditentukan</span>
                    )}
                  </div>
                </div>

                {/* Checklist Section */}
                {selectedSchedule.checklist && (() => {
                  try {
                    const checklistItems = JSON.parse(selectedSchedule.checklist);
                    if (Array.isArray(checklistItems) && checklistItems.length > 0) {
                      return (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Checklist ({checklistItems.length} item)
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {checklistItems.map((item: string, index: number) => (
                              <div key={index} className={`flex items-start gap-2 text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                                <CheckSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch {
                    return null;
                  }
                })()}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    onClick={() => handleGenerateWorkOrder(selectedSchedule.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Buat Work Order
                  </button>
                  <button
                    onClick={() => handleEditSchedule(selectedSchedule)}
                    className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      isDark 
                        ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Edit Jadwal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Overdue List */}
              {overdueSchedules.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="px-4 py-3 border-b border-red-200 dark:border-red-800">
                    <h3 className="font-semibold text-red-700 dark:text-red-300">
                      Overdue ({overdueSchedules.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-red-200 dark:divide-red-800">
                    {overdueSchedules.slice(0, 5).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <div className="font-medium text-red-900 dark:text-red-100">{schedule.asset_code}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">{schedule.title}</div>
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Due: {formatDate(schedule.next_due)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    7 Hari Kedepan ({upcomingSchedules.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingSchedules.length > 0 ? (
                    upcomingSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => setSelectedSchedule(schedule)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{schedule.asset_code}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{schedule.title}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Due: {formatDate(schedule.next_due)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada jadwal dalam 7 hari kedepan
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
            <div className={`relative rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border ${
              isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b sticky top-0 flex items-center justify-between ${
                isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Wrench className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {editingSchedule ? 'Edit Jadwal PM' : 'Tambah Jadwal PM'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Asset Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.asset_id}
                    onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                    required
                  >
                    <option value="">Pilih Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_code} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Assistant Button */}
                <div className={`p-4 rounded-xl border-2 border-dashed ${
                  isDark ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-300 bg-purple-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                        <Brain className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          AI Assistant
                        </div>
                        <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Analisis downtime & saran checklist
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={fetchAISuggestions}
                      disabled={!formData.asset_id || loadingAI}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        !formData.asset_id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDark
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {loadingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Dapatkan Saran AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Suggestions Panel */}
                {showAIPanel && aiSuggestions && (
                  <div className={`rounded-xl border overflow-hidden ${
                    isDark ? 'border-dark-600 bg-dark-800' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {/* Analysis Section */}
                    <div className={`p-4 border-b ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Analisis Downtime
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                        {aiSuggestions.analysis.downtime_summary}
                      </p>
                      
                      {aiSuggestions.analysis.common_issues.length > 0 && (
                        <div className="mb-3">
                          <div className={`text-xs font-medium mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            Masalah Umum:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {aiSuggestions.analysis.common_issues.map((issue, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recommendation */}
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-white'}`}>
                        <div className="flex items-start gap-2">
                          <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                          <p className={`text-sm ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
                            {aiSuggestions.analysis.recommendation}
                          </p>
                        </div>
                      </div>

                      {/* Quick Apply Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {aiSuggestions.analysis.suggested_frequency && (
                          <button
                            type="button"
                            onClick={() => applyAISuggestion('frequency')}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                              isDark 
                                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Terapkan {frequencyLabels[aiSuggestions.analysis.suggested_frequency]}
                          </button>
                        )}
                        {aiSuggestions.analysis.suggested_duration && (
                          <button
                            type="button"
                            onClick={() => applyAISuggestion('duration')}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                              isDark 
                                ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Durasi: {aiSuggestions.analysis.suggested_duration} menit
                          </button>
                        )}
                        {aiSuggestions.description_suggestion && (
                          <button
                            type="button"
                            onClick={() => applyAISuggestion('description')}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                              isDark 
                                ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' 
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            Gunakan Deskripsi AI
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Checklist Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ListChecks className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Checklist PM
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyAISuggestion('checklist')}
                          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                            isDark 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          Pilih Semua
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aiSuggestions.checklist.map((item, index) => (
                          <label
                            key={index}
                            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              formData.checklist.includes(item)
                                ? isDark ? 'bg-green-900/20' : 'bg-green-50'
                                : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.checklist.includes(item)}
                              onChange={() => toggleChecklistItem(item)}
                              className="mt-0.5 rounded text-green-500"
                            />
                            <span className={`text-sm ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                      {formData.checklist.length > 0 && (
                        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                          <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {formData.checklist.length} item dipilih
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Checklist (if any, without AI panel) */}
                {!showAIPanel && formData.checklist.length > 0 && (
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-dark-600 bg-dark-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckSquare className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Checklist ({formData.checklist.length} item)
                      </span>
                    </div>
                    <div className="space-y-1">
                      {formData.checklist.map((item, index) => (
                        <div key={index} className={`text-sm flex items-center gap-2 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                          <Check className="w-3 h-3 text-green-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-colors resize-none ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400 hover:border-dark-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 hover:border-gray-400'
                    }`}
                    placeholder="Deskripsi tugas maintenance..."
                  />
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Frekuensi
                    </label>
                    <select
                      value={formData.frequency_type}
                      onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                        isDark 
                          ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      <option value="daily">Harian</option>
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                      <option value="quarterly">Kuartalan</option>
                      <option value="yearly">Tahunan</option>
                      <option value="runtime_hours">Runtime Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Setiap
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.frequency_value}
                        onChange={(e) => setFormData({ ...formData, frequency_value: parseInt(e.target.value) || 1 })}
                        className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                          isDark 
                            ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                        }`}
                      />
                      <span className={`text-sm whitespace-nowrap ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        {frequencyLabels[formData.frequency_type]?.replace('an', '') || ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Due Date & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formData.loop_enabled ? 'Tanggal Mulai' : 'Jadwal Berikutnya'}
                    </label>
                    <input
                      type="date"
                      value={formData.next_due}
                      onChange={(e) => setFormData({ ...formData, next_due: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                        isDark 
                          ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                      required={formData.loop_enabled}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      Est. Durasi (menit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                        isDark 
                          ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Loop / Recurring Schedule */}
                {!editingSchedule && (
                  <div className={`p-4 rounded-xl border ${
                    formData.loop_enabled
                      ? isDark ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-300 bg-blue-50'
                      : isDark ? 'border-dark-600 bg-dark-800' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.loop_enabled}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          loop_enabled: e.target.checked,
                          loop_end_date: e.target.checked ? `${new Date().getFullYear()}-12-31` : ''
                        })}
                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          🔄 Generate Loop Jadwal
                        </div>
                        <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          Otomatis membuat jadwal berulang berdasarkan frekuensi
                        </div>
                      </div>
                    </label>
                    
                    {formData.loop_enabled && (
                      <div className="mt-4 pt-4 border-t border-dashed grid grid-cols-2 gap-4" style={{ borderColor: isDark ? '#374151' : '#d1d5db' }}>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                            Sampai Tanggal
                          </label>
                          <input
                            type="date"
                            value={formData.loop_end_date}
                            onChange={(e) => setFormData({ ...formData, loop_end_date: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                              isDark 
                                ? 'bg-dark-700 border-dark-600 text-white hover:border-dark-500' 
                                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                            }`}
                          />
                          <div className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            Kosong = Akhir tahun {new Date().getFullYear()}
                          </div>
                        </div>
                        <div className={`flex flex-col justify-center ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                          <div className="text-sm">
                            <span className="font-medium">Preview:</span>
                          </div>
                          <div className="text-xs">
                            {formData.frequency_type === 'daily' && `Setiap ${formData.frequency_value} hari`}
                            {formData.frequency_type === 'weekly' && `Setiap ${formData.frequency_value} minggu`}
                            {formData.frequency_type === 'monthly' && `Setiap ${formData.frequency_value} bulan`}
                            {formData.frequency_type === 'quarterly' && `Setiap ${formData.frequency_value * 3} bulan`}
                            {formData.frequency_type === 'yearly' && `Setiap ${formData.frequency_value} tahun`}
                            {formData.frequency_type === 'runtime_hours' && 'Loop tidak tersedia untuk Runtime Hours'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned To */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    <Users className="w-4 h-4 inline mr-1" />
                    Teknisi
                  </label>
                  <AssigneeSelect
                    users={users.filter(u => u.role === 'technician' || u.role === 'admin' || u.role === 'manager')}
                    selectedId={formData.assigned_to}
                    onChange={(id) => setFormData({ ...formData, assigned_to: id })}
                    isDark={isDark}
                  />
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-5 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                  {editingSchedule && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(editingSchedule.id)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                    >
                      Hapus Jadwal
                    </button>
                  )}
                  <div className={`flex gap-3 ${editingSchedule ? '' : 'ml-auto'}`}>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                        isDark 
                          ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving || (formData.loop_enabled && !formData.next_due)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {formData.loop_enabled ? 'Generating...' : 'Menyimpan...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {editingSchedule ? 'Update' : formData.loop_enabled ? 'Generate Loop' : 'Simpan'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


