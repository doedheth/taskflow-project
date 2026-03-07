import { generateTimelineStructuredPDF } from '../utils/pdfGenerators';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { epicsAPI, ticketsAPI } from '../services/api';
import { Epic, Ticket } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bug,
  CheckSquare,
  BookOpen,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Download, // Added Download icon
} from 'lucide-react';
import toast from 'react-hot-toast';

const typeIcons: Record<string, any> = {
  epic: Zap,
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
};

const typeColors: Record<string, string> = {
  epic: 'bg-purple-500',
  bug: 'bg-red-500',
  task: 'bg-blue-500',
  story: 'bg-green-500',
};

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
};

interface TimelineItem {
  id: number;
  ticket_key: string;
  title: string;
  type: string;
  status: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  children?: TimelineItem[];
  isExpanded?: boolean;
  progress?: number;
}

export default function Timeline() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set());
  const [viewRange, setViewRange] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string>('all');
  const [itemColumnWidth, setItemColumnWidth] = useState(320);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setIsLoading(true);
    try {
      const [epicsRes, ticketsRes] = await Promise.all([
        epicsAPI.getAll(),
        ticketsAPI.getAll(),
      ]);

      const epics = epicsRes.data;
      const tickets = ticketsRes.data.filter((t: Ticket) => t.type !== 'epic');

      // Group tickets by epic
      const epicItems: TimelineItem[] = epics.map((epic: Epic) => ({
        id: epic.id,
        ticket_key: epic.ticket_key,
        title: epic.title,
        type: 'epic',
        status: epic.status,
        start_date: epic.created_at,
        end_date: epic.due_date,
        due_date: epic.due_date,
        assignee_name: epic.assignee_name,
        assignee_avatar: epic.assignee_avatar,
        progress: epic.progress,
        children: tickets
          .filter((t: Ticket) => t.epic_id === epic.id)
          .map((t: Ticket) => ({
            id: t.id,
            ticket_key: t.ticket_key,
            title: t.title,
            type: t.type,
            status: t.status,
            start_date: t.created_at,
            end_date: t.due_date,
            due_date: t.due_date,
            assignee_name: t.assignee_name,
            assignee_avatar: t.assignee_avatar,
          })),
      }));

      // Standalone tickets (not in any epic)
      const standaloneTickets: TimelineItem[] = tickets
        .filter((t: Ticket) => !t.epic_id)
        .map((t: Ticket) => ({
          id: t.id,
          ticket_key: t.ticket_key,
          title: t.title,
          type: t.type,
          status: t.status,
          start_date: t.created_at,
          end_date: t.due_date,
          due_date: t.due_date,
          assignee_name: t.assignee_name,
          assignee_avatar: t.assignee_avatar,
        }));

      setItems([...epicItems, ...standaloneTickets]);
    } catch (error) {
      console.error('Failed to fetch timeline data:', error);
      toast.error('Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEpicExpand = (epicId: number) => {
    setExpandedEpics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  };

  // Calculate date range for timeline
  const dateRange = useMemo(() => {
    const today = currentDate;
    let start: Date, end: Date;
    
    if (viewRange === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (viewRange === 'quarter') {
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
    } else {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }
    
    return { start, end };
  }, [currentDate, viewRange]);

  // Generate columns for timeline header
  const timelineColumns = useMemo(() => {
    const columns: { date: Date; label: string }[] = [];
    const { start, end } = dateRange;
    
    if (viewRange === 'month') {
      // Daily columns
      const current = new Date(start);
      while (current <= end) {
        columns.push({
          date: new Date(current),
          label: current.getDate().toString(),
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (viewRange === 'quarter') {
      // Weekly columns
      const current = new Date(start);
      while (current <= end) {
        const weekStart = new Date(current);
        columns.push({
          date: weekStart,
          label: `${weekStart.getDate()} ${weekStart.toLocaleString('default', { month: 'short' })}`,
        });
        current.setDate(current.getDate() + 7);
      }
    } else {
      // Monthly columns
      const current = new Date(start);
      while (current <= end) {
        columns.push({
          date: new Date(current),
          label: current.toLocaleString('default', { month: 'short' }),
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return columns;
  }, [dateRange, viewRange]);

  // Calculate bar position for an item
  const getBarStyle = (item: TimelineItem) => {
    const { start: rangeStart, end: rangeEnd } = dateRange;
    const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const itemStart = item.start_date ? new Date(item.start_date) : new Date();
    const itemEnd = item.end_date || item.due_date ? new Date(item.end_date || item.due_date!) : new Date(itemStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Clamp to visible range
    const visibleStart = Math.max(itemStart.getTime(), rangeStart.getTime());
    const visibleEnd = Math.min(itemEnd.getTime(), rangeEnd.getTime());
    
    if (visibleEnd < rangeStart.getTime() || visibleStart > rangeEnd.getTime()) {
      return null; // Item is outside visible range
    }
    
    const startOffset = (visibleStart - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (visibleEnd - visibleStart) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 2); // Minimum 2% width
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewRange === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else if (viewRange === 'quarter') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
      } else {
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateTimelineStructuredPDF(items);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return items;
    if (filterType === 'epics') return items.filter((item) => item.type === 'epic');
    return items.filter((item) => item.type !== 'epic');
  }, [items, filterType]);

  const getPeriodLabel = () => {
    if (viewRange === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (viewRange === 'quarter') {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  // Check if today is visible
  const todayPosition = useMemo(() => {
    const today = new Date();
    const { start, end } = dateRange;
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (today < start || today > end) return null;
    
    const offset = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return `${(offset / totalDays) * 100}%`;
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`p-6 h-full flex flex-col ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Calendar className="w-7 h-7 text-blue-500" />
            Timeline
          </h1>
          <p className={`mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Visualize your project roadmap</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary"
            disabled={isGeneratingPDF}
          >
            <Download className="w-4 h-4" /> {/* Added Download icon */}
            Export PDF
          </button>
          {/* Filter */}
          <div className={`flex items-center gap-1 rounded-lg p-1 ${isDark ? 'bg-dark-800/50' : 'bg-gray-100'}`}>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('epics')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'epics' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Epics
            </button>
            <button
              onClick={() => setFilterType('tickets')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'tickets' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tickets
            </button>
          </div>

          {/* View Range */}
          <div className={`flex items-center gap-1 rounded-lg p-1 ${isDark ? 'bg-dark-800/50' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewRange('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewRange === 'month' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewRange('quarter')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewRange === 'quarter' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setViewRange('year')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewRange === 'year' 
                  ? isDark ? 'bg-dark-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Year
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigatePeriod('prev')}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              Today
            </button>
            <button
              onClick={() => navigatePeriod('next')}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Period Label */}
          <div className={`px-4 py-2 rounded-lg font-medium min-w-[140px] text-center ${isDark ? 'bg-dark-800/50 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
            {getPeriodLabel()}
          </div>
        </div>
      </div>

      {/* Timeline Container - Scrollable both directions */}
      <div className={`flex-1 rounded-xl border overflow-hidden ${isDark ? 'bg-dark-800/30 border-dark-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="h-full overflow-auto">
          {/* Inner container with min-width for horizontal scroll */}
          <div style={{ minWidth: `${itemColumnWidth + 800}px` }}>
            {/* Timeline Header - Sticky */}
            <div className={`flex border-b sticky top-0 z-10 ${isDark ? 'border-dark-700/50 bg-dark-900' : 'border-gray-200 bg-white'}`}>
              {/* Items Column Header */}
              <div 
                className={`flex-shrink-0 px-4 py-3 border-r flex items-center justify-between ${isDark ? 'bg-dark-800 border-dark-700/50' : 'bg-gray-50 border-gray-200'}`}
                style={{ width: itemColumnWidth }}
              >
                <span className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Item</span>
                {/* Width adjuster buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setItemColumnWidth(prev => Math.max(200, prev - 40))}
                    className={`p-1 rounded text-xs ${isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="Decrease width"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setItemColumnWidth(prev => Math.min(600, prev + 40))}
                    className={`p-1 rounded text-xs ${isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="Increase width"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Timeline Columns Header */}
              <div className="flex-1 flex">
                {timelineColumns.map((col, index) => (
                  <div
                    key={index}
                    className={`flex-1 min-w-[60px] px-2 py-3 text-center text-xs border-r last:border-r-0 ${isDark ? 'text-dark-400 border-dark-700/30' : 'text-gray-500 border-gray-200'}`}
                  >
                    {col.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body */}
            <div>
              {filteredItems.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-64 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <Calendar className="w-12 h-12 mb-3 opacity-50" />
                  <p>No items to display</p>
                  <p className="text-sm mt-1">Create tickets with due dates to see them on the timeline</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={`${item.type}-${item.id}`}>
                    {/* Item Row */}
                    <div className={`flex border-b group ${isDark ? 'border-dark-700/30 hover:bg-dark-800/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                      {/* Item Info */}
                      <div 
                        className={`flex-shrink-0 px-4 py-3 border-r flex items-center gap-3 ${isDark ? 'border-dark-700/50' : 'border-gray-200'}`}
                        style={{ width: itemColumnWidth }}
                      >
                        {item.type === 'epic' && item.children && item.children.length > 0 && (
                          <button
                            onClick={() => toggleEpicExpand(item.id)}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
                          >
                            {expandedEpics.has(item.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {item.type !== 'epic' || !item.children?.length ? (
                          <div className="w-6 flex-shrink-0" />
                        ) : null}
                        
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${typeColors[item.type]}`}>
                          {(() => {
                            const Icon = typeIcons[item.type];
                            return <Icon className="w-3 h-3 text-white" />;
                          })()}
                        </div>
                        
                        <Link
                          to={item.type === 'epic' ? `/epics/${item.id}` : `/tickets/${item.id}`}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono flex-shrink-0 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{item.ticket_key}</span>
                            <span className={`text-sm truncate hover:text-blue-400 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.title}
                            </span>
                          </div>
                        </Link>
                        
                        {item.assignee_name && (
                          <div className="flex-shrink-0">
                            {item.assignee_avatar ? (
                              <img
                                src={item.assignee_avatar}
                                alt={item.assignee_name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs text-white font-medium">
                                {item.assignee_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Timeline Bar */}
                      <div className="flex-1 relative py-3">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {timelineColumns.map((_, index) => (
                            <div
                              key={index}
                              className={`flex-1 min-w-[60px] border-r last:border-r-0 ${isDark ? 'border-dark-700/20' : 'border-gray-100'}`}
                            />
                          ))}
                        </div>
                        
                        {/* Today indicator */}
                        {todayPosition && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: todayPosition }}
                          />
                        )}
                        
                        {/* Item bar */}
                        {(() => {
                          const style = getBarStyle(item);
                          if (!style) return null;
                          
                          return (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md ${statusColors[item.status]} 
                                ${item.type === 'epic' ? 'opacity-90' : 'opacity-75'}
                                hover:opacity-100 transition-opacity cursor-pointer group/bar`}
                              style={style}
                              title={`${item.ticket_key}: ${item.title}`}
                            >
                              {/* Progress indicator for epics */}
                              {item.type === 'epic' && item.progress !== undefined && (
                                <div
                                  className="absolute inset-y-0 left-0 bg-white/20 rounded-l-md"
                                  style={{ width: `${item.progress}%` }}
                                />
                              )}
                              
                              {/* Label (visible on hover or if wide enough) */}
                              <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                                <span className="text-xs text-white font-medium truncate opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                  {item.ticket_key}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Expanded Children */}
                    {item.type === 'epic' && expandedEpics.has(item.id) && item.children?.map((child) => (
                      <div
                        key={`child-${child.id}`}
                        className={`flex border-b ${isDark ? 'border-dark-700/30 hover:bg-dark-800/30 bg-dark-900/30' : 'border-gray-100 hover:bg-gray-50 bg-gray-50/50'}`}
                      >
                        {/* Child Item Info */}
                        <div 
                          className={`flex-shrink-0 px-4 py-2 border-r flex items-center gap-3 ${isDark ? 'border-dark-700/50' : 'border-gray-200'}`}
                          style={{ width: itemColumnWidth, paddingLeft: '3.5rem' }}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${typeColors[child.type]}`}>
                            {(() => {
                              const Icon = typeIcons[child.type];
                              return <Icon className="w-2.5 h-2.5 text-white" />;
                            })()}
                          </div>
                          
                          <Link
                            to={`/tickets/${child.id}`}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono flex-shrink-0 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{child.ticket_key}</span>
                              <span className={`text-sm truncate hover:text-blue-400 transition-colors ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>
                                {child.title}
                              </span>
                            </div>
                          </Link>
                          
                          {child.assignee_name && (
                            <div className="flex-shrink-0">
                              {child.assignee_avatar ? (
                                <img
                                  src={child.assignee_avatar}
                                  alt={child.assignee_name}
                                  className="w-5 h-5 rounded-full"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs text-white font-medium">
                                  {child.assignee_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Child Timeline Bar */}
                        <div className="flex-1 relative py-2">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {timelineColumns.map((_, index) => (
                              <div
                                key={index}
                                className={`flex-1 min-w-[60px] border-r last:border-r-0 ${isDark ? 'border-dark-700/20' : 'border-gray-100'}`}
                              />
                            ))}
                          </div>
                          
                          {/* Today indicator */}
                          {todayPosition && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                              style={{ left: todayPosition }}
                            />
                          )}
                          
                          {/* Child bar */}
                          {(() => {
                            const style = getBarStyle(child);
                            if (!style) return null;
                            
                            return (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-5 rounded ${statusColors[child.status]} opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}
                                style={style}
                                title={`${child.ticket_key}: ${child.title}`}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-4 ${isDark ? '' : 'text-gray-600'}`}>
        <div className="flex flex-wrap items-center gap-4">
          <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Status:</span>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className={`text-xs capitalize ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Type:</span>
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded flex items-center justify-center ${color}`}>
                {(() => {
                  const Icon = typeIcons[type];
                  return <Icon className="w-2.5 h-2.5 text-white" />;
                })()}
              </div>
              <span className={`text-xs capitalize ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
