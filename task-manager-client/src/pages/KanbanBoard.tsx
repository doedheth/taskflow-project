import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Native HTML5 drag and drop is used instead of @dnd-kit
import { ticketsAPI, sprintsAPI } from '../services/api';
import { Ticket, Assignee } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Bug,
  CheckSquare,
  BookOpen,
  Zap,
  MessageSquare,
  Calendar,
  Plus,
  GripVertical,
  Search,
  Filter,
  X,
  ChevronDown,
  Users,
  Play,
  AlertCircle,
  ArrowRight,
  Layers,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreateTicketModal from '../components/CreateTicketModal';
import AssigneeAvatars from '../components/AssigneeAvatars';

interface Sprint {
  id: number;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  start_date?: string;
  end_date?: string;
  ticket_count?: number;
}

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
  epic: Zap,
};

const statusColumns = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const priorityColumns = [
  { id: 'low', title: 'Low', color: 'bg-gray-500' },
  { id: 'medium', title: 'Medium', color: 'bg-yellow-500' },
  { id: 'high', title: 'High', color: 'bg-orange-500' },
  { id: 'critical', title: 'Critical', color: 'bg-red-500' },
];

// Column IDs are generated dynamically based on groupBy mode

interface ColumnProps {
  column: { id: string; title: string; color: string };
  tickets: Ticket[];
  onDrop?: (ticketId: number, columnId: string) => void;
  onTicketSprintChange?: (ticket: Ticket) => void;
}

