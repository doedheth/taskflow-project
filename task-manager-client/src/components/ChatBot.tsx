import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  History,
  Plus,
  Trash2,
  ChevronLeft,
  Brain,
  Clock,
  Lightbulb,
  Wand2,
  FileText,
  AlertTriangle,
  Info,
  Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: { tool: string; params: Record<string, any> }[];
}

interface Conversation {
  id: number;
  title: string;
  messageCount: number;
  lastMessage?: string;
  updatedAt: string;
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface AISuggestion {
  type: 'urgent' | 'warning' | 'attention' | 'info' | 'action';
  text: string;
}

const defaultWelcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Halo! 👋 Saya TaskFlow AI, asisten profesional untuk manajemen proyek Anda.\n\nSaya dapat membantu Anda dengan:\n• Status dan statistik proyek\n• Informasi tiket dan sprint\n• Analisis beban kerja tim\n• Rekomendasi prioritas\n\nApa yang ingin Anda ketahui?',
  timestamp: new Date()
};

// FAQ Cache - Quick answers without API calls (AC5: FAQ Caching)
interface FAQEntry {
  patterns: string[];
  response: string;
}

const FAQ_CACHE: FAQEntry[] = [
  {
    patterns: ['cara', 'bagaimana', 'membuat wo', 'create wo', 'buat work order'],
    response: '📋 **Cara Membuat Work Order:**\n\n1. Buka menu **Work Orders** di sidebar\n2. Klik tombol **"+ Tambah WO"** di pojok kanan atas\n3. Isi form yang diperlukan:\n   • Pilih Asset yang akan dikerjakan\n   • Isi judul dan deskripsi pekerjaan\n   • Tentukan prioritas dan tipe WO\n   • Assign teknisi yang bertugas\n4. Klik **Simpan** untuk membuat WO\n\n💡 Tips: Gunakan AI Assistant untuk generate deskripsi WO yang detail!'
  },
  {
    patterns: ['cara', 'bagaimana', 'membuat tiket', 'create ticket', 'buat tiket'],
    response: '🎫 **Cara Membuat Tiket:**\n\n1. Buka menu **Tickets** di sidebar\n2. Klik tombol **"+ Buat Tiket"**\n3. Isi informasi tiket:\n   • Judul yang jelas dan deskriptif\n   • Deskripsi detail masalah/permintaan\n   • Pilih tipe (Bug, Task, Story, Epic)\n   • Tentukan prioritas\n4. Klik **Simpan**\n\n💡 Tips: AI akan otomatis menyarankan tipe dan prioritas berdasarkan judul!'
  },
  {
    patterns: ['login', 'masuk', 'tidak bisa', 'gagal login', 'lupa password'],
    response: '🔐 **Bantuan Login:**\n\nJika mengalami masalah login:\n\n1. **Pastikan email dan password benar** - perhatikan huruf besar/kecil\n2. **Lupa password?** Hubungi admin untuk reset password\n3. **Akun terkunci?** Tunggu 15 menit atau hubungi admin\n4. **Browser issue?** Coba clear cache atau gunakan browser lain\n\n📞 Hubungi IT Support jika masalah berlanjut.'
  },
  {
    patterns: ['apa itu', 'pengertian', 'definisi', 'mttr', 'mean time to repair'],
    response: '📊 **MTTR (Mean Time To Repair):**\n\nMTTR adalah rata-rata waktu yang dibutuhkan untuk memperbaiki mesin dari kondisi breakdown sampai kembali beroperasi.\n\n**Rumus:** MTTR = Total Waktu Perbaikan / Jumlah Perbaikan\n\n**Contoh:** Jika 3 perbaikan memakan waktu 2, 3, dan 4 jam, maka MTTR = 9/3 = 3 jam\n\n💡 Semakin rendah MTTR, semakin baik performa tim maintenance!'
  },
  {
    patterns: ['apa itu', 'pengertian', 'definisi', 'mtbf', 'mean time between failure'],
    response: '📊 **MTBF (Mean Time Between Failures):**\n\nMTBF adalah rata-rata waktu antara satu kegagalan mesin ke kegagalan berikutnya.\n\n**Rumus:** MTBF = Total Waktu Operasi / Jumlah Kegagalan\n\n**Contoh:** Jika mesin beroperasi 1000 jam dengan 4 kali breakdown, maka MTBF = 1000/4 = 250 jam\n\n💡 Semakin tinggi MTBF, semakin reliable mesin tersebut!'
  },
  {
    patterns: ['apa itu', 'pengertian', 'definisi', 'oee', 'overall equipment effectiveness'],
    response: '📊 **OEE (Overall Equipment Effectiveness):**\n\nOEE mengukur efektivitas total peralatan produksi.\n\n**Komponen:**\n• **Availability** = Waktu Operasi / Waktu Tersedia\n• **Performance** = Output Aktual / Output Ideal\n• **Quality** = Produk Bagus / Total Produk\n\n**Rumus:** OEE = Availability × Performance × Quality\n\n**Benchmark:** OEE > 85% = World Class!'
  },
  {
    patterns: ['shortcut', 'keyboard', 'pintasan'],
    response: '⌨️ **Keyboard Shortcuts:**\n\n• **Ctrl + K** - Quick search\n• **N** - New ticket/WO (di halaman list)\n• **Esc** - Close modal/panel\n• **?** - Show help\n\n💡 Shortcuts tersedia di semua halaman utama!'
  },
  {
    patterns: ['pm', 'preventive', 'maintenance', 'jadwal'],
    response: '🔧 **Preventive Maintenance (PM):**\n\nPM adalah jadwal pemeliharaan rutin untuk mencegah breakdown.\n\n**Cara Membuat Jadwal PM:**\n1. Buka **Maintenance Calendar**\n2. Klik **"+ Jadwal PM Baru"**\n3. Pilih asset dan frekuensi (harian/mingguan/bulanan)\n4. AI akan generate checklist otomatis!\n\n💡 Tips: PM rutin dapat mengurangi unplanned downtime hingga 50%!'
  }
];

