import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Wand2, Loader2, X, Copy, Check, RefreshCw, Database, AlertCircle, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAIFeature, AI_FEATURES } from '../context/AIFeatureContext';
import { aiAPI } from '../services/api';
import RichTextEditor, { RichTextViewer } from './RichTextEditor';

interface RichContext {
  ticket?: {
    id: number;
    ticket_number: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    department?: string;
    asset_name?: string;
    asset_code?: string;
    recent_comments?: Array<{ content: string; author: string; date: string }>;
  };
  asset?: {
    id: number;
    name: string;
    code: string;
    category?: string;
    model?: string;
    manufacturer?: string;
    status: string;
    criticality: string;
    specifications?: string;
    common_issues?: Array<{ issue: string; code: string; count: number }>;
    recent_work_orders?: Array<{
      wo_number: string;
      title: string;
      type: string;
      status: string;
      priority: string;
      root_cause?: string;
      solution?: string;
      date: string;
    }>;
    recent_downtime?: Array<{
      reason: string;
      type: string;
      classification?: string;
      start: string;
      end?: string;
    }>;
  };
  work_order?: {
    wo_number: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    description: string;
    asset_name?: string;
    asset_code?: string;
  };
}

interface AIWritingAssistantProps {
  value: string;
  onChange: (value: string) => void;
  context?: {
    type?: 'ticket' | 'work_order' | 'comment' | 'downtime';
    title?: string;
    asset?: string;
    priority?: string;
    category?: string;
  };
  // Rich context IDs for database lookup
  ticketId?: number;
  assetId?: number;
  workOrderId?: number;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  value,
  onChange,
  context,
  ticketId,
  assetId,
  workOrderId,
  placeholder = 'Masukkan deskripsi...',
  className = '',
  minHeight = '120px'
}) => {
  const { isDark } = useTheme();
  const { isFeatureEnabled, isLoading: featureLoading } = useAIFeature();
  const isWritingAssistantEnabled = isFeatureEnabled(AI_FEATURES.WRITING_ASSISTANT);
  const [showPopover, setShowPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [richContext, setRichContext] = useState<RichContext | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch rich context when popover opens
  useEffect(() => {
    if (showPopover && (ticketId || assetId || workOrderId)) {
      fetchRichContext();
    }
  }, [showPopover, ticketId, assetId, workOrderId]);

  const fetchRichContext = async () => {
    if (!ticketId && !assetId && !workOrderId) return;
    
    setIsLoadingContext(true);
    setContextError(null);
    
    try {
      const response = await aiAPI.getWritingContext({
        scope: context?.type || 'general',
        ticket_id: ticketId,
        asset_id: assetId,
        work_order_id: workOrderId
      });
      
      if (response.success) {
        setRichContext(response.context);
      }
    } catch (error) {
      console.error('Failed to fetch rich context:', error);
      setContextError('Gagal mengambil konteks dari database');
    } finally {
      setIsLoadingContext(false);
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick prompts based on context
  const getQuickPrompts = () => {
    const basePrompts = [
      { label: 'Perbaiki teks', action: 'improve' },
      { label: 'Buat lebih detail', action: 'expand' },
      { label: 'Ringkas', action: 'summarize' }
    ];

    switch (context?.type) {
      case 'ticket':
        return [
          { label: 'Buat deskripsi tiket', action: 'generate_ticket' },
          { label: 'Tambah langkah reproduksi', action: 'add_steps' },
          ...basePrompts
        ];
      case 'work_order':
        return [
          { label: 'Buat scope pekerjaan', action: 'generate_wo' },
          { label: 'Tambah checklist', action: 'add_checklist' },
          { label: 'Tambah safety notes', action: 'add_safety' },
          { label: 'Referensi histori', action: 'reference_history' },
          ...basePrompts
        ];
      case 'downtime':
        return [
          { label: 'Jelaskan masalah', action: 'explain_issue' },
          { label: 'Tambah detail teknis', action: 'add_technical' },
          { label: 'Analisis pola', action: 'analyze_pattern' },
          ...basePrompts
        ];
      case 'comment':
        return [
          { label: 'Buat update progress', action: 'generate_update' },
          { label: 'Buat ringkasan', action: 'generate_summary' },
          ...basePrompts
        ];
      default:
        return basePrompts;
    }
  };

  const handleQuickPrompt = async (action: string) => {
    setIsLoading(true);
    setSuggestion('');

    try {
      let promptText = '';
      const contextInfo = [];
      
      if (context?.title) contextInfo.push(`Judul: ${context.title}`);
      if (context?.asset) contextInfo.push(`Asset: ${context.asset}`);
      if (context?.priority) contextInfo.push(`Prioritas: ${context.priority}`);
      if (context?.category) contextInfo.push(`Kategori: ${context.category}`);
      
      const contextStr = contextInfo.length > 0 ? `\n\nKonteks:\n${contextInfo.join('\n')}` : '';

      // Strip HTML tags for context
      const plainValue = value ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

      switch (action) {
        case 'generate_ticket':
          promptText = `Buat deskripsi tiket yang detail dan terstruktur dalam format HTML.${contextStr}${plainValue ? `\n\nDraf awal: ${plainValue}` : ''}`;
          break;
        case 'generate_wo':
          promptText = `Buat deskripsi work order maintenance yang detail termasuk scope pekerjaan dan langkah-langkah dalam format HTML. Gunakan histori perbaikan sebelumnya sebagai referensi jika relevan.${contextStr}${plainValue ? `\n\nDraf awal: ${plainValue}` : ''}`;
          break;
        case 'add_steps':
          promptText = `Tambahkan langkah-langkah reproduksi bug atau prosedur ke deskripsi ini dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'add_checklist':
          promptText = `Tambahkan checklist pekerjaan ke deskripsi work order ini dalam format HTML dengan bullet points. Referensikan prosedur dari perbaikan sebelumnya jika ada:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'add_safety':
          promptText = `Tambahkan catatan keselamatan kerja (safety notes) yang relevan dengan asset dan jenis pekerjaan ini dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'reference_history':
          promptText = `Berdasarkan histori perbaikan dan downtime sebelumnya pada asset ini, buat deskripsi work order yang memasukkan pembelajaran dan solusi yang sudah terbukti efektif. Format dalam HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'explain_issue':
          promptText = `Jelaskan masalah/issue ini dengan lebih detail dan teknis dalam format HTML. Jika ada pola masalah serupa sebelumnya, referensikan:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'add_technical':
          promptText = `Tambahkan detail teknis yang relevan dengan spesifikasi asset ke deskripsi ini dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'analyze_pattern':
          promptText = `Analisis pola downtime pada asset ini berdasarkan histori sebelumnya. Identifikasi kemungkinan root cause dan berikan rekomendasi pencegahan dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'generate_update':
          promptText = `Buat update progress yang profesional dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'generate_summary':
          promptText = `Buat ringkasan dari teks ini dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'improve':
          promptText = `Perbaiki dan rapikan teks ini agar lebih jelas dan profesional dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'expand':
          promptText = `Kembangkan teks ini dengan lebih detail dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        case 'summarize':
          promptText = `Ringkas teks ini menjadi lebih singkat namun tetap informatif dalam format HTML:\n\n${plainValue || 'Tidak ada teks'}${contextStr}`;
          break;
        default:
          promptText = plainValue || '';
      }

      const result = await aiAPI.writeAssist({
        prompt: promptText,
        type: context?.type === 'work_order' ? 'wo_description' : 
              context?.type === 'ticket' ? 'ticket_description' : 
              context?.type === 'comment' ? 'comment' : undefined,
        context: contextStr,
        richContext: richContext || undefined
      });

      if (result.success) {
        setSuggestion(result.result);
      }
    } catch (error) {
      console.error('AI assist error:', error);
      setSuggestion('<p>Gagal mendapatkan saran. Silakan coba lagi.</p>');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setSuggestion('');

    // Strip HTML tags for context
    const plainValue = value ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

    try {
      const result = await aiAPI.writeAssist({
        prompt: `${prompt}\n\nTeks saat ini: ${plainValue || '(kosong)'}\n\nBerikan hasil dalam format HTML.`,
        type: context?.type === 'work_order' ? 'wo_description' : 
              context?.type === 'ticket' ? 'ticket_description' : undefined,
        richContext: richContext || undefined
      });

      if (result.success) {
        setSuggestion(result.result);
      }
    } catch (error) {
      console.error('AI assist error:', error);
      setSuggestion('<p>Gagal mendapatkan saran. Silakan coba lagi.</p>');
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = () => {
    onChange(suggestion);
    setShowPopover(false);
    setSuggestion('');
  };

  const copySuggestion = () => {
    // Copy as plain text
    const plainText = suggestion.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Context summary display
  const getContextSummary = () => {
    if (!richContext) return null;
    
    const items = [];
    if (richContext.ticket) {
      items.push(`Tiket: ${richContext.ticket.ticket_number}`);
    }
    if (richContext.asset) {
      items.push(`Asset: ${richContext.asset.name}`);
      if (richContext.asset.recent_work_orders?.length) {
        items.push(`${richContext.asset.recent_work_orders.length} WO histori`);
      }
      if (richContext.asset.common_issues?.length) {
        items.push(`${richContext.asset.common_issues.length} masalah umum`);
      }
    }
    if (richContext.work_order) {
      items.push(`WO: ${richContext.work_order.wo_number}`);
    }
    return items;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* RichTextEditor with AI button */}
      <div className="relative">
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          isDark={isDark}
        />

        {/* AI Button - positioned in top right */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => isWritingAssistantEnabled && setShowPopover(!showPopover)}
          disabled={!isWritingAssistantEnabled && !featureLoading}
          className={`absolute top-1 right-1 p-1.5 rounded-lg transition-colors z-10 ${
            !isWritingAssistantEnabled && !featureLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : showPopover
              ? 'bg-indigo-600 text-white'
              : isDark
                ? 'bg-gray-700 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
          }`}
          title={isWritingAssistantEnabled ? 'AI Writing Assistant' : 'AI Writing Assistant tidak tersedia untuk role Anda'}
        >
          {!isWritingAssistantEnabled && !featureLoading ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* AI Popover */}
      {showPopover && isWritingAssistantEnabled && (
        <div
          ref={popoverRef}
          className={`absolute right-0 top-full mt-2 w-96 rounded-xl shadow-xl z-50 overflow-hidden border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Writing Assistant
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Context Status */}
          {(ticketId || assetId || workOrderId) && (
            <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-600 bg-gray-700/80' : 'border-blue-200 bg-blue-50'}`}>
              <div className="flex items-center gap-1.5">
                <Database className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span className={`text-[11px] font-medium ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                  Konteks
                </span>
                {isLoadingContext && (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                )}
              </div>
              {contextError ? (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-red-400">
                  <AlertCircle className="w-2.5 h-2.5" />
                  {contextError}
                </div>
              ) : richContext && (
                <div className={`mt-1 text-[11px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-blue-600'}`}>
                  {getContextSummary()?.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Quick Prompts */}
          <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {getQuickPrompts().map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(qp.action)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Custom Request
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomPrompt()}
                placeholder="Minta AI untuk..."
                className={`flex-1 px-3 py-1.5 text-sm rounded-lg ${
                  isDark
                    ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200'
                } border focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              <button
                type="button"
                onClick={handleCustomPrompt}
                disabled={isLoading || !prompt.trim()}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Result Area */}
          <div className="p-3 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Generating with context...
                </span>
              </div>
            ) : suggestion ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Preview
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('improve')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Regenerate"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button
                      type="button"
                      onClick={copySuggestion}
                      className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Copy as plain text"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Preview as rendered HTML */}
                <div 
                  className={`p-3 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-700/80 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <RichTextViewer content={suggestion} isDark={Boolean(isDark)} compact={true} />
                </div>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500"
                >
                  Gunakan Saran Ini
                </button>
              </div>
            ) : (
              <div className={`text-center py-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Pilih quick action atau tulis permintaan</p>
                <p className="text-xs mt-1">
                  {richContext ? 'AI akan menggunakan konteks dari database' : 'untuk mendapatkan saran dari AI'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWritingAssistant;