function Column({ column, tickets, onDrop, onTicketSprintChange }: ColumnProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isDragOver, setIsDragOver] = useState(false);

  const showHighlight = isDragOver;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const ticketId = parseInt(e.dataTransfer.getData('ticketId'));
    if (ticketId && onDrop) {
      onDrop(ticketId, column.id);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-all duration-200 ${
        showHighlight 
          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 scale-[1.02]' 
          : isDark ? 'bg-dark-900/30 border-dark-800/50' : 'bg-gray-50 border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-4 border-b transition-colors ${
        showHighlight ? 'border-blue-500/50 bg-blue-500/5' : isDark ? 'border-dark-800/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${column.color} ${showHighlight ? 'animate-pulse' : ''}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{column.title}</h3>
          <span className={`ml-auto text-sm px-2 py-0.5 rounded-full transition-colors ${
            showHighlight ? 'bg-blue-500/20 text-blue-400' : isDark ? 'bg-dark-800 text-dark-400' : 'bg-gray-200 text-gray-600'
          }`}>
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className={`flex-1 p-3 space-y-3 min-h-[200px] transition-colors ${
        showHighlight ? 'bg-blue-500/5' : ''
      }`}>
        {tickets.length === 0 ? (
          <div className={`h-full min-h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
            showHighlight 
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 scale-[1.02]' 
              : isDark ? 'border-dark-700 text-dark-600' : 'border-gray-300 text-gray-400'
          }`}>
            <span className="text-2xl mb-2">{showHighlight ? '📥' : '📋'}</span>
            {showHighlight ? 'Release to drop here!' : 'Drop tickets here'}
          </div>
        ) : (
          <>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onSprintChange={onTicketSprintChange} />
            ))}
            {showHighlight && (
              <div className="h-24 border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/10 flex flex-col items-center justify-center text-blue-400 text-sm animate-pulse">
                <span className="text-xl mb-1">📥</span>
                Release to drop here
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  onDragStart?: () => void;
  onSprintChange?: (ticket: Ticket) => void;
}

function TicketCard({ ticket, onDragStart, onSprintChange }: TicketCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const Icon = typeIcons[ticket.type] || CheckSquare;

  return (
    <div
      className={`rounded-xl p-4 border transition-all group ${isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('ticketId', String(ticket.id));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1 cursor-grab ${isDark ? 'text-dark-600 hover:text-dark-400' : 'text-gray-400 hover:text-gray-600'}`}>
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className={`badge badge-${ticket.type} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{ticket.ticket_key}</span>
            </div>
            {/* Sprint change button */}
            {onSprintChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSprintChange(ticket);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                title="Ubah Sprint"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <Link
            to={`/tickets/${ticket.id}`}
            className={`font-medium hover:text-blue-400 transition-colors line-clamp-2 block ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {ticket.title}
          </Link>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {/* Priority indicator */}
              <span
                className={`w-2 h-2 rounded-full ${
                  ticket.priority === 'critical' ? 'bg-red-500' :
                  ticket.priority === 'high' ? 'bg-orange-500' :
                  ticket.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-slate-500'
                }`}
                title={ticket.priority}
              />
              
              {/* Comments count */}
              {(ticket.comment_count ?? 0) > 0 && (
                <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <MessageSquare className="w-3 h-3" />
                  {ticket.comment_count}
                </span>
              )}

              {/* Due date */}
              {ticket.due_date && (
                <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(ticket.due_date), 'MMM d')}
                </span>
              )}
            </div>

            {/* Assignees */}
            <AssigneeAvatars assignees={ticket.assignees || []} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [selectedTicketForSprint, setSelectedTicketForSprint] = useState<Ticket | null>(null);
  const sprintSelectorRef = useRef<HTMLDivElement>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [groupBy, setGroupBy] = useState<'status' | 'assignee' | 'priority'>('status');
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      // Only close group dropdown if clicking outside AND dropdown is open
      if (showGroupDropdown && groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setShowGroupDropdown(false);
      }
      if (showUserDropdown) {
        const clickedInButton = userDropdownRef.current && userDropdownRef.current.contains(event.target as Node);
        const clickedInMenu = userDropdownMenuRef.current && userDropdownMenuRef.current.contains(event.target as Node);
        if (!clickedInButton && !clickedInMenu) {
          setShowUserDropdown(false);
        }
      }
      if (sprintSelectorRef.current && !sprintSelectorRef.current.contains(event.target as Node)) {
        setShowSprintSelector(false);
        setSelectedTicketForSprint(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGroupDropdown, showUserDropdown]);

  const loadData = async () => {
    try {
      const [ticketsRes, sprintsRes] = await Promise.all([
        ticketsAPI.getAll(),
        sprintsAPI.getAll()
      ]);
      
      setSprints(sprintsRes.data);
      
      // Find active sprint
      const active = sprintsRes.data.find((s: Sprint) => s.status === 'active');
      setActiveSprint(active || null);
      
      // Filter tickets by active sprint
      if (active) {
        const sprintTickets = ticketsRes.data.filter((t: Ticket) => t.sprint_id === active.id);
        setTickets(sprintTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle changing ticket's sprint
  const handleChangeTicketSprint = async (ticket: Ticket, newSprintId: number | null) => {
    try {
      if (ticket.sprint_id) {
        // Remove from current sprint
        await sprintsAPI.removeTicket(ticket.sprint_id, ticket.id);
      }
      
      if (newSprintId) {
        // Add to new sprint
        await sprintsAPI.addTicket(newSprintId, ticket.id);
      }
      
      toast.success(newSprintId 
        ? `Tiket dipindahkan ke ${sprints.find(s => s.id === newSprintId)?.name}` 
        : 'Tiket dipindahkan ke Backlog'
      );
      
      // Reload data
      await loadData();
      setShowSprintSelector(false);
      setSelectedTicketForSprint(null);
    } catch (error) {
      console.error('Failed to change sprint:', error);
      toast.error('Gagal mengubah sprint tiket');
    }
  };

  // Start a sprint
  const handleStartSprint = async (sprintId: number) => {
    try {
      const response = await sprintsAPI.start(sprintId);
      const data = response.data;
      
      if (data.migrated_tickets > 0) {
        toast.success(
          `🚀 Sprint dimulai! ${data.migrated_tickets} tiket dari sprint sebelumnya dipindahkan otomatis.`,
          { duration: 5000 }
        );
      } else {
        toast.success('🚀 Sprint dimulai!');
      }
      
      await loadData();
    } catch (error: any) {
      console.error('Failed to start sprint:', error);
      toast.error(error.response?.data?.error || 'Gagal memulai sprint');
    }
  };

  // Get dynamic columns based on groupBy
  const getColumns = () => {
    switch (groupBy) {
      case 'priority':
        return priorityColumns;
      case 'assignee':
        // Create columns for each unique assignee + unassigned
        const assigneeColumns = [
          { id: 'assignee_unassigned', title: 'Unassigned', color: 'bg-gray-500' }
        ];
        const seenAssignees = new Set<number>();
        tickets.forEach(ticket => {
          ticket.assignees?.forEach(assignee => {
            if (!seenAssignees.has(assignee.id)) {
              seenAssignees.add(assignee.id);
              assigneeColumns.push({
                id: `assignee_${assignee.id}`,
                title: assignee.name,
                color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'][assignee.id % 6]
              });
            }
          });
        });
        return assigneeColumns;
      default:
        return statusColumns;
    }
  };

  const columns = getColumns();

  // Get tickets for a column based on groupBy
  const getTicketsByColumn = (columnId: string) => {
    switch (groupBy) {
      case 'priority':
        return filteredTickets.filter(t => t.priority === columnId);
      case 'assignee':
        if (columnId === 'assignee_unassigned') {
          return filteredTickets.filter(t => !t.assignees || t.assignees.length === 0);
        }
        const assigneeId = parseInt(columnId.replace('assignee_', ''));
        return filteredTickets.filter(t => t.assignees?.some(a => a.id === assigneeId));
      default:
        return filteredTickets.filter(t => t.status === columnId);
    }
  };

  // Native HTML5 drag and drop handler
  const handleNativeDrop = async (ticketId: number, targetColumnId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    // Handle different groupBy scenarios
    if (groupBy === 'status') {
      if (ticket.status === targetColumnId) return;

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: targetColumnId as Ticket['status'] } : t
        )
      );

      try {
        await ticketsAPI.updateStatus(ticketId, targetColumnId);
        toast.success(`Moved to ${columns.find(c => c.id === targetColumnId)?.title}`);
      } catch (error) {
        // Revert on error
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: ticket.status } : t
          )
        );
        toast.error('Failed to update status');
      }
    } else if (groupBy === 'priority') {
      if (ticket.priority === targetColumnId) return;

      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, priority: targetColumnId as Ticket['priority'] } : t
        )
      );

      try {
        await ticketsAPI.update(ticketId, { priority: targetColumnId });
        toast.success(`Priority changed to ${columns.find(c => c.id === targetColumnId)?.title}`);
      } catch (error) {
        // Revert on error
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, priority: ticket.priority } : t
          )
        );
        toast.error('Failed to update priority');
      }
    } else if (groupBy === 'assignee') {
      // For assignee grouping, show info message (complex to change assignees via drag)
      toast('To change assignees, edit the ticket directly', { icon: 'ℹ️' });
    }
  };

  // Filter tickets based on all filters
  const filteredTickets = tickets.filter((ticket) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        ticket.title.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.id.toString().includes(query);
      if (!matchesSearch) return false;
    }

    // Assignee filter
    if (selectedAssignees.length > 0) {
      const ticketAssigneeIds = ticket.assignees?.map(a => a.id) || [];
      const hasSelectedAssignee = selectedAssignees.some(id => ticketAssigneeIds.includes(id));
      if (!hasSelectedAssignee) return false;
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(ticket.type)) {
      return false;
    }

    // Priority filter
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(ticket.priority)) {
      return false;
    }

    return true;
  });

  // getTicketsByStatus is now replaced by getTicketsByColumn above

  const toggleAssigneeFilter = (userId: number) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const togglePriorityFilter = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedAssignees([]);
    setSelectedTypes([]);
    setSelectedPriorities([]);
  };

  const hasActiveFilters = searchQuery || selectedAssignees.length > 0 || selectedTypes.length > 0 || selectedPriorities.length > 0;

  // Get unique assignees from all tickets
  const getActiveAssignees = () => {
    const assigneeMap = new Map<number, Assignee>();
    tickets.forEach(ticket => {
      ticket.assignees?.forEach(assignee => {
        if (!assigneeMap.has(assignee.id)) {
          assigneeMap.set(assignee.id, assignee);
        }
      });
    });
    return Array.from(assigneeMap.values());
  };

  const activeAssignees = getActiveAssignees();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const typeColors: Record<string, string> = {
    bug: 'bg-red-500',
    task: 'bg-blue-500',
    story: 'bg-green-500',
    epic: 'bg-purple-500',
  };

  // Get planning sprints (can be started)
  const planningSprints = sprints.filter(s => s.status === 'planning');

  // No Active Sprint View
  if (!activeSprint) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kanban Board</h1>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Sprint-based task management</p>
          </div>
        </div>

        {/* No Active Sprint Message */}
        <div className={`flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed ${isDark ? 'border-dark-700 bg-dark-900/30' : 'border-gray-300 bg-gray-50'}`}>
          <div className="text-center max-w-md p-8">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Play className={`w-10 h-10 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tidak Ada Sprint Aktif
            </h2>
            <p className={`mb-6 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Board hanya menampilkan tiket dari sprint yang sedang berjalan. Mulai sprint untuk melihat tiket di sini.
            </p>

            {planningSprints.length > 0 ? (
              <div className="space-y-3">
                <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                  Sprint yang siap dimulai:
                </p>
                <div className="space-y-2">
                  {planningSprints.map(sprint => (
                    <div
                      key={sprint.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                          <Layers className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{sprint.name}</p>
                          <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {sprint.ticket_count || 0} tiket • {sprint.start_date ? format(new Date(sprint.start_date), 'dd MMM') : 'No date'} - {sprint.end_date ? format(new Date(sprint.end_date), 'dd MMM') : 'No date'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartSprint(sprint.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Mulai
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <p className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    Belum ada sprint yang dibuat
                  </p>
                </div>
                <p className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                  Buat sprint baru dan tambahkan tiket ke dalamnya.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                to="/sprints"
                className="btn btn-primary"
              >
                <Layers className="w-4 h-4" />
                Kelola Sprint
              </Link>
              <button
                onClick={() => navigate('/tickets')}
                className={`btn ${isDark ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Lihat Semua Tiket
              </button>
            </div>
          </div>
        </div>

        {showCreateModal && (
          <CreateTicketModal
            onClose={() => setShowCreateModal(false)}
            onCreated={loadData}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Kanban Board</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {activeSprint.name}
            </span>
            {activeSprint.end_date && (
              <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                Ends {format(new Date(activeSprint.end_date), 'dd MMM')}
              </span>
            )}
            <Link
              to={`/sprints/${activeSprint.id}`}
              className={`text-xs hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              Detail Sprint →
            </Link>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary !py-2 !px-3 md:!px-4"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </button>
      </div>

      {/* Filter Bar Wrapper - to allow dropdown overflow */}
      <div className="relative mb-3 md:mb-4 flex gap-2">
        {/* Filter Bar - Scrollable on mobile */}
        <div className={`flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border overflow-x-auto scrollbar-hide ${isDark ? 'bg-dark-900/50 border-dark-800/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-3 py-2 w-32 md:w-48 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
          </div>

          {/* Divider */}
          <div className={`w-px h-8 flex-shrink-0 hidden md:block ${isDark ? 'bg-dark-700' : 'bg-gray-300'}`}></div>

          {/* User Dropdown Filter - Button only, dropdown rendered outside */}
          <div className="flex-shrink-0" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedAssignees.length > 0
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : isDark ? 'bg-dark-800 border-dark-700 text-dark-300 hover:bg-dark-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">User</span>
              {selectedAssignees.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedAssignees.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Divider */}
          <div className={`w-px h-8 flex-shrink-0 hidden md:block ${isDark ? 'bg-dark-700' : 'bg-gray-300'}`}></div>

          {/* Filter Button */}
          <div className="flex-shrink-0" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedTypes.length > 0 || selectedPriorities.length > 0
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : isDark ? 'bg-dark-800 border-dark-700 text-dark-300 hover:bg-dark-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {(selectedTypes.length + selectedPriorities.length) > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedTypes.length + selectedPriorities.length}
                </span>
              )}
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1 min-w-2"></div>

          {/* Results count */}
          <div className={`text-xs md:text-sm flex-shrink-0 whitespace-nowrap ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {filteredTickets.length}/{tickets.length}
          </div>

        </div>

        {/* Group By Button - Desktop only (Outside scrollable area) */}
        <div className="relative hidden lg:block flex-shrink-0" ref={groupDropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowGroupDropdown(prev => !prev);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-colors ${isDark ? 'bg-dark-900/50 border-dark-800/50 text-dark-300 hover:bg-dark-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
          >
            Group: <span className={`capitalize font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{groupBy}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Group By Dropdown Menu */}
          {showGroupDropdown && (
            <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl z-[100] overflow-hidden border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
              <div className="p-2">
                <h4 className={`text-xs font-semibold uppercase px-2 py-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Group By</h4>
                {(['status', 'assignee', 'priority'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setGroupBy(option);
                      setShowGroupDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                      groupBy === option
                        ? 'bg-blue-500/20 text-blue-400'
                        : isDark ? 'text-dark-300 hover:bg-dark-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                    {groupBy === option && (
                      <span className="ml-auto text-blue-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown - Outside scrollable area */}
        {showUserDropdown && (
          <div 
            ref={userDropdownMenuRef}
            className={`absolute top-full left-[180px] md:left-[220px] mt-2 w-56 rounded-xl shadow-xl z-[100] overflow-hidden border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}
          >
            <div className="p-2">
              <h4 className={`text-xs font-semibold uppercase px-2 py-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Filter by User</h4>
              
              {/* Clear selection */}
              {selectedAssignees.length > 0 && (
                <button
                  onClick={() => setSelectedAssignees([])}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                >
                  <X className="w-4 h-4" />
                  Clear selection
                </button>
              )}

              <div className="max-h-64 overflow-y-auto">
                {activeAssignees.length === 0 ? (
                  <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    No assignees found
                  </div>
                ) : (
                  activeAssignees.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleAssigneeFilter(user.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedAssignees.includes(user.id)
                          ? 'bg-blue-500/20 text-blue-400'
                          : isDark ? 'text-dark-300 hover:bg-dark-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 ${
                        ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'][user.id % 6]
                      }`}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="flex-1 text-left truncate">{user.name}</span>
                      {selectedAssignees.includes(user.id) && (
                        <span className="text-blue-400 flex-shrink-0">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Dropdown - Outside scrollable area */}
        {showFilterDropdown && (
          <div className={`absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:left-[280px] mt-2 w-64 rounded-xl shadow-xl z-[100] overflow-hidden border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
            {/* Type Filter */}
            <div className={`p-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h4 className={`text-xs font-semibold uppercase mb-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Type</h4>
              <div className="flex flex-wrap gap-2">
                {['bug', 'task', 'story', 'epic'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                      selectedTypes.includes(type)
                        ? `${typeColors[type]} text-white`
                        : isDark ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {React.createElement(typeIcons[type], { className: 'w-3 h-3' })}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="p-3">
              <h4 className={`text-xs font-semibold uppercase mb-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Priority</h4>
              <div className="flex flex-wrap gap-2">
                {['low', 'medium', 'high', 'critical'].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => togglePriorityFilter(priority)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                      selectedPriorities.includes(priority)
                        ? `${priorityColors[priority]} text-white`
                        : isDark ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${priorityColors[priority]}`}></span>
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board - Horizontally scrollable on mobile */}
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className={`flex gap-3 md:gap-4 min-h-full min-w-max md:min-w-0 md:grid ${
          columns.length <= 4 ? 'md:grid-cols-4' : 
          columns.length <= 6 ? 'md:grid-cols-6' : 'md:grid-cols-4'
        }`}>
          {columns.map((column) => (
            <div key={column.id} className="w-[280px] md:w-auto flex-shrink-0 md:flex-shrink">
              <Column
                column={column}
                tickets={getTicketsByColumn(column.id)}
                onDrop={handleNativeDrop}
                onTicketSprintChange={(ticket) => {
                  setSelectedTicketForSprint(ticket);
                  setShowSprintSelector(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
      )}

      {/* Sprint Selector Modal */}
      {showSprintSelector && selectedTicketForSprint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={sprintSelectorRef}
            className={`w-full max-w-md mx-4 rounded-2xl border shadow-xl ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pindahkan ke Sprint
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    {selectedTicketForSprint.ticket_key}: {selectedTicketForSprint.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSprintSelector(false);
                    setSelectedTicketForSprint(null);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-dark-700 text-dark-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sprint Options */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {/* Backlog Option */}
                <button
                  onClick={() => handleChangeTicketSprint(selectedTicketForSprint, null)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    !selectedTicketForSprint.sprint_id
                      ? isDark ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-50 border-blue-300'
                      : isDark ? 'border-dark-700 hover:border-dark-600 hover:bg-dark-800' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-500/20' : 'bg-gray-100'}`}>
                    <Layers className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Backlog</p>
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Tidak dalam sprint manapun</p>
                  </div>
                  {!selectedTicketForSprint.sprint_id && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-blue-500/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      Current
                    </span>
                  )}
                </button>

                {/* Sprint Options */}
                {sprints.filter(s => s.status !== 'completed').map((sprint) => (
                  <button
                    key={sprint.id}
                    onClick={() => handleChangeTicketSprint(selectedTicketForSprint, sprint.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      selectedTicketForSprint.sprint_id === sprint.id
                        ? isDark ? 'bg-blue-500/20 border-blue-500' : 'bg-blue-50 border-blue-300'
                        : isDark ? 'border-dark-700 hover:border-dark-600 hover:bg-dark-800' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      sprint.status === 'active'
                        ? isDark ? 'bg-green-500/20' : 'bg-green-100'
                        : isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    }`}>
                      {sprint.status === 'active' ? (
                        <Play className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      ) : (
                        <Clock className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{sprint.name}</p>
                        {sprint.status === 'active' && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        {sprint.start_date ? format(new Date(sprint.start_date), 'dd MMM') : 'No date'} - {sprint.end_date ? format(new Date(sprint.end_date), 'dd MMM') : 'No date'}
                      </p>
                    </div>
                    {selectedTicketForSprint.sprint_id === sprint.id && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-blue-500/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

