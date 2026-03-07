import { useState, useEffect, useRef } from 'react';
import { X, Bug, CheckSquare, BookOpen, Zap, Timer, Users, Check, Sparkles, ChevronDown, ChevronUp, Wand2, Loader2, FileText, Brain, Lightbulb, ArrowRight, Wrench, AlertTriangle, Settings } from 'lucide-react';
import { ticketsAPI, usersAPI, departmentsAPI, epicsAPI, sprintsAPI, aiAPI, assetsAPI } from '../services/api';
import { User, Department, Epic, Sprint, Asset, FailureCode } from '../types';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import AISuggestionPanel from './AISuggestionPanel';
import { useTheme } from '../context/ThemeContext';

// Ticket Categories
const ticketCategories = [
  { value: 'general', label: 'Umum', icon: CheckSquare, color: 'text-blue-500', description: 'Ticket umum, task, story, bug' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-500', description: 'Laporan kerusakan mesin/peralatan' },
];

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

const ticketTypes = [
  { value: 'task', label: 'Task', icon: CheckSquare, color: 'text-blue-400' },
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400' },
  { value: 'story', label: 'Story', icon: BookOpen, color: 'text-green-400' },
  { value: 'epic', label: 'Epic', icon: Zap, color: 'text-purple-400' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-slate-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
];

const storyPointOptions = [1, 2, 3, 5, 8, 13, 21];

// Multi-select Assignees Component
function AssigneeMultiSelect({ 
  users, 
  selectedIds, 
  onChange,
  isDark = true
}: { 
  users: User[]; 
  selectedIds: number[]; 
  onChange: (ids: number[]) => void;
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

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
          isDark 
            ? 'bg-dark-700 border-dark-600 text-white' 
            : 'bg-gray-50 border-gray-300 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedUsers.length === 0 ? (
            <span className={isDark ? 'text-dark-400' : 'text-gray-400'}>Pilih assignee...</span>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {selectedUsers.slice(0, 3).map(user => (
                <div key={user.id} className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                  isDark ? 'bg-dark-600' : 'bg-gray-200'
                }`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-xs truncate max-w-[60px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  +{selectedUsers.length - 3} lagi
                </span>
              )}
            </div>
          )}
        </div>
        <Users className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto border ${
          isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
        }`}>
          {users.length === 0 ? (
            <div className={`p-3 text-sm text-center ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
              Tidak ada user tersedia
            </div>
          ) : (
            users.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                  selectedIds.includes(user.id) 
                    ? isDark ? 'bg-dark-700/50' : 'bg-blue-50' 
                    : isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  selectedIds.includes(user.id) 
                    ? 'bg-blue-500 border-blue-500' 
                    : isDark ? 'border-dark-600' : 'border-gray-300'
                }`}>
                  {selectedIds.includes(user.id) && <Check className="w-3 h-3 text-white" />}
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

interface AIAnalysis {
  is_new_epic: boolean;
  suggested_epic_id: number | null;
  suggested_epic_key: string | null;
  suggested_epic_title: string | null;
  suggested_type: string;
  suggested_priority: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export default function CreateTicketModal({ onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [loadingFailureCodes, setLoadingFailureCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [formData, setFormData] = useState({
    category: 'general', // 'general' or 'maintenance'
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    story_points: '',
    assignee_ids: [] as number[],
    department_id: '',
    epic_id: '',
    sprint_id: '',
    due_date: '',
    asset_id: '',
    failure_code_id: '',
  });

  // Fetch failure codes when asset changes (for maintenance category)
  const fetchFailureCodesByAsset = async (assetId: string) => {
    if (!assetId) {
      setFailureCodes([]);
      return;
    }
    setLoadingFailureCodes(true);
    try {
      const res = await assetsAPI.getFailureCodesByAsset(parseInt(assetId));
      setFailureCodes(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error fetching failure codes:', error);
      setFailureCodes([]);
    } finally {
      setLoadingFailureCodes(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    const updates: Partial<typeof formData> = { category: newCategory };
    
    if (newCategory === 'maintenance') {
      // Auto-select maintenance department if exists
      const maintenanceDept = departments.find(d => 
        d.name.toLowerCase().includes('maintenance') || 
        d.name.toLowerCase().includes('pemeliharaan')
      );
      if (maintenanceDept) {
        updates.department_id = maintenanceDept.id.toString();
      }
      // Set priority to high for maintenance by default
      updates.priority = 'high';
      // Reset failure code
      updates.failure_code_id = '';
    } else {
      // Reset maintenance-specific fields
      updates.failure_code_id = '';
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // AI Ticket Analysis - Recommend epic, type, priority
  const handleAnalyzeTicket = async () => {
    if (!formData.title.trim()) {
      toast.error('Masukkan judul terlebih dahulu');
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const response = await aiAPI.analyzeTicket({
        title: formData.title,
        description: formData.description,
      });

      if (response.data.success) {
        setAiAnalysis(response.data.analysis);
        toast.success('✨ Analisis selesai!');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Gagal menganalisis tiket');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply AI suggestions
  const handleApplySuggestions = () => {
    if (!aiAnalysis) return;

    setFormData(prev => ({
      ...prev,
      type: aiAnalysis.suggested_type,
      priority: aiAnalysis.suggested_priority,
      epic_id: aiAnalysis.suggested_epic_id?.toString() || '',
    }));
    toast.success('✅ Rekomendasi AI diterapkan!');
  };

  // AI Text Enhancement
  const handleEnhanceText = async () => {
    if (!formData.title && !formData.description) {
      toast.error('Please enter a title or description first');
      return;
    }
    
    setIsEnhancing(true);
    try {
      const response = await aiAPI.enhanceText({
        title: formData.title,
        description: formData.description,
        ticket_type: formData.type,
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          title: response.data.enhanced.title || prev.title,
          description: response.data.enhanced.description || prev.description,
        }));
        
        const changes = response.data.changes_made?.length || 0;
        toast.success(`✨ Text enhanced! ${changes} improvements made`);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance text');
    } finally {
      setIsEnhancing(false);
    }
  };

  // AI Auto-generate Description
  const handleAutocomplete = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title first');
      return;
    }
    
    setIsAutocompleting(true);
    try {
      const response = await aiAPI.autocomplete({
        title: formData.title,
        ticket_type: formData.type,
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          description: response.data.suggested_description,
        }));
        toast.success('✨ Description generated!');
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      toast.error('Failed to generate description');
    } finally {
      setIsAutocompleting(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, deptsRes, epicsRes, sprintsRes, assetsRes] = await Promise.all([
          usersAPI.getAll(),
          departmentsAPI.getAll(),
          epicsAPI.getAll(),
          sprintsAPI.getAll(),
          assetsAPI.getAll(),
        ]);
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
        setEpics(epicsRes.data);
        // Only show non-completed sprints
        setSprints(sprintsRes.data.filter((s: Sprint) => s.status !== 'completed'));
        // Only show operational assets
        setAssets(assetsRes.data.filter((a: Asset) => a.status !== 'retired'));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Masukkan judul ticket');
      return;
    }

    // Validate asset for maintenance category
    if (formData.category === 'maintenance' && !formData.asset_id) {
      toast.error('Pilih asset yang bermasalah untuk ticket maintenance');
      return;
    }

    setIsLoading(true);
    try {
      const isEpic = formData.type === 'epic';
      const isMaintenance = formData.category === 'maintenance';
      
      await ticketsAPI.create({
        title: formData.title,
        description: formData.description || undefined,
        type: isMaintenance ? 'bug' : formData.type, // Maintenance tickets are treated as bugs
        priority: formData.priority,
        story_points: !isEpic && formData.story_points ? parseInt(formData.story_points) : undefined,
        assignee_ids: formData.assignee_ids.length > 0 ? formData.assignee_ids : undefined,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        epic_id: !isEpic && formData.epic_id ? parseInt(formData.epic_id) : undefined,
        sprint_id: !isEpic && formData.sprint_id ? parseInt(formData.sprint_id) : undefined,
        due_date: formData.due_date || undefined,
        asset_id: formData.asset_id ? parseInt(formData.asset_id) : undefined,
        // Add failure_code_id if present (for maintenance tickets)
        ...(isMaintenance && formData.failure_code_id && { failure_code_id: parseInt(formData.failure_code_id) }),
      });
      
      if (isMaintenance) {
        toast.success('✅ Ticket maintenance berhasil dibuat! Buat Work Order dari halaman detail.');
      } else {
        toast.success('✅ Ticket berhasil dibuat!');
      }
      onCreated?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[95vh] md:max-h-[90vh] overflow-auto border ${
        isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 ${
          isDark ? 'border-dark-700 bg-dark-900' : 'border-gray-200 bg-white'
        }`}>
          <h3 className={`text-lg md:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Buat Ticket Baru
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-dark-400 hover:text-white hover:bg-dark-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Ticket Category Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Kategori Ticket
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ticketCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    formData.category === cat.value
                      ? cat.value === 'maintenance'
                        ? isDark ? 'bg-orange-500/10 border-orange-500' : 'bg-orange-50 border-orange-500'
                        : isDark ? 'bg-blue-500/10 border-blue-500' : 'bg-blue-50 border-blue-500'
                      : isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    formData.category === cat.value
                      ? cat.value === 'maintenance' ? 'bg-orange-500/20' : 'bg-blue-500/20'
                      : isDark ? 'bg-dark-700' : 'bg-gray-200'
                  }`}>
                    <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.label}</div>
                    <div className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{cat.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Warning Banner */}
          {formData.category === 'maintenance' && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${
              isDark 
                ? 'bg-orange-500/10 border-orange-500/30' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                  Ticket Maintenance
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-orange-400/80' : 'text-orange-600'}`}>
                  Pilih asset yang bermasalah untuk melaporkan kerusakan. Work Order akan dibuat dari ticket ini.
                </p>
              </div>
            </div>
          )}

          {/* AI Enhancement Bar */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${
              isDark 
                ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20' 
                : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
            }`}>
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className={`text-sm flex-1 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>AI Assistant</span>
              <button
                type="button"
                onClick={handleAnalyzeTicket}
                disabled={isAnalyzing || !formData.title.trim()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isAnalyzing || !formData.title.trim()
                    ? isDark ? 'bg-dark-700 text-dark-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                }`}
                title="Analisis & rekomendasikan epic, type, priority"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Brain className="w-3.5 h-3.5" />
                )}
                Analyze
              </button>
              <button
                type="button"
                onClick={handleAutocomplete}
                disabled={isAutocompleting || !formData.title.trim()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isAutocompleting || !formData.title.trim()
                    ? isDark ? 'bg-dark-700 text-dark-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                title="Generate description from title"
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
                disabled={isEnhancing || (!formData.title && !formData.description)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isEnhancing || (!formData.title && !formData.description)
                    ? isDark ? 'bg-dark-700 text-dark-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                }`}
                title="Enhance and format text"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                Enhance
              </button>
            </div>

            {/* AI Analysis Result */}
            {aiAnalysis && (
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30' 
                  : 'bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Rekomendasi AI</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        aiAnalysis.confidence === 'high' 
                          ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                          : aiAnalysis.confidence === 'medium' 
                            ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {aiAnalysis.confidence === 'high' ? 'Tinggi' : aiAnalysis.confidence === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-3 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>{aiAnalysis.reasoning}</p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {/* Type Suggestion */}
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-dark-800/50' : 'bg-white/80'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>Type</p>
                        <div className="flex items-center gap-1">
                          {aiAnalysis.suggested_type === 'bug' && <Bug className="w-3.5 h-3.5 text-red-500" />}
                          {aiAnalysis.suggested_type === 'task' && <CheckSquare className="w-3.5 h-3.5 text-blue-500" />}
                          {aiAnalysis.suggested_type === 'story' && <BookOpen className="w-3.5 h-3.5 text-green-500" />}
                          {aiAnalysis.suggested_type === 'epic' && <Zap className="w-3.5 h-3.5 text-purple-500" />}
                          <span className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiAnalysis.suggested_type}</span>
                        </div>
                      </div>
                      
                      {/* Priority Suggestion */}
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-dark-800/50' : 'bg-white/80'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>Priority</p>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            aiAnalysis.suggested_priority === 'critical' ? 'bg-red-500' :
                            aiAnalysis.suggested_priority === 'high' ? 'bg-orange-500' :
                            aiAnalysis.suggested_priority === 'medium' ? 'bg-yellow-500' :
                            'bg-slate-500'
                          }`} />
                          <span className={`text-sm capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{aiAnalysis.suggested_priority}</span>
                        </div>
                      </div>
                      
                      {/* Epic Suggestion */}
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-dark-800/50' : 'bg-white/80'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>Epic</p>
                        {aiAnalysis.is_new_epic ? (
                          <span className="text-sm text-purple-500">🆕 Epic Baru</span>
                        ) : aiAnalysis.suggested_epic_key ? (
                          <span className={`text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={aiAnalysis.suggested_epic_title || ''}>
                            {aiAnalysis.suggested_epic_key}
                          </span>
                        ) : (
                          <span className={`text-sm ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>Tanpa Epic</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleApplySuggestions}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Terapkan Rekomendasi
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isDark 
                  ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              placeholder="Masukkan judul ticket"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Deskripsi
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe the ticket in detail..."
              minHeight="150px"
              isDark={isDark}
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Tipe
              </label>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                {ticketTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 rounded-xl border transition-all ${
                      formData.type === type.value
                        ? isDark ? 'bg-dark-700 border-blue-500/50' : 'bg-blue-50 border-blue-500'
                        : isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    <span className={`text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Prioritas
              </label>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority.value })}
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 p-2 md:p-3 rounded-xl border transition-all ${
                      formData.priority === priority.value
                        ? isDark ? 'bg-dark-700 border-blue-500/50' : 'bg-blue-50 border-blue-500'
                        : isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                    <span className={`text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{priority.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Story Points & Sprint (only for non-epic types) */}
          {formData.type !== 'epic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Story Points */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-500" />
                    Story Points
                  </span>
                </label>
                <div className="flex gap-1 flex-wrap">
                  {storyPointOptions.map((points) => (
                    <button
                      key={points}
                      type="button"
                      onClick={() => setFormData({ ...formData, story_points: formData.story_points === String(points) ? '' : String(points) })}
                      className={`w-10 h-10 rounded-lg border transition-all text-sm font-medium ${
                        formData.story_points === String(points)
                          ? isDark ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-500 text-cyan-600'
                          : isDark ? 'bg-dark-800/50 border-dark-700 hover:border-dark-600 text-white' : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}
                    >
                      {points}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sprint */}
              {sprints.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-cyan-500" />
                      Sprint
                    </span>
                  </label>
                  <select
                    value={formData.sprint_id}
                    onChange={(e) => setFormData({ ...formData, sprint_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Backlog</option>
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name} {sprint.status === 'active' ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Epic (only for non-epic types) */}
          {formData.type !== 'epic' && epics.length > 0 && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Parent Epic
                </span>
              </label>
              <select
                value={formData.epic_id}
                onChange={(e) => setFormData({ ...formData, epic_id: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tanpa Epic</option>
                {epics.map((epic) => (
                  <option key={epic.id} value={epic.id}>
                    {epic.ticket_key} - {epic.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignees & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Assignee
                </span>
              </label>
              <AssigneeMultiSelect
                users={users}
                selectedIds={formData.assignee_ids}
                onChange={(ids) => setFormData({ ...formData, assignee_ids: ids })}
                isDark={isDark}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                Departemen
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark 
                    ? 'bg-dark-700 border-dark-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tidak ada</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Assignment Suggestion */}
          <AISuggestionPanel
            ticketType={formData.type}
            priority={formData.priority}
            departmentId={formData.department_id ? parseInt(formData.department_id) : null}
            title={formData.title}
            description={formData.description}
            selectedAssignees={formData.assignee_ids}
            onSelectAssignee={(userId) => {
              if (formData.assignee_ids.includes(userId)) {
                setFormData({ ...formData, assignee_ids: formData.assignee_ids.filter(id => id !== userId) });
              } else {
                setFormData({ ...formData, assignee_ids: [...formData.assignee_ids, userId] });
              }
            }}
          />

          {/* Asset Selection - Required for Maintenance, Optional for General */}
          {assets.length > 0 && (
            <div className={formData.category === 'maintenance' ? 'space-y-4' : ''}>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    Asset {formData.category === 'maintenance' ? '' : 'Terkait'}
                    {formData.category === 'maintenance' ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>(opsional)</span>
                    )}
                  </span>
                </label>
                <select
                  value={formData.asset_id}
                  onChange={(e) => {
                    const newAssetId = e.target.value;
                    setFormData({ ...formData, asset_id: newAssetId, failure_code_id: '' });
                    if (formData.category === 'maintenance' && newAssetId) {
                      fetchFailureCodesByAsset(newAssetId);
                    }
                  }}
                  required={formData.category === 'maintenance'}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isDark 
                      ? 'bg-dark-700 border-dark-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } ${formData.category === 'maintenance' && !formData.asset_id ? (isDark ? 'border-orange-500/50' : 'border-orange-300') : ''}`}
                >
                  <option value="">{formData.category === 'maintenance' ? 'Pilih asset yang bermasalah...' : 'Tidak ada asset terkait'}</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_code} - {asset.name} {asset.status !== 'operational' ? `(${asset.status})` : ''}
                    </option>
                  ))}
                </select>
                {formData.category !== 'maintenance' && (
                  <p className={`mt-1 text-xs ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>
                    Pilih asset jika ticket ini terkait dengan equipment/mesin tertentu
                  </p>
                )}
              </div>

              {/* Failure Code - Only for Maintenance with selected Asset */}
              {formData.category === 'maintenance' && formData.asset_id && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-red-500" />
                      Failure Code
                      <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>(sesuai tipe mesin)</span>
                    </span>
                  </label>
                  <select
                    value={formData.failure_code_id}
                    onChange={(e) => setFormData({ ...formData, failure_code_id: e.target.value })}
                    disabled={loadingFailureCodes}
                    className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      isDark 
                        ? 'bg-dark-700 border-dark-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    } ${loadingFailureCodes ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <option value="">
                      {loadingFailureCodes ? 'Memuat failure codes...' : 'Pilih failure code (opsional)'}
                    </option>
                    {failureCodes.map((fc) => (
                      <option key={fc.id} value={fc.id}>
                        [{fc.code}] {fc.category} - {fc.description}
                      </option>
                    ))}
                  </select>
                  {failureCodes.length > 0 && !loadingFailureCodes && (
                    <p className={`mt-1 text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      ✨ {failureCodes.length} kode tersedia untuk tipe mesin ini
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
              Tenggat Waktu
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isDark 
                  ? 'bg-dark-700 border-dark-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Actions */}
          <div className={`flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 md:pb-6 -mb-4 md:-mb-6 ${
            isDark ? 'border-dark-700 bg-dark-900' : 'border-gray-200 bg-white'
          }`}>
            <button 
              type="button" 
              onClick={onClose} 
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors w-full sm:w-auto ${
                isDark 
                  ? 'bg-dark-700 text-white hover:bg-dark-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Membuat...' : 'Buat Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
