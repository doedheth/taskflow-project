import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ticketsAPI, commentsAPI, usersAPI, departmentsAPI, aiAPI, sprintsAPI, workOrdersAPI, assetsAPI } from '../services/api';
import { Ticket, User, Department, Comment, Assignee, Sprint, WorkOrder, Asset } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Bug,
  CheckSquare,
  BookOpen,
  Zap,
  Calendar,
  Clock,
  User as UserIcon,
  Users,
  Building2,
  Edit2,
  Trash2,
  Send,
  Plus,
  X,
  Check,
  Sparkles,
  Loader2,
  Wand2,
  FileText,
  Layers,
  Play,
  Wrench,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import AssigneeAvatars from '../components/AssigneeAvatars';
import AssigneeMultiSelect from '../components/AssigneeMultiSelect';
import RichTextEditor, { RichTextViewer } from '../components/RichTextEditor';
import AIWritingAssistant from '../components/AIWritingAssistant';

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
  epic: Zap,
};

const statusOptions = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-yellow-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
];

// AI Assignee Suggestion Button
function AIAssigneeButton({ 
  ticket, 
  onSuggest 
}: { 
  ticket: Ticket;
  onSuggest: (userId: number) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
        taskType: 'ticket',
        priority: ticket.priority,
        departmentId: ticket.department_id || undefined,
        title: ticket.title,
        assetId: ticket.asset_id || undefined,
      });

      // Map response to match the dropdown expectation
      const mappedSuggestions = response.suggestions.map((s: any) => ({
        user: {
          id: s.userId,
          name: s.userName,
          avatar: null,
        },
        scores: {
          final: s.matchScore,
        },
        confidence: s.matchScore >= 80 ? 'high' : s.matchScore >= 60 ? 'medium' : 'low',
        reason: s.reason,
      }));

      setSuggestions(mappedSuggestions);
      setShowDropdown(true);
    } catch (error) {
      toast.error('Failed to get AI suggestions');
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (userId: number) => {
    onSuggest(userId);
    setShowDropdown(false);
    toast.success('Assignee added via AI suggestion');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleGetSuggestions}
        disabled={isLoading}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-105'
        } bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 hover:from-purple-500/30 hover:to-blue-500/30`}
        title="Get AI suggestion for assignee"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        AI
      </button>

      {showDropdown && suggestions.length > 0 && (
        <div className={`absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-xl ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`px-3 py-2 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              AI Recommendations
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={suggestion.user.id}
                onClick={() => handleSelect(suggestion.user.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {index + 1}
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isDark ? 'bg-dark-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {suggestion.user.avatar ? (
                    <img src={suggestion.user.avatar} alt="" className="w-full h-full rounded-full" />
                  ) : (
                    suggestion.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {suggestion.user.name}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Score: {suggestion.scores.final} • {suggestion.confidence}
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

// Assignee Manager Component
function AssigneeManager({ 
  assignees, 
  users,
  onAdd,
  onRemove 
}: { 
  assignees: Assignee[];
  users: User[];
  onAdd: (userId: number) => void;
  onRemove: (userId: number) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showDropdown, setShowDropdown] = useState(false);
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

  const assignedIds = assignees.map(a => a.id);
  const availableUsers = users.filter(u => !assignedIds.includes(u.id));

  return (
    <div className="space-y-2">
      {/* Current Assignees */}
      {assignees.length > 0 ? (
        <div className="space-y-2">
          {assignees.map(assignee => (
            <div key={assignee.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? 'bg-dark-800/50' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2">
                {assignee.avatar ? (
                  <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-medium">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{assignee.name}</span>
              </div>
              <button
                onClick={() => onRemove(assignee.id)}
                className={`p-1 hover:text-red-400 rounded transition-colors ${isDark ? 'text-dark-400' : 'text-gray-400'}`}
                title="Remove assignee"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>No assignees</p>
      )}

      {/* Add Assignee */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add assignee
        </button>

        {showDropdown && availableUsers.length > 0 && (
          <div className={`absolute z-50 top-full left-0 mt-1 w-64 rounded-lg shadow-xl max-h-48 overflow-y-auto border ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'}`}>
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  onAdd(user.id);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'}`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                  <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && availableUsers.length === 0 && (
          <div className={`absolute z-50 top-full left-0 mt-1 w-64 rounded-lg shadow-xl p-3 text-center text-sm border ${isDark ? 'bg-dark-800 border-dark-700 text-dark-400' : 'bg-white border-gray-200 text-gray-400'}`}>
            All users are already assigned
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: '',
    priority: '',
    status: '',
    department_id: '',
    due_date: '',
    asset_id: '',
  });
  
  // Work Order from Ticket state
  const [childWorkOrders, setChildWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showCreateWOModal, setShowCreateWOModal] = useState(false);
  const [isCreatingWO, setIsCreatingWO] = useState(false);
  const [failureCodes, setFailureCodes] = useState<{ id: number; code: string; category: string; description: string; priority?: number }[]>([]);
  const [loadingFailureCodes, setLoadingFailureCodes] = useState(false);
  const [woForm, setWoForm] = useState({
    asset_id: '',
    type: 'corrective' as 'preventive' | 'corrective' | 'emergency',
    priority: 'medium',
    description: '',
    assignee_ids: [] as number[],
    failure_code_id: '',
  });

  // AI Text Enhancement
  const handleEnhanceText = async () => {
    if (!editForm.title && !editForm.description) {
      toast.error('Masukkan judul atau deskripsi terlebih dahulu');
      return;
    }
    
    setIsEnhancing(true);
    try {
      const response = await aiAPI.enhanceText({
        title: editForm.title,
        description: editForm.description,
        ticket_type: editForm.type,
      });
      
      if (response.data.success) {
        setEditForm(prev => ({
          ...prev,
          title: response.data.enhanced.title || prev.title,
          description: response.data.enhanced.description || prev.description,
        }));
        
        const changes = response.data.changes_made?.length || 0;
        toast.success(`✨ Teks diperbaiki! ${changes} perbaikan dilakukan`);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Gagal memperbaiki teks');
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Auto-generate Description
  const handleAutocomplete = async () => {
    if (!editForm.title.trim()) {
      toast.error('Masukkan judul terlebih dahulu');
      return;
    }
    
    setIsAutocompleting(true);
    try {
      const response = await aiAPI.autocomplete({
        title: editForm.title,
        ticket_type: editForm.type,
      });
      
      if (response.data.success) {
        setEditForm(prev => ({
          ...prev,
          description: response.data.suggested_description,
        }));
        toast.success('✨ Deskripsi berhasil dibuat!');
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      toast.error('Gagal membuat deskripsi');
    } finally {
      setIsAutocompleting(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ticketRes, usersRes, deptsRes, sprintsRes, assetsRes, childWOsRes] = await Promise.all([
          ticketsAPI.getById(parseInt(id!)),
          usersAPI.getAll(),
          departmentsAPI.getAll(),
          sprintsAPI.getAll(),
          assetsAPI.getAll(),
          workOrdersAPI.getByTicket(parseInt(id!)),
        ]);
        setTicket(ticketRes.data);
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
        setSprints(sprintsRes.data.filter((s: Sprint) => s.status !== 'completed'));
        setAssets(assetsRes.data);
        setChildWorkOrders(childWOsRes.data);
        setEditForm({
          title: ticketRes.data.title,
          description: ticketRes.data.description || '',
          type: ticketRes.data.type,
          priority: ticketRes.data.priority,
          status: ticketRes.data.status,
          department_id: ticketRes.data.department_id?.toString() || '',
          due_date: ticketRes.data.due_date || '',
          asset_id: ticketRes.data.asset_id?.toString() || '',
        });
      } catch (error) {
        console.error('Failed to load ticket:', error);
        toast.error('Ticket not found');
        navigate('/tickets');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Change ticket sprint
  const handleSprintChange = async (newSprintId: number | null) => {
    if (!ticket) return;
    
    try {
      if (ticket.sprint_id) {
        await sprintsAPI.removeTicket(ticket.sprint_id, ticket.id);
      }
      
      if (newSprintId) {
        await sprintsAPI.addTicket(newSprintId, ticket.id);
        const sprint = sprints.find(s => s.id === newSprintId);
        setTicket(prev => prev ? { ...prev, sprint_id: newSprintId, sprint_name: sprint?.name } : null);
        toast.success(`Dipindahkan ke ${sprint?.name}`);
      } else {
        setTicket(prev => prev ? { ...prev, sprint_id: undefined, sprint_name: undefined } : null);
        toast.success('Dipindahkan ke Backlog');
      }
      
      setShowSprintSelector(false);
    } catch (error) {
      console.error('Failed to change sprint:', error);
      toast.error('Gagal mengubah sprint');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketsAPI.updateStatus(parseInt(id!), newStatus);
      setTicket((prev) => prev ? { ...prev, status: newStatus as Ticket['status'] } : null);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await ticketsAPI.update(parseInt(id!), {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        priority: editForm.priority,
        status: editForm.status,
        department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
        due_date: editForm.due_date || null,
        asset_id: editForm.asset_id ? parseInt(editForm.asset_id) : null,
      });
      setTicket(response.data);
      setIsEditing(false);
      toast.success('Ticket updated');
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      await ticketsAPI.delete(parseInt(id!));
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const handleAddAssignee = async (userId: number) => {
    try {
      const response = await ticketsAPI.addAssignee(parseInt(id!), userId);
      setTicket((prev) => prev ? { ...prev, assignees: response.data.assignees } : null);
      toast.success('Assignee added');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add assignee');
    }
  };

  const handleRemoveAssignee = async (userId: number) => {
    try {
      const response = await ticketsAPI.removeAssignee(parseInt(id!), userId);
      setTicket((prev) => prev ? { ...prev, assignees: response.data.assignees } : null);
      toast.success('Assignee removed');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove assignee');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await commentsAPI.add(parseInt(id!), newComment);
      setTicket((prev) => prev ? {
        ...prev,
        comments: [...(prev.comments || []), response.data],
      } : null);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentsAPI.delete(commentId);
      setTicket((prev) => prev ? {
        ...prev,
        comments: prev.comments?.filter((c) => c.id !== commentId),
      } : null);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  // Fetch failure codes when asset changes
  const fetchFailureCodesByAsset = async (assetId: string) => {
    if (!assetId) {
      setFailureCodes([]);
      return;
    }
    try {
      setLoadingFailureCodes(true);
      const res = await assetsAPI.getFailureCodesByAsset(parseInt(assetId));
      setFailureCodes(res.data || []);
    } catch (error) {
      console.error('Error fetching failure codes:', error);
      // Fallback to all failure codes
      try {
        const res = await assetsAPI.getFailureCodes();
        setFailureCodes(res.data || []);
      } catch {
        setFailureCodes([]);
      }
    } finally {
      setLoadingFailureCodes(false);
    }
  };

  // Open Create WO Modal with pre-filled values from ticket
  const openCreateWOModal = () => {
    const assetId = ticket?.asset_id?.toString() || '';
    const failureCodeId = ticket?.failure_code_id?.toString() || '';
    
    // Determine WO type based on ticket priority
    let woType: 'preventive' | 'corrective' | 'emergency' = 'corrective';
    if (ticket?.priority === 'critical') {
      woType = 'emergency';
    }
    
    setWoForm({
      asset_id: assetId,
      type: woType,
      priority: ticket?.priority || 'medium',
      description: ticket?.description || '', // Pre-fill with ticket description
      assignee_ids: ticket?.assignees?.map(a => a.id) || [],
      failure_code_id: failureCodeId, // Pre-fill from ticket
    });
    // Fetch failure codes for the asset
    if (assetId) {
      fetchFailureCodesByAsset(assetId);
    }
    setShowCreateWOModal(true);
  };

  // Create Work Order from Ticket
  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woForm.asset_id) {
      toast.error('Pilih asset terlebih dahulu');
      return;
    }
    
    if (woForm.assignee_ids.length === 0) {
      toast.error('Minimal satu teknisi harus dipilih untuk ditugaskan');
      return;
    }

    setIsCreatingWO(true);
    try {
      const response = await workOrdersAPI.createFromTicket(parseInt(id!), {
        asset_id: parseInt(woForm.asset_id),
        type: woForm.type,
        priority: woForm.priority,
        description: woForm.description || undefined,
        assignee_ids: woForm.assignee_ids,
        failure_code_id: woForm.failure_code_id ? parseInt(woForm.failure_code_id) : undefined,
      });
      
      // Add new WO to child list
      setChildWorkOrders(prev => [response.data, ...prev]);
      
      // Update ticket with related_wo_id
      setTicket(prev => prev ? { ...prev, related_wo_id: response.data.id, related_wo_number: response.data.wo_number } : null);
      
      toast.success(`Work Order ${response.data.wo_number} berhasil dibuat`);
      setShowCreateWOModal(false);
      setWoForm({
        asset_id: '',
        type: 'corrective',
        priority: 'medium',
        description: '',
        assignee_ids: [],
        failure_code_id: '',
      });
      setFailureCodes([]);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Gagal membuat Work Order');
    } finally {
      setIsCreatingWO(false);
    }
  };

  const getWOStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700',
      in_progress: isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      on_hold: isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700',
      completed: isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
      cancelled: isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700',
    };
    return colors[status] || colors.open;
  };

  const getWOTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      preventive: isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700',
      corrective: isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700',
      emergency: isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700',
    };
    return colors[type] || colors.corrective;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!ticket) return null;

  const Icon = typeIcons[ticket.type] || CheckSquare;
  const canEdit = user?.role === 'admin' || user?.id === ticket.reporter_id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className={`flex items-center gap-2 text-sm mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <span className="font-mono text-blue-400">{ticket.ticket_key}</span>
            <span>•</span>
            <span className={`badge badge-${ticket.type} flex items-center gap-1`}>
              <Icon className="w-3 h-3" />
              {ticket.type}
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-xl font-bold ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          ) : (
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</h1>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleUpdate} className="btn btn-primary">
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {ticket?.status !== 'done' && (
                  <button 
                    onClick={openCreateWOModal} 
                    className={`btn flex items-center gap-2 ${isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                    title="Buat Work Order dari Ticket ini"
                  >
                    <Wrench className="w-4 h-4" />
                    Create WO
                  </button>
                )}
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={handleDelete} className="btn btn-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Description</h3>
              {isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutocomplete}
                    disabled={isAutocompleting || !editForm.title.trim()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isAutocompleting || !editForm.title.trim()
                        ? isDark ? 'bg-dark-700 text-dark-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title="Generate deskripsi dari judul"
                  >
                    {isAutocompleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    Generate
                  </button>
                  <button
                    type="button"
                    onClick={handleEnhanceText}
                    disabled={isEnhancing || (!editForm.title && !editForm.description)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isEnhancing || (!editForm.title && !editForm.description)
                        ? isDark ? 'bg-dark-700 text-dark-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                    }`}
                    title="Perbaiki dan format teks"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    Enhance
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <RichTextEditor
                value={editForm.description}
                onChange={(value) => setEditForm({ ...editForm, description: value })}
                placeholder="Add a description..."
                minHeight="200px"
                isDark={isDark}
              />
            ) : (
              <RichTextViewer content={ticket.description || ''} isDark={isDark} />
            )}
          </div>

          {/* Child Work Orders */}
          {childWorkOrders.length > 0 && (
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Wrench className="w-5 h-5 text-orange-500" />
                  Work Orders ({childWorkOrders.length})
                </h3>
                <button
                  onClick={openCreateWOModal}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg ${
                    isDark ? 'text-orange-400 hover:bg-orange-500/20' : 'text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add WO
                </button>
              </div>
              <div className="space-y-3">
                {childWorkOrders.map((wo) => (
                  <Link
                    key={wo.id}
                    to={`/work-orders/${wo.id}`}
                    className={`block p-4 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-dark-700/50 border-dark-600 hover:border-orange-500/50' 
                        : 'bg-gray-50 border-gray-200 hover:border-orange-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          {wo.wo_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getWOTypeColor(wo.type)}`}>
                          {wo.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getWOStatusColor(wo.status)}`}>
                          {wo.status.replace('_', ' ')}
                        </span>
                      </div>
                      <ExternalLink className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{wo.title}</p>
                    <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {wo.asset_code && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {wo.asset_code} - {wo.asset_name}
                        </span>
                      )}
                      {wo.assignees && wo.assignees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {wo.assignees.map(a => a.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Comments ({ticket.comments?.length || 0})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <RichTextEditor
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Add a comment..."
                    minHeight="100px"
                    isDark={isDark}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || newComment === '<p><br></p>'}
                      className="btn btn-primary"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {ticket.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {comment.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{comment.user_name}</span>
                      <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                        {comment.created_at ? formatDistanceToNow(new Date(comment.created_at.replace(' ', 'T')), { addSuffix: true }) : 'just now'}
                      </span>
                      {(user?.id === comment.user_id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className={`opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all ${isDark ? 'text-dark-400' : 'text-gray-400'}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className={`comment-content ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      <RichTextViewer content={comment.content} isDark={isDark} />
                    </div>
                  </div>
                </div>
              ))}
              {(!ticket.comments || ticket.comments.length === 0) && (
                <p className={`text-center py-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>No comments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    ticket.status === option.value
                      ? isDark ? 'bg-dark-700 border-blue-500/50' : 'bg-blue-50 border-blue-400'
                      : isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${option.color}`} />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className={`rounded-2xl p-6 space-y-4 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-sm font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Details</h3>

            {/* Priority */}
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Priority</label>
              {isEditing ? (
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                >
                  {priorityOptions.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${priorityOptions.find((p) => p.value === ticket.priority)?.color}`} />
                  <span className={`capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.priority}</span>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs flex items-center gap-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                  <Users className="w-3 h-3" />
                  Assignees
                </label>
                <AIAssigneeButton 
                  ticket={ticket}
                  onSuggest={handleAddAssignee}
                />
              </div>
              <AssigneeManager
                assignees={ticket.assignees || []}
                users={users}
                onAdd={handleAddAssignee}
                onRemove={handleRemoveAssignee}
              />
            </div>

            {/* Reporter */}
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Reporter</label>
              <div className="flex items-center gap-2">
                <UserIcon className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{ticket.reporter_name}</span>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Department</label>
              {isEditing ? (
                <select
                  value={editForm.department_id}
                  onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                >
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{ticket.department_name || 'None'}</span>
                </div>
              )}
            </div>

            {/* Related Asset */}
            {(ticket.asset_id || isEditing) && (
              <div>
                <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Related Asset</label>
                {isEditing ? (
                  <select
                    value={editForm.asset_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, asset_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    <option value="">No asset</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>{a.asset_code} - {a.name}</option>
                    ))}
                  </select>
                ) : ticket.asset_id ? (
                  <Link 
                    to={`/assets/${ticket.asset_id}`}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>{ticket.asset_code} - {ticket.asset_name}</span>
                  </Link>
                ) : null}
              </div>
            )}

            {/* Sprint */}
            {ticket.type !== 'epic' && (
              <div className="relative">
                <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Sprint</label>
                <button
                  onClick={() => setShowSprintSelector(!showSprintSelector)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    isDark 
                      ? 'bg-dark-800 border-dark-600 text-white hover:border-dark-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ticket.sprint_id ? (
                      <>
                        <Play className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <span>{ticket.sprint_name}</span>
                      </>
                    ) : (
                      <>
                        <Layers className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                        <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Backlog</span>
                      </>
                    )}
                  </div>
                  <X 
                    className={`w-4 h-4 transition-transform ${showSprintSelector ? 'rotate-45' : ''} ${isDark ? 'text-dark-400' : 'text-gray-400'}`} 
                  />
                </button>

                {/* Sprint Selector Dropdown */}
                {showSprintSelector && (
                  <div className={`absolute z-50 mt-2 w-full rounded-xl border shadow-lg overflow-hidden ${
                    isDark ? 'bg-dark-800 border-dark-600' : 'bg-white border-gray-200'
                  }`}>
                    {/* Backlog Option */}
                    <button
                      onClick={() => handleSprintChange(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        !ticket.sprint_id
                          ? isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                          : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Layers className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={isDark ? 'text-white' : 'text-gray-900'}>Backlog</span>
                      {!ticket.sprint_id && (
                        <Check className="w-4 h-4 ml-auto text-blue-500" />
                      )}
                    </button>

                    {/* Sprint Options */}
                    {sprints.map((sprint) => (
                      <button
                        key={sprint.id}
                        onClick={() => handleSprintChange(sprint.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          ticket.sprint_id === sprint.id
                            ? isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                            : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Play className={`w-4 h-4 ${
                          sprint.status === 'active' 
                            ? isDark ? 'text-green-400' : 'text-green-600' 
                            : isDark ? 'text-indigo-400' : 'text-indigo-500'
                        }`} />
                        <div className="flex-1 text-left">
                          <span className={isDark ? 'text-white' : 'text-gray-900'}>{sprint.name}</span>
                          {sprint.status === 'active' && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                              Active
                            </span>
                          )}
                        </div>
                        {ticket.sprint_id === sprint.id && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}

                    {sprints.length === 0 && (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                        Tidak ada sprint aktif
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Due Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>
                    {ticket.due_date ? format(new Date(ticket.due_date.replace(' ', 'T')), 'MMM d, yyyy') : 'No due date'}
                  </span>
                </div>
              )}
            </div>

            {/* Created */}
            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Created</label>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {ticket.created_at && format(new Date(ticket.created_at.replace(' ', 'T')), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Work Order Modal - Simplified */}
      {showCreateWOModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateWOModal(false)} />
            
            {/* Modal Content */}
            <div className={`relative w-full max-w-lg rounded-2xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                    <Wrench className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Buat Work Order
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      Dari: {ticket.ticket_key}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateWOModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateWorkOrder} className="p-6 space-y-4">
                {/* Pre-filled Summary from Ticket */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-dark-700/50 border-dark-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Data dari Ticket (otomatis)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Asset */}
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                      <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Asset</span>
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {ticket?.asset_id ? (
                          assets.find(a => a.id === ticket.asset_id)?.name || 'Loading...'
                        ) : (
                          <span className="text-amber-500">Belum dipilih</span>
                        )}
                      </p>
                    </div>
                    {/* Priority */}
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                      <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Priority</span>
                      <p className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {ticket?.priority === 'critical' && '🔴 '}
                        {ticket?.priority === 'high' && '🟠 '}
                        {ticket?.priority === 'medium' && '🟡 '}
                        {ticket?.priority === 'low' && '⚪ '}
                        {ticket?.priority || 'Medium'}
                      </p>
                    </div>
                    {/* Failure Code */}
                    {ticket?.failure_code_id && (
                      <div className={`p-2 rounded-lg col-span-2 ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                        <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Failure Code</span>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          [{ticket.failure_code}] {ticket.failure_description}
                        </p>
                      </div>
                    )}
                    {/* Assignees from Ticket */}
                    {ticket?.assignees && ticket.assignees.length > 0 && (
                      <div className={`p-2 rounded-lg col-span-2 ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
                        <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Assignees dari Ticket</span>
                        <div className="flex items-center gap-2 mt-1">
                          {ticket.assignees.slice(0, 3).map(a => (
                            <div key={a.id} className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] text-white font-medium">
                                {a.name.charAt(0)}
                              </div>
                              <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                                {a.name.split(' ')[0]}
                              </span>
                            </div>
                          ))}
                          {ticket.assignees.length > 3 && (
                            <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                              +{ticket.assignees.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Only show Asset selector if ticket doesn't have one */}
                {!ticket?.asset_id && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Asset <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={woForm.asset_id}
                      onChange={(e) => {
                        const newAssetId = e.target.value;
                        setWoForm({ ...woForm, asset_id: newAssetId, failure_code_id: '' });
                        fetchFailureCodesByAsset(newAssetId);
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
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
                )}

                {/* WO Type - Always editable */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Tipe Work Order
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'corrective', label: 'Corrective', icon: '🔧', desc: 'Perbaikan' },
                      { value: 'preventive', label: 'Preventive', icon: '📅', desc: 'Perawatan' },
                      { value: 'emergency', label: 'Emergency', icon: '🚨', desc: 'Darurat' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setWoForm({ ...woForm, type: type.value as any })}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          woForm.type === type.value
                            ? type.value === 'emergency'
                              ? 'border-red-500 bg-red-500/10'
                              : type.value === 'preventive'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-orange-500 bg-orange-500/10'
                            : isDark ? 'border-dark-600 hover:border-dark-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <p className={`text-xs font-medium mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</p>
                        <p className={`text-[10px] ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignees - Required, pre-filled from ticket */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    Teknisi yang Ditugaskan <span className="text-red-500">*</span>
                    {woForm.assignee_ids.length > 0 && ticket?.assignees && ticket.assignees.length > 0 && (
                      <span className="ml-2 text-xs text-green-500">✓ dari ticket</span>
                    )}
                  </label>
                  <AssigneeMultiSelect
                    users={users}
                    selectedIds={woForm.assignee_ids}
                    onChange={(ids) => setWoForm({ ...woForm, assignee_ids: ids })}
                    isDark={isDark}
                    placeholder="Pilih teknisi..."
                    required={true}
                    filterRole={true}
                  />
                  {woForm.assignee_ids.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">⚠️ Minimal 1 teknisi harus dipilih</p>
                  )}
                </div>

                {/* Failure Code - Only if not from ticket */}
                {!ticket?.failure_code_id && woForm.asset_id && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Failure Code
                      <span className="ml-2 text-xs font-normal text-gray-500">(opsional)</span>
                    </label>
                    <select
                      value={woForm.failure_code_id}
                      onChange={(e) => setWoForm({ ...woForm, failure_code_id: e.target.value })}
                      disabled={loadingFailureCodes}
                      className={`w-full px-4 py-2.5 rounded-xl border ${isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${loadingFailureCodes ? 'opacity-50' : ''}`}
                    >
                      <option value="">
                        {loadingFailureCodes ? 'Memuat...' : 'Pilih Failure Code'}
                      </option>
                      {failureCodes.map((fc) => (
                        <option key={fc.id} value={fc.id}>
                          [{fc.code}] {fc.category} - {fc.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description - Collapsible, pre-filled */}
                <details className={`rounded-xl border ${isDark ? 'border-dark-600' : 'border-gray-200'}`}>
                  <summary className={`px-4 py-3 cursor-pointer flex items-center justify-between ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
                    <span className="text-sm font-medium">
                      Deskripsi Tambahan
                      {woForm.description && <span className="ml-2 text-xs text-green-500">✓ ada</span>}
                    </span>
                    <span className="text-xs text-gray-500">klik untuk expand</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <AIWritingAssistant
                      value={woForm.description}
                      onChange={(value) => setWoForm({ ...woForm, description: value })}
                      context={{
                        type: 'work_order',
                        title: ticket?.title,
                        asset: assets.find(a => a.id === parseInt(woForm.asset_id))?.name,
                        priority: woForm.priority
                      }}
                      ticketId={ticket?.id}
                      assetId={woForm.asset_id ? parseInt(woForm.asset_id) : undefined}
                      placeholder="Deskripsi pekerjaan untuk teknisi..."
                      minHeight="100px"
                    />
                  </div>
                </details>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateWOModal(false)}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      isDark ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingWO || !woForm.asset_id || woForm.assignee_ids.length === 0}
                    className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700 transition-colors ${
                      (isCreatingWO || !woForm.asset_id || woForm.assignee_ids.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreatingWO ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4" />
                        Buat Work Order
                      </>
                    )}
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