/**
 * Check if user message matches any FAQ pattern
 * Returns cached response if match found, null otherwise
 */
const checkFAQCache = (message: string): string | null => {
  const lowerMessage = message.toLowerCase().trim();

  for (const faq of FAQ_CACHE) {
    // Count how many patterns match
    const matchCount = faq.patterns.filter(pattern =>
      lowerMessage.includes(pattern.toLowerCase())
    ).length;

    // Require at least 2 pattern matches for better accuracy
    if (matchCount >= 2) {
      return faq.response;
    }
  }

  return null;
};

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  
  const [messages, setMessages] = useState<Message[]>([defaultWelcomeMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [frequentTopics, setFrequentTopics] = useState<string[]>([]);
  
  // Context-aware state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'assist'>('chat');
  const [formatText, setFormatText] = useState('');
  const [formatType, setFormatType] = useState<'ticket_description' | 'work_order_description' | 'comment' | 'improve'>('improve');
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedResult, setFormattedResult] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);
  
  // Get current page name from location
  const getCurrentPage = useCallback(() => {
    const path = location.pathname;
    if (path.includes('/tickets/')) return 'ticket-detail';
    if (path.includes('/tickets')) return 'tickets';
    if (path.includes('/work-orders/')) return 'work-order-detail';
    if (path.includes('/work-orders')) return 'work-orders';
    if (path.includes('/downtime-tracker')) return 'downtime-tracker';
    if (path.includes('/production-downtime')) return 'production-downtime';
    if (path.includes('/maintenance-kpi')) return 'maintenance-kpi';
    if (path.includes('/production-kpi')) return 'production-kpi';
    if (path.includes('/board')) return 'kanban';
    if (path.includes('/assets')) return 'assets';
    if (path.includes('/maintenance')) return 'maintenance';
    if (path.includes('/production-schedule')) return 'production-schedule';
    return 'dashboard';
  }, [location.pathname]);
  
  // Extract entity ID from URL
  const getEntityId = useCallback(() => {
    const path = location.pathname;
    const match = path.match(/\/(tickets|work-orders)\/([^/]+)/);
    return match ? match[2] : undefined;
  }, [location.pathname]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load conversation when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !initRef.current) {
      initRef.current = true;
      loadInitialConversation();
    }
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);
  
  // Fetch context-aware suggestions when page changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isOpen || isMinimized) return;
      
      try {
        const page = getCurrentPage();
        const entityId = getEntityId();
        const data = await aiAPI.getSuggestions({ 
          page, 
          entity_id: entityId,
          entity_type: page.includes('ticket') ? 'ticket' : page.includes('work-order') ? 'work_order' : undefined
        });
        
        if (data.success) {
          setSuggestions(data.suggestions || []);
          setQuickQuestions(data.quickQuestions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };
    
    fetchSuggestions();
  }, [isOpen, isMinimized, location.pathname, getCurrentPage, getEntityId]);

  const loadInitialConversation = async () => {
    try {
      const data = await aiAPI.getConversation();
      if (data?.success) {
        if (data.conversation?.id) {
          setConversationId(data.conversation.id);
        }
        if (data.userContext?.frequentTopics) {
          setFrequentTopics(data.userContext.frequentTopics);
        }
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          const validMessages = data.messages
            .filter((m: any) => m && m.content)
            .map((m: any) => ({
              id: String(m.id || `msg-${Date.now()}-${Math.random()}`),
              role: m.role === 'user' ? 'user' : 'assistant' as const,
              content: String(m.content || ''),
              timestamp: new Date(m.timestamp || Date.now()),
              toolsUsed: Array.isArray(m.context?.toolsUsed) ? m.context.toolsUsed : undefined
            }));
          if (validMessages.length > 0) {
            setMessages(validMessages);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // Keep default message
    }
  };

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const data = await aiAPI.getConversations(20);
      if (data?.success && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setError(null);

    // Check FAQ cache first (AC5: FAQ Caching - reduce API costs)
    const cachedResponse = checkFAQCache(userInput);
    if (cachedResponse) {
      // FAQ hit - respond instantly without API call
      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: cachedResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

    // No FAQ match - call AI API
    setIsLoading(true);

    try {
      const response = await aiAPI.smartChat(userInput, conversationId || undefined);

      if (response?.response) {
        const assistantMessage: Message = {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          toolsUsed: response.toolsUsed
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || 'Gagal menghubungi AI. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = async () => {
    try {
      const data = await aiAPI.newConversation();
      if (data?.success) {
        setConversationId(data.conversation?.id || null);
        setMessages([{
          id: String(Date.now()),
          role: 'assistant',
          content: 'Percakapan baru dimulai. Ada yang bisa saya bantu?',
          timestamp: new Date()
        }]);
        setShowHistory(false);
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleSwitchConversation = async (id: number) => {
    try {
      const data = await aiAPI.activateConversation(id);
      if (data?.success && Array.isArray(data.messages)) {
        setConversationId(id);
        const validMessages = data.messages
          .filter((m: any) => m && m.content)
          .map((m: any) => ({
            id: String(m.id || `msg-${Date.now()}-${Math.random()}`),
            role: m.role === 'user' ? 'user' : 'assistant' as const,
            content: String(m.content || ''),
            timestamp: new Date(m.timestamp || Date.now()),
            toolsUsed: Array.isArray(m.context?.toolsUsed) ? m.context.toolsUsed : undefined
          }));
        if (validMessages.length > 0) {
          setMessages(validMessages);
        }
        setShowHistory(false);
      }
    } catch (err) {
      console.error('Failed to switch conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiAPI.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Context-aware quick actions
  const getQuickActions = useCallback(() => {
    const page = getCurrentPage();
    const isManager = user?.role === 'admin' || user?.role === 'manager';
    
    // Base actions
    const baseActions = [
      { label: 'Status Proyek', query: 'Bagaimana status proyek saat ini?' }
    ];
    
    // Page-specific actions
    switch (page) {
      case 'tickets':
      case 'ticket-detail':
        return [
          { label: 'Tiket Terlambat', query: 'Tampilkan tiket yang sudah terlambat' },
          { label: 'Saran Assignee', query: 'Siapa yang cocok untuk handle tiket ini?' },
          { label: 'Progress Tim', query: 'Bagaimana progress tim minggu ini?' },
          ...(isManager ? [{ label: 'Bottleneck', query: 'Apa saja bottleneck tim saat ini?' }] : [])
        ];
      
      case 'work-orders':
      case 'work-order-detail':
        return [
          { label: 'WO Terlambat', query: 'Tampilkan work order yang terlambat' },
          { label: 'Performa Teknisi', query: 'Bagaimana performa teknisi minggu ini?' },
          { label: 'Asset Bermasalah', query: 'Asset mana yang sering breakdown?' },
          ...(isManager ? [{ label: 'Jadwal PM', query: 'Jadwal preventive maintenance yang terlewat?' }] : [])
        ];
      
      case 'downtime-tracker':
      case 'production-downtime':
        return [
          { label: 'Downtime Aktif', query: 'Berapa downtime yang sedang aktif?' },
          { label: 'Top Penyebab', query: 'Apa penyebab downtime terbanyak minggu ini?' },
          { label: 'Analisis Asset', query: 'Asset mana dengan downtime tertinggi?' }
        ];
      
      case 'maintenance-kpi':
      case 'production-kpi':
        return [
          { label: 'KPI Overview', query: 'Ringkasan KPI bulan ini' },
          { label: 'Trend Downtime', query: 'Bagaimana trend downtime 30 hari terakhir?' },
          { label: 'Efisiensi', query: 'Berapa efisiensi produksi minggu ini?' },
          ...(isManager ? [{ label: 'Rekomendasi', query: 'Apa rekomendasi untuk meningkatkan efisiensi?' }] : [])
        ];
      
      case 'assets':
      case 'maintenance':
        return [
          { label: 'Kesehatan Asset', query: 'Bagaimana kesehatan asset kritis?' },
          { label: 'PM Mendatang', query: 'Jadwal maintenance minggu depan' },
          { label: 'History', query: 'Asset dengan maintenance terbanyak?' }
        ];
      
      default:
        return baseActions;
    }
  }, [getCurrentPage, user?.role]);
  
  // Handle text formatting
  const handleFormatText = async () => {
    if (!formatText.trim()) return;
    
    setIsFormatting(true);
    setFormattedResult('');
    
    try {
      const result = await aiAPI.formatText({
        text: formatText,
        format_type: formatType,
        language: 'id'
      });
      
      if (result.success) {
        setFormattedResult(result.formatted);
      }
    } catch (err) {
      console.error('Format error:', err);
      setError('Gagal memformat teks');
    } finally {
      setIsFormatting(false);
    }
  };
  
  // Copy formatted result
  const copyFormattedResult = () => {
    navigator.clipboard.writeText(formattedResult);
  };
  
  const quickActions = getQuickActions();

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      if (diffDays < 7) return `${diffDays}h lalu`;
      return date.toLocaleDateString('id-ID');
    } catch {
      return '';
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return createPortal(
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-[9999] transition-all duration-300 hover:scale-110 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        title="TaskFlow AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>,
      document.body
    );
  }

  // Main chat window - use portal to render at body level
  return createPortal(
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex flex-col shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 ${
        isMinimized ? 'w-80 h-14' : 'w-96 h-[550px]'
      } ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0"
        onClick={() => !showHistory && setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          {showHistory ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowHistory(false); }}
              className="p-1 hover:bg-white/20 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white text-sm">
              {showHistory ? 'Riwayat Chat' : 'TaskFlow AI'}
            </h3>
            {!isMinimized && !showHistory && (
              <p className="text-xs text-white/70 flex items-center gap-1">
                <Brain className="w-3 h-3" /> Smart Assistant
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!showHistory && !isMinimized && (
            <button
              onClick={(e) => { e.stopPropagation(); loadConversations(); setShowHistory(true); }}
              className="p-1.5 hover:bg-white/20 rounded-lg"
              title="Riwayat Chat"
            >
              <History className="w-4 h-4 text-white" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1.5 hover:bg-white/20 rounded-lg"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-1.5 hover:bg-white/20 rounded-lg"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <div className="flex flex-col flex-1 min-h-0">
          {showHistory ? (
            /* History View */
            <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <div className={`p-3 border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleNewConversation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <Plus className="w-4 h-4" /> Percakapan Baru
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada riwayat</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSwitchConversation(conv.id)}
                      className={`p-3 rounded-xl cursor-pointer group ${
                        conv.id === conversationId
                          ? isDark ? 'bg-indigo-600/30 border border-indigo-500' : 'bg-indigo-100 border border-indigo-300'
                          : isDark ? 'hover:bg-gray-700' : 'hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {conv.title}
                          </p>
                          <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(conv.updatedAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600/30 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {frequentTopics.length > 0 && (
                <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <p className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Brain className="w-3 h-3" /> Topik Sering Ditanyakan
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {frequentTopics.slice(0, 5).map((topic, i) => (
                      <span key={i} className={`px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Chat View */
            <>
              {/* Suggestions Bar - Show alerts/warnings if any */}
              {showSuggestions && suggestions.length > 0 && (
                <div className={`px-3 py-2 border-b flex-shrink-0 ${isDark ? 'border-gray-700 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${suggestions[0].type === 'urgent' ? 'text-red-500' : suggestions[0].type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <span className="text-xs font-medium truncate max-w-[260px]">{suggestions[0].text}</span>
                      {suggestions.length > 1 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          +{suggestions.length - 1}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowSuggestions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Tabs */}
              <div className={`flex border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-2 text-xs font-medium flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? isDark ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-800/50' : 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('assist')}
                  className={`flex-1 px-4 py-2 text-xs font-medium flex items-center justify-center gap-1.5 ${
                    activeTab === 'assist'
                      ? isDark ? 'text-indigo-400 border-b-2 border-indigo-400 bg-gray-800/50' : 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                      : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Format Teks
                </button>
              </div>
              
              {activeTab === 'chat' ? (
                <>
                  {/* Quick Actions */}
                  <div className={`px-3 py-2 border-b flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => { setInput(action.query); inputRef.current?.focus(); }}
                          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                            isDark
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                    {/* Dynamic quick questions from context */}
                    {quickQuestions.length > 0 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
                        {quickQuestions.slice(0, 3).map((q, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(q); handleSend(); }}
                            className={`px-2 py-1 text-[10px] rounded-lg whitespace-nowrap flex items-center gap-1 ${
                              isDark ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                            }`}
                          >
                            <Lightbulb className="w-3 h-3" />
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

              {/* Messages */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50/50'}`}>
                {messages.filter(m => m && m.id && m.content).map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'assistant'
                        ? 'bg-indigo-600'
                        : isDark ? 'bg-gray-600' : 'bg-gray-400'
                    }`}>
                      {message.role === 'assistant' ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'assistant'
                        ? isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {message.role === 'assistant' && Array.isArray(message.toolsUsed) && message.toolsUsed.length > 0 && (
                        <div className={`flex items-center gap-1 mb-2 pb-2 border-b text-xs ${isDark ? 'border-gray-600 text-indigo-400' : 'border-gray-200 text-indigo-600'}`}>
                          🔍 {message.toolsUsed
                            .filter(t => t && typeof t === 'object' && t.tool)
                            .map(t => String(t.tool || '').replace(/_/g, ' '))
                            .join(', ') || 'Data Query'}
                        </div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${message.role === 'assistant' ? 'text-gray-400' : 'text-white/70'}`}>
                        {message.timestamp instanceof Date ? message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Menganalisis...</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewConversation}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
                    title="Percakapan baru"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tanyakan tentang proyek..."
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none ${
                      isDark
                        ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500'
                        : 'bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-indigo-300'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`p-2.5 rounded-xl ${
                      input.trim() && !isLoading
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  TaskFlow AI • Smart Assistant
                </p>
              </div>
                </>
              ) : (
                /* Text Formatting Tab */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Format Type Selection */}
                  <div className={`px-3 py-2 border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Tipe Format
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: 'ticket_description', label: 'Tiket' },
                        { value: 'work_order_description', label: 'Work Order' },
                        { value: 'comment', label: 'Komentar' },
                        { value: 'improve', label: 'Perbaiki' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFormatType(opt.value as typeof formatType)}
                          className={`px-2.5 py-1 text-xs rounded-lg ${
                            formatType === opt.value
                              ? 'bg-indigo-600 text-white'
                              : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Input Text Area */}
                  <div className="flex-1 p-3 overflow-y-auto">
                    <div className="mb-3">
                      <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Teks Asli
                      </label>
                      <textarea
                        value={formatText}
                        onChange={(e) => setFormatText(e.target.value)}
                        placeholder="Masukkan teks yang ingin diformat..."
                        rows={4}
                        className={`w-full px-3 py-2 text-sm rounded-lg resize-none ${
                          isDark
                            ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                            : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'
                        } border focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      />
                    </div>
                    
                    {/* Format Button */}
                    <button
                      onClick={handleFormatText}
                      disabled={!formatText.trim() || isFormatting}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                        formatText.trim() && !isFormatting
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isFormatting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memformat...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Format dengan AI
                        </>
                      )}
                    </button>
                    
                    {/* Formatted Result */}
                    {formattedResult && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Hasil Format (HTML)
                          </label>
                          <button
                            onClick={copyFormattedResult}
                            className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                          >
                            📋 Copy
                          </button>
                        </div>
                        <div className={`p-3 rounded-lg text-xs overflow-auto max-h-40 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          <pre className="whitespace-pre-wrap font-mono">{formattedResult}</pre>
                        </div>
                        
                        {/* Preview */}
                        <div className="mt-2">
                          <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Preview
                          </label>
                          <div 
                            className={`p-3 rounded-lg text-sm prose prose-sm max-w-none ${isDark ? 'bg-gray-800 prose-invert' : 'bg-white border border-gray-200'}`}
                            dangerouslySetInnerHTML={{ __html: formattedResult }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tips */}
                  <div className={`px-3 py-2 border-t flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start gap-2">
                      <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        AI akan memformat teks Anda menjadi HTML terstruktur yang siap digunakan di tiket atau work order.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};

export default ChatBot;
