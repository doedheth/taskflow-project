import { useState, useEffect, useRef, useCallback } from 'react';
import { maintenanceAPI, assetsAPI } from '../services/api';
import { Asset, ProductionScheduleEntry, ShiftPattern } from '../types';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-green-500', text: 'text-white', label: 'Produksi' },
  no_order: { bg: 'bg-gray-300 dark:bg-gray-600', text: 'text-gray-700 dark:text-gray-300', label: 'No Order' },
  holiday: { bg: 'bg-blue-300 dark:bg-blue-700', text: 'text-blue-800 dark:text-blue-100', label: 'Holiday' },
  maintenance_window: { bg: 'bg-orange-400', text: 'text-white', label: 'PM Window' },
};

export default function ProductionSchedule() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [shifts, setShifts] = useState<ShiftPattern[]>([]);
  const [schedules, setSchedules] = useState<ProductionScheduleEntry[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProductionScheduleEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'timeline'>('timeline');
  
  // Timeline drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: string; shiftId: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: string; shiftId: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Range form state (for drag multi-day)
  const [rangeFormData, setRangeFormData] = useState({
    start_date: '',
    end_date: '',
    shift_pattern_id: '',
    status: 'scheduled',
    product_name: '',
    notes: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    shift_pattern_id: '',
    status: 'scheduled',
    planned_start: '',
    planned_end: '',
    planned_production_minutes: '',
    product_name: '',
    notes: '',
  });

  // Bulk form state
  const [bulkFormData, setBulkFormData] = useState({
    start_date: '',
    end_date: '',
    pattern: [
      { day_of_week: 1, status: 'scheduled', shift_pattern_id: '', product_name: '' }, // Monday
      { day_of_week: 2, status: 'scheduled', shift_pattern_id: '', product_name: '' },
      { day_of_week: 3, status: 'scheduled', shift_pattern_id: '', product_name: '' },
      { day_of_week: 4, status: 'scheduled', shift_pattern_id: '', product_name: '' },
      { day_of_week: 5, status: 'scheduled', shift_pattern_id: '', product_name: '' },
      { day_of_week: 6, status: 'no_order', shift_pattern_id: '', product_name: '' }, // Saturday
      { day_of_week: 0, status: 'no_order', shift_pattern_id: '', product_name: '' }, // Sunday
    ],
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      fetchSchedules();
    }
  }, [selectedAsset, currentDate, viewMode]);

  const fetchInitialData = async () => {
    try {
      const [assetsRes, shiftsRes] = await Promise.all([
        assetsAPI.getAll(),
        maintenanceAPI.getShifts(),
      ]);
      setAssets(assetsRes.data);
      setShifts(shiftsRes.data);
      
      if (assetsRes.data.length > 0) {
        setSelectedAsset(assetsRes.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedAsset) return;
    
    try {
      const { startDate, endDate } = getDateRange();
      const res = await maintenanceAPI.getProductionSchedule(
        parseInt(selectedAsset),
        startDate,
        endDate
      );
      setSchedules(res.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewMode === 'week') {
      // Get start of week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(diff + 6);
    } else {
      // Get start and end of month
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const getDaysArray = () => {
    const { startDate, endDate } = getDateRange();
    const days = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getScheduleForDay = (date: Date, shiftId?: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => 
      s.date === dateStr && 
      (!shiftId || s.shift_pattern_id === shiftId)
    );
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleCellClick = (date: Date, shift?: ShiftPattern, existingSchedule?: ProductionScheduleEntry) => {
    // Set editing schedule if exists
    setEditingSchedule(existingSchedule || null);
    
    setFormData({
      date: date.toISOString().split('T')[0],
      shift_pattern_id: existingSchedule?.shift_pattern_id?.toString() || shift?.id.toString() || '',
      status: existingSchedule?.status || 'scheduled',
      planned_start: existingSchedule?.planned_start || shift?.start_time || '',
      planned_end: existingSchedule?.planned_end || shift?.end_time || '',
      planned_production_minutes: existingSchedule?.planned_production_minutes?.toString() || '',
      product_name: existingSchedule?.product_name || '',
      notes: existingSchedule?.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const scheduleData = {
        asset_id: parseInt(selectedAsset),
        date: formData.date,
        shift_pattern_id: formData.shift_pattern_id ? parseInt(formData.shift_pattern_id) : undefined,
        status: formData.status as 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window',
        planned_start: formData.planned_start || undefined,
        planned_end: formData.planned_end || undefined,
        planned_production_minutes: formData.planned_production_minutes ? parseInt(formData.planned_production_minutes) : undefined,
        product_name: formData.product_name || undefined,
        notes: formData.notes || undefined,
      };

      if (editingSchedule) {
        // Update existing schedule
        await maintenanceAPI.updateProductionSchedule(editingSchedule.id, scheduleData);
      } else {
        // Create new schedule
        await maintenanceAPI.createProductionSchedule(scheduleData);
      }
      
      setShowModal(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!editingSchedule) return;
    
    setDeleting(true);
    try {
      await maintenanceAPI.deleteProductionSchedule(editingSchedule.id);
      setShowDeleteConfirm(false);
      setShowModal(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await maintenanceAPI.bulkCreateProductionSchedule({
        asset_id: parseInt(selectedAsset),
        start_date: bulkFormData.start_date,
        end_date: bulkFormData.end_date,
        pattern: bulkFormData.pattern.map(p => ({
          day_of_week: p.day_of_week,
          status: p.status,
          shift_pattern_id: p.shift_pattern_id ? parseInt(p.shift_pattern_id) : undefined,
          product_name: p.product_name || undefined,
        })),
      });
      
      setShowBulkModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error bulk creating schedules:', error);
    }
  };

  // Handle range submit (from drag multi-day)
  const handleRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      // Create schedule for each day in the range
      const start = new Date(rangeFormData.start_date);
      const end = new Date(rangeFormData.end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await maintenanceAPI.createProductionSchedule({
          asset_id: parseInt(selectedAsset),
          date: dateStr,
          shift_pattern_id: rangeFormData.shift_pattern_id ? parseInt(rangeFormData.shift_pattern_id) : undefined,
          status: rangeFormData.status as 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window',
          product_name: rangeFormData.product_name || undefined,
          notes: rangeFormData.notes || undefined,
        });
      }
      
      setShowRangeModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error creating range schedules:', error);
    }
  };

  // Timeline drag handlers
  const handleDragStart = useCallback((date: string, shiftId: number) => {
    setIsDragging(true);
    setDragStart({ date, shiftId });
    setDragEnd({ date, shiftId });
  }, []);

  const handleDragMove = useCallback((date: string, shiftId: number) => {
    if (isDragging && dragStart && dragStart.shiftId === shiftId) {
      setDragEnd({ date, shiftId });
    }
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Determine date range
      const startDate = dragStart.date < dragEnd.date ? dragStart.date : dragEnd.date;
      const endDate = dragStart.date > dragEnd.date ? dragStart.date : dragEnd.date;
      
      // If multi-day selection, open range modal (simpler form)
      if (startDate !== endDate) {
        setRangeFormData({
          start_date: startDate,
          end_date: endDate,
          shift_pattern_id: dragStart.shiftId.toString(),
          status: 'scheduled',
          product_name: '',
          notes: '',
        });
        setShowRangeModal(true);
      } else {
        // Single day - open regular modal
        setFormData({
          date: startDate,
          shift_pattern_id: dragStart.shiftId.toString(),
          status: 'scheduled',
          planned_start: '',
          planned_end: '',
          planned_production_minutes: '',
          product_name: '',
          notes: '',
        });
        setShowModal(true);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd]);

  const isInDragRange = useCallback((date: string, shiftId: number) => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.shiftId !== shiftId) return false;
    const minDate = dragStart.date < dragEnd.date ? dragStart.date : dragEnd.date;
    const maxDate = dragStart.date > dragEnd.date ? dragStart.date : dragEnd.date;
    return date >= minDate && date <= maxDate;
  }, [isDragging, dragStart, dragEnd]);

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
  };

  const days = getDaysArray();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">Kelola jadwal produksi per asset</p>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={!selectedAsset}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Buat Jadwal Bulk
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih Asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.asset_code} - {asset.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="px-4 py-2 font-medium text-gray-900 dark:text-white min-w-[150px] text-center">
              {viewMode === 'week' || viewMode === 'timeline'
                ? `${currentDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - Week ${Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}`
                : currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              }
            </span>
            
            <button
              onClick={handleNext}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'week' | 'month' | 'timeline')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="timeline">📅 Timeline (Drag & Drop)</option>
            <option value="week">Week View</option>
            <option value="month">Month View</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {Object.entries(statusColors).map(([status, { bg, text, label }]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${bg}`}></div>
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar/Timeline View */}
      {selectedAsset ? (
        viewMode === 'timeline' ? (
          /* Timeline View with Drag & Drop - Contained in fixed width */
          <div className="relative w-full" style={{ contain: 'inline-size' }}>
            <div 
              ref={timelineRef}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 select-none"
              onMouseUp={handleDragEnd}
              onMouseLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setDragStart(null);
                  setDragEnd(null);
                }
              }}
            >
              {/* Timeline Instructions */}
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Drag pada area kosong untuk buat jadwal. Klik jadwal untuk edit.</span>
                </div>
              </div>
              
              {/* Scrollable Timeline Container */}
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <table className="w-full border-collapse" style={{ minWidth: `${80 + days.length * 70}px`, tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="w-20 px-2 py-2 text-left border-r border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">
                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Shift</div>
                      </th>
                      {days.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <th 
                            key={i} 
                            className={`w-[70px] px-1 py-2 text-center border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0
                              ${isWeekend ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700/50'}
                              ${isToday ? '!bg-blue-100 dark:!bg-blue-900/30' : ''}`}
                          >
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{dayNames[day.getDay()]}</div>
                            <div className={`text-sm font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {day.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.filter(s => s.is_active).map((shift) => (
                      <tr key={shift.id}>
                        {/* Shift Label - Sticky */}
                        <td className="w-20 px-2 py-2 bg-gray-50 dark:bg-gray-700/30 border-r border-b border-gray-200 dark:border-gray-700 sticky left-0 z-10">
                          <div className="font-medium text-gray-900 dark:text-white text-xs">{shift.name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{shift.start_time.slice(0,5)}</div>
                        </td>
                        
                        {/* Timeline Cells */}
                        {days.map((day, i) => {
                          const dateStr = day.toISOString().split('T')[0];
                          const schedule = getScheduleForDay(day, shift.id);
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          const inDragRange = isInDragRange(dateStr, shift.id);
                          
                          return (
                            <td
                              key={i}
                              className={`w-[70px] h-[50px] p-0.5 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer transition-all
                                ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                                ${inDragRange ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 ring-inset' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                              onMouseDown={() => {
                                if (!schedule) {
                                  handleDragStart(dateStr, shift.id);
                                }
                              }}
                              onMouseEnter={() => handleDragMove(dateStr, shift.id)}
                              onClick={() => {
                                if (!isDragging && schedule) {
                                  handleCellClick(day, shift, schedule);
                                }
                              }}
                            >
                              {schedule ? (
                                <div 
                                  className={`h-full rounded p-1 ${statusColors[schedule.status]?.bg} ${statusColors[schedule.status]?.text} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                                  title={`${statusColors[schedule.status]?.label}${schedule.product_name ? ` - ${schedule.product_name}` : ''}`}
                                >
                                  <div className="font-semibold text-[10px] leading-tight">{statusColors[schedule.status]?.label}</div>
                                  {schedule.product_name && (
                                    <div className="text-[9px] mt-0.5 opacity-90 line-clamp-2 leading-tight">
                                      {schedule.product_name}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className={`h-full flex items-center justify-center text-gray-300 dark:text-gray-600 ${inDragRange ? 'opacity-0' : ''}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Regular Grid View - Week/Month - Contained */
          <div className="relative w-full" style={{ contain: 'inline-size' }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <table className="w-full border-collapse" style={{ minWidth: `${100 + days.length * 80}px`, tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-r border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">
                        Shift
                      </th>
                      {days.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <th 
                            key={i} 
                            className={`w-20 px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0
                              ${isWeekend ? 'bg-gray-100 dark:bg-gray-700' : ''}
                              ${isToday ? '!bg-blue-100 dark:!bg-blue-900/30' : ''}`}
                          >
                            <div>{dayNames[day.getDay()]}</div>
                            <div className={`font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {day.getDate()}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.filter(s => s.is_active).map((shift) => (
                      <tr key={shift.id}>
                        <td className="w-24 px-2 py-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 z-10">
                          <div className="text-xs font-semibold">{shift.name}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{shift.start_time.slice(0,5)}</div>
                        </td>
                        {days.map((day, i) => {
                          const schedule = getScheduleForDay(day, shift.id);
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          
                          return (
                            <td 
                              key={i} 
                              className={`w-20 h-14 p-0.5 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0
                                ${isWeekend ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                              onClick={() => handleCellClick(day, shift, schedule)}
                            >
                              {schedule ? (
                                <div 
                                  className={`h-full rounded p-1 text-xs ${statusColors[schedule.status]?.bg} ${statusColors[schedule.status]?.text}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellClick(day, shift, schedule);
                                  }}
                                  title={schedule.product_name ? `Produk: ${schedule.product_name}` : ''}
                                >
                                  <div className="font-semibold text-[10px]">{statusColors[schedule.status]?.label}</div>
                                  {schedule.product_name && (
                                    <div className="text-[9px] opacity-90 line-clamp-2 leading-tight" title={schedule.product_name}>
                                      {schedule.product_name}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
          Pilih asset untuk melihat jadwal produksi
        </div>
      )}

      {/* Single Entry Modal (Create/Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowModal(false); setEditingSchedule(null); }} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSchedule ? 'Edit Jadwal Produksi' : 'Tambah Jadwal Produksi'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingSchedule(null); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
                  <select
                    value={formData.shift_pattern_id}
                    onChange={(e) => setFormData({ ...formData, shift_pattern_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Pilih Shift</option>
                    {shifts.filter(s => s.is_active).map((shift) => (
                      <option key={shift.id} value={shift.id}>{shift.name} ({shift.start_time} - {shift.end_time})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="scheduled">Produksi (Scheduled)</option>
                    <option value="no_order">No Order</option>
                    <option value="holiday">Holiday</option>
                    <option value="maintenance_window">Maintenance Window</option>
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="Contoh: Cup 120ml, Tray Food Grade, dll"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className={`flex ${editingSchedule ? 'justify-between' : 'justify-end'} gap-3 pt-4 border-t border-gray-200 dark:border-gray-700`}>
                  {/* Delete button - only show when editing */}
                  {editingSchedule && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setEditingSchedule(null); }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingSchedule ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && editingSchedule && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus Jadwal?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Jadwal untuk tanggal <strong>{new Date(editingSchedule.date).toLocaleDateString('id-ID')}</strong> akan dihapus permanen.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    disabled={deleting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteSchedule}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menghapus...
                      </>
                    ) : (
                      'Hapus'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Entry Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowBulkModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Buat Jadwal Bulk</h2>
                <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={bulkFormData.start_date}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={bulkFormData.end_date}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Pola Mingguan</label>
                  <div className="space-y-2">
                    {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((dayName, index) => {
                      const dayPattern = bulkFormData.pattern.find(p => p.day_of_week === index);
                      const patternIndex = bulkFormData.pattern.findIndex(p => p.day_of_week === index);
                      const isProduction = dayPattern?.status === 'scheduled';
                      
                      return (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                          <div className="flex items-center gap-4">
                            <span className="w-20 font-medium text-gray-900 dark:text-white">{dayName}</span>
                            <select
                              value={dayPattern?.status || 'scheduled'}
                              onChange={(e) => {
                                const newPattern = [...bulkFormData.pattern];
                                newPattern[patternIndex] = { ...newPattern[patternIndex], status: e.target.value };
                                setBulkFormData({ ...bulkFormData, pattern: newPattern });
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="scheduled">Produksi</option>
                              <option value="no_order">No Order</option>
                              <option value="holiday">Holiday</option>
                              <option value="maintenance_window">PM Window</option>
                            </select>
                            <select
                              value={dayPattern?.shift_pattern_id || ''}
                              onChange={(e) => {
                                const newPattern = [...bulkFormData.pattern];
                                newPattern[patternIndex] = { ...newPattern[patternIndex], shift_pattern_id: e.target.value };
                                setBulkFormData({ ...bulkFormData, pattern: newPattern });
                              }}
                              className="w-40 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Semua Shift</option>
                              {shifts.filter(s => s.is_active).map((shift) => (
                                <option key={shift.id} value={shift.id}>{shift.name}</option>
                              ))}
                            </select>
                          </div>
                          {isProduction && (
                            <div className="flex items-center gap-4 ml-24">
                              <input
                                type="text"
                                value={dayPattern?.product_name || ''}
                                onChange={(e) => {
                                  const newPattern = [...bulkFormData.pattern];
                                  newPattern[patternIndex] = { ...newPattern[patternIndex], product_name: e.target.value };
                                  setBulkFormData({ ...bulkFormData, pattern: newPattern });
                                }}
                                placeholder="Nama Produk (opsional)"
                                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Buat Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Range Modal (for drag multi-day) */}
      {showRangeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowRangeModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Buat Jadwal Range</h2>
                <button onClick={() => setShowRangeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRangeSubmit} className="p-6 space-y-4">
                {/* Date Range Display */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium">Periode Jadwal</div>
                      <div className="text-sm">
                        {new Date(rangeFormData.start_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(rangeFormData.end_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <span className="ml-2 text-xs opacity-75">
                          ({Math.ceil((new Date(rangeFormData.end_date).getTime() - new Date(rangeFormData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} hari)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shift Display */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Shift</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {shifts.find(s => s.id.toString() === rangeFormData.shift_pattern_id)?.name || 'Semua Shift'}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={rangeFormData.status}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="scheduled">Produksi (Scheduled)</option>
                    <option value="no_order">No Order</option>
                    <option value="holiday">Holiday</option>
                    <option value="maintenance_window">Maintenance Window</option>
                  </select>
                </div>

                {/* Product Name - only show for scheduled status */}
                {rangeFormData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      value={rangeFormData.product_name}
                      onChange={(e) => setRangeFormData({ ...rangeFormData, product_name: e.target.value })}
                      placeholder="Contoh: Cup 120ml, Tray Food Grade, dll"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Nama produk yang sama akan diterapkan ke semua hari dalam range
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                  <textarea
                    value={rangeFormData.notes}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, notes: e.target.value })}
                    rows={2}
                    placeholder="Catatan tambahan (opsional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowRangeModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Buat Jadwal
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

