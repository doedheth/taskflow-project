import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ticketsAPI, departmentsAPI, usersAPI, sprintsAPI } from '../services/api';
import { Ticket, Department, User, Sprint } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Filter,
  Plus,
  Bug,
  CheckSquare,
  BookOpen,
  Zap,
  MessageSquare,
  Calendar,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import CreateTicketModal from '../components/CreateTicketModal';
import AssigneeAvatars from '../components/AssigneeAvatars';
import AGGridWrapper, { ColDef } from '../components/AGGridWrapper';
import { ICellRendererParams } from 'ag-grid-community';

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
  epic: Zap,
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  done: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function Tickets() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    priority: '',
    department: '',
    assignee: '',
    sprint: '',
  });

  const loadTickets = async () => {
    try {
      const params: Record<string, string | number> = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.department) params.department = parseInt(filters.department);
      if (filters.assignee) params.assignee = parseInt(filters.assignee);
      if (filters.search) params.search = filters.search;
      if (filters.sprint) params.sprint = filters.sprint;

      const response = await ticketsAPI.getAll(params);
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptsRes, usersRes, sprintsRes] = await Promise.all([
          departmentsAPI.getAll(),
          usersAPI.getAll(),
          sprintsAPI.getAll(),
        ]);
        setDepartments(deptsRes.data);
        setUsers(usersRes.data);
        setSprints(sprintsRes.data);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      priority: '',
      department: '',
      assignee: '',
      sprint: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Ticket>[]>(() => [
    {
      field: 'ticket_key',
      headerName: 'Key',
      minWidth: 100,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Ticket>) => (
        <Link
          to={`/tickets/${params.data?.id}`}
          className="text-sm font-mono text-blue-500 hover:text-blue-400"
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      minWidth: 250,
      cellRenderer: (params: ICellRendererParams<Ticket>) => {
        const ticket = params.data;
        if (!ticket) return null;
        return (
          <Link
            to={`/tickets/${ticket.id}`}
            className={`hover:text-blue-500 transition-colors flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <span className="truncate max-w-[300px]">{ticket.title}</span>
            {(ticket.comment_count ?? 0) > 0 && (
              <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>
                <MessageSquare className="w-3 h-3" />
                {ticket.comment_count}
              </span>
            )}
          </Link>
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      minWidth: 100,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Ticket>) => {
        const type = params.value as string;
        const Icon = typeIcons[type] || CheckSquare;
        return (
          <span className={`badge badge-${type} flex items-center gap-1 w-fit`}>
            <Icon className="w-3 h-3" />
            {type}
          </span>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 110,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Ticket>) => {
        const status = params.value as string;
        return (
          <span className={`badge border ${statusColors[status]}`}>
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      field: 'priority',
      headerName: 'Priority',
      minWidth: 100,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Ticket>) => {
        const priority = params.value as string;
        return (
          <span className={`badge border ${priorityColors[priority]}`}>
            {priority}
          </span>
        );
      },
    },
    {
      field: 'assignees',
      headerName: 'Assignees',
      minWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<Ticket>) => (
        <AssigneeAvatars assignees={params.data?.assignees || []} showNames />
      ),
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      minWidth: 130,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<Ticket>) => {
        const dueDate = params.value;
        if (!dueDate) {
          return <span className={`text-sm ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>-</span>;
        }
        return (
          <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(dueDate), 'MMM d, yyyy')}
          </span>
        );
      },
    },
  ], [isDark]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tickets</h1>
          <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Manage and track all tickets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilters({ ...filters, sprint: '' })}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.sprint === ''
              ? 'bg-blue-600 text-white'
              : isDark 
                ? 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          All Tickets
        </button>
        <button
          onClick={() => setFilters({ ...filters, sprint: 'backlog' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.sprint === 'backlog'
              ? 'bg-blue-600 text-white'
              : isDark 
                ? 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Backlog
        </button>
        {sprints.filter(s => s.status === 'active').map(sprint => (
          <button
            key={sprint.id}
            onClick={() => setFilters({ ...filters, sprint: String(sprint.id) })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filters.sprint === String(sprint.id)
                ? 'bg-green-600 text-white'
                : isDark 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {sprint.name}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search tickets by title or key..."
              className={`w-full px-4 py-2.5 pl-10 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white placeholder-dark-400 focus:border-blue-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className={`mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-6 gap-4 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Types</option>
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="story">Story</option>
              <option value="epic">Epic</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            {/* Sprint Filter */}
            <select
              value={filters.sprint}
              onChange={(e) => setFilters({ ...filters, sprint: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Sprints</option>
              <option value="backlog">📦 Backlog (No Sprint)</option>
              {sprints.filter(s => s.status === 'active').map((sprint) => (
                <option key={sprint.id} value={sprint.id}>🟢 {sprint.name} (Active)</option>
              ))}
              {sprints.filter(s => s.status === 'planning').map((sprint) => (
                <option key={sprint.id} value={sprint.id}>📋 {sprint.name}</option>
              ))}
              {sprints.filter(s => s.status === 'completed').map((sprint) => (
                <option key={sprint.id} value={sprint.id}>✅ {sprint.name}</option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
              className={`px-4 py-2.5 rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-dark-800 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">All Assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 col-span-2 md:col-span-6"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tickets List - AG Grid */}
      <AGGridWrapper<Ticket>
        rowData={tickets}
        columnDefs={columnDefs}
        loading={isLoading}
        height={500}
        emptyMessage="No tickets found"
      />

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => loadTickets()}
        />
      )}
    </div>
  );
}

