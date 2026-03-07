import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { epicsAPI, ticketsAPI, commentsAPI, aiAPI } from '../services/api';
import { Epic, Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Zap,
  Bug,
  CheckSquare,
  BookOpen,
  Calendar,
  Clock,
  User as UserIcon,
  Building2,
  Edit2,
  Trash2,
  Send,
  Plus,
  X,
  Link as LinkIcon,
  Unlink,
  Wand2,
  FileText,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import RichTextEditor, { RichTextViewer } from '../components/RichTextEditor';

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  task: CheckSquare,
  story: BookOpen,
  epic: Zap,
};

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  review: 'bg-yellow-500',
  done: 'bg-green-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function EpicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [epic, setEpic] = useState<Epic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
  });

  const loadEpic = async () => {
    try {
      const response = await epicsAPI.getById(parseInt(id!));
      setEpic(response.data);
      setEditForm({
        title: response.data.title,
        description: response.data.description || '',
      });
    } catch (error) {
      console.error('Failed to load epic:', error);
      toast.error('Epic not found');
      navigate('/epics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEpic();
  }, [id]);

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
        ticket_type: 'epic',
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
        ticket_type: 'epic',
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

  // Save Epic changes
  const handleSaveEdit = async () => {
    try {
      await ticketsAPI.update(parseInt(id!), {
        title: editForm.title,
        description: editForm.description,
      });
      setEpic(prev => prev ? { ...prev, title: editForm.title, description: editForm.description } : null);
      setIsEditing(false);
      toast.success('Epic berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui epic');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketsAPI.updateStatus(parseInt(id!), newStatus);
      setEpic((prev) => prev ? { ...prev, status: newStatus as Epic['status'] } : null);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await commentsAPI.add(parseInt(id!), newComment);
      setEpic((prev) => prev ? {
        ...prev,
        comments: [...(prev.comments || []), response.data],
      } : null);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const loadAvailableTickets = async () => {
    try {
      const response = await epicsAPI.getAvailableTickets(parseInt(id!));
      setAvailableTickets(response.data);
    } catch (error) {
      console.error('Failed to load available tickets:', error);
    }
  };

  const handleLinkTicket = async (ticketId: number) => {
    try {
      await epicsAPI.addTicket(parseInt(id!), ticketId);
      toast.success('Ticket linked to epic');
      loadEpic();
      setShowLinkModal(false);
    } catch (error) {
      toast.error('Failed to link ticket');
    }
  };

  const handleUnlinkTicket = async (ticketId: number) => {
    try {
      await epicsAPI.removeTicket(parseInt(id!), ticketId);
      toast.success('Ticket unlinked from epic');
      loadEpic();
    } catch (error) {
      toast.error('Failed to unlink ticket');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this epic? Child tickets will be unlinked.')) return;
    
    try {
      await ticketsAPI.delete(parseInt(id!));
      toast.success('Epic deleted');
      navigate('/epics');
    } catch (error) {
      toast.error('Failed to delete epic');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!epic) return null;

  const canEdit = user?.role === 'admin' || user?.id === epic.reporter_id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/epics')}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className={`flex items-center gap-2 text-sm mb-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <span className="font-mono text-purple-400">{epic.ticket_key}</span>
            <span>•</span>
            <span className="badge badge-epic flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Epic
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border text-xl font-bold ${isDark ? 'bg-dark-800 border-dark-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            />
          ) : (
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{epic.title}</h1>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ title: epic.title, description: epic.description || '' });
                  }} 
                  className="btn btn-secondary"
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>
                <button onClick={handleSaveEdit} className="btn btn-primary">
                  <Check className="w-4 h-4" />
                  Simpan
                </button>
              </>
            ) : (
              <>
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

      {/* Progress Overview */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{epic.totalChildren || 0}</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Total Issues</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-400">{epic.statusBreakdown?.todo || 0}</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>To Do</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400">{epic.statusBreakdown?.in_progress || 0}</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{epic.statusBreakdown?.review || 0}</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Review</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400">{epic.statusBreakdown?.done || 0}</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Done</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className={isDark ? 'text-dark-400' : 'text-gray-500'}>Overall Progress</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{epic.progress || 0}%</span>
          </div>
          <div className={`h-4 rounded-full overflow-hidden flex ${isDark ? 'bg-dark-800' : 'bg-gray-200'}`}>
            {(epic.statusBreakdown?.done || 0) > 0 && (
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${((epic.statusBreakdown?.done || 0) / (epic.totalChildren || 1)) * 100}%` }}
              />
            )}
            {(epic.statusBreakdown?.review || 0) > 0 && (
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${((epic.statusBreakdown?.review || 0) / (epic.totalChildren || 1)) * 100}%` }}
              />
            )}
            {(epic.statusBreakdown?.in_progress || 0) > 0 && (
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${((epic.statusBreakdown?.in_progress || 0) / (epic.totalChildren || 1)) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Child Issues</h3>
              <button
                onClick={() => {
                  loadAvailableTickets();
                  setShowLinkModal(true);
                }}
                className="btn btn-secondary"
              >
                <LinkIcon className="w-4 h-4" />
                Link Issue
              </button>
            </div>

            <div className="space-y-2">
              {epic.children?.map((ticket) => {
                const Icon = typeIcons[ticket.type] || CheckSquare;
                return (
                  <div
                    key={ticket.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${isDark ? 'bg-dark-800/50 hover:bg-dark-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      ticket.type === 'bug' ? 'text-red-400' :
                      ticket.type === 'story' ? 'text-green-400' :
                      'text-blue-400'
                    }`} />
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{ticket.ticket_key}</span>
                        <span className={`hover:text-purple-400 transition-colors truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {ticket.title}
                        </span>
                      </div>
                    </Link>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[ticket.status]}`} title={ticket.status} />
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[ticket.priority]}`} title={ticket.priority} />
                    {ticket.assignee_name && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {ticket.assignee_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => handleUnlinkTicket(ticket.id)}
                      className={`p-1 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'text-dark-500' : 'text-gray-400'}`}
                      title="Unlink from epic"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {(!epic.children || epic.children.length === 0) && (
                <div className="text-center py-8">
                  <p className={`mb-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>No child issues yet</p>
                  <button
                    onClick={() => {
                      loadAvailableTickets();
                      setShowLinkModal(true);
                    }}
                    className="btn btn-secondary"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Link an Issue
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
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
                        : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600'
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
                placeholder="Describe the epic scope and goals..."
                minHeight="200px"
                isDark={isDark}
              />
            ) : (
              <RichTextViewer content={epic.description || ''} isDark={isDark} />
            )}
          </div>

          {/* Comments */}
          <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Comments ({epic.comments?.length || 0})
            </h3>

            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`input min-h-[80px] resize-none ${isDark ? '' : 'bg-white border-gray-300'}`}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="btn btn-primary"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="space-y-4">
              {epic.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {comment.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{comment.user_name}</span>
                      <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={isDark ? 'text-dark-300' : 'text-gray-600'}>{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className={`card p-6 ${isDark ? '' : 'bg-white shadow-sm'}`}>
            <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {['todo', 'in_progress', 'review', 'done'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    epic.status === status
                      ? isDark 
                        ? 'bg-dark-700 border-purple-500/50' 
                        : 'bg-purple-50 border-purple-300'
                      : isDark 
                        ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                  <span className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{status.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className={`card p-6 space-y-4 ${isDark ? '' : 'bg-white shadow-sm'}`}>
            <h3 className={`text-sm font-medium ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Details</h3>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Priority</label>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${priorityColors[epic.priority]}`} />
                <span className={`capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{epic.priority}</span>
              </div>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Assignee</label>
              <div className="flex items-center gap-2">
                <UserIcon className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{epic.assignee_name || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Reporter</label>
              <div className="flex items-center gap-2">
                <UserIcon className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{epic.reporter_name}</span>
              </div>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Department</label>
              <div className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>{epic.department_name || 'None'}</span>
              </div>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Due Date</label>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {epic.due_date ? format(new Date(epic.due_date), 'MMM d, yyyy') : 'No due date'}
                </span>
              </div>
            </div>

            <div>
              <label className={`text-xs block mb-1 ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Created</label>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {format(new Date(epic.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Ticket Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />
          
          <div className={`relative w-full max-w-lg border rounded-2xl shadow-2xl max-h-[80vh] overflow-auto ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b sticky top-0 ${isDark ? 'border-dark-700 bg-dark-900' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Link Issue to Epic</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {availableTickets.length > 0 ? (
                <div className="space-y-2">
                  {availableTickets.map((ticket) => {
                    const Icon = typeIcons[ticket.type] || CheckSquare;
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => handleLinkTicket(ticket.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isDark ? 'bg-dark-800/50 hover:bg-dark-800' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          ticket.type === 'bug' ? 'text-red-400' :
                          ticket.type === 'story' ? 'text-green-400' :
                          'text-blue-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{ticket.ticket_key}</span>
                            <span className={`truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{ticket.title}</span>
                          </div>
                          {ticket.assignee_name && (
                            <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-400'}`}>Assigned to {ticket.assignee_name}</span>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-purple-400" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={isDark ? 'text-dark-500' : 'text-gray-400'}>No available tickets to link</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-dark-600' : 'text-gray-400'}`}>Create a new ticket first or unlink existing tickets from other epics</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
