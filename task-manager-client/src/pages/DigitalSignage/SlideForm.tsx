import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Save, ArrowLeft, Video, Image as ImageIcon, FileText, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { TextBlock } from '../../types/digitalSignage';

const SlideForm: React.FC = () => {
  const { playlistId, slideId } = useParams<{ playlistId: string, slideId?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'image' as const,
    content: '',
    duration: 10,
    order_index: 0,
    metadata: {
      bg_color: '#000000',
      text_blocks: [
        {
          id: '1',
          text: '',
          font_family: 'Inter, sans-serif',
          font_size: '60',
          animation: 'fade' as const,
          animation_speed: 1,
          text_color: '#ffffff',
          position: 'middle' as const
        }
      ] as TextBlock[]
    }
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!slideId);
  const [previewKey, setPreviewKey] = useState(0);
  const [expandedBlock, setExpandedBlock] = useState<string | null>('1');

  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [formData.metadata, formData.content]);

  useEffect(() => {
    if (slideId) {
      const fetchSlide = async () => {
        try {
          const data = await digitalSignageApi.getSlide(slideId);
          setFormData({
            title: data.title || '',
            type: data.type,
            content: data.content,
            duration: data.duration,
            order_index: data.order_index,
            metadata: {
              bg_color: data.metadata?.bg_color || '#000000',
              text_blocks: data.metadata?.text_blocks || [
                {
                  id: '1',
                  text: data.content || '',
                  font_family: data.metadata?.font_family || 'Inter, sans-serif',
                  font_size: data.metadata?.font_size?.replace('rem', '') || '60',
                  animation: data.metadata?.animation || 'fade',
                  animation_speed: data.metadata?.animation_speed || 1,
                  text_color: data.metadata?.text_color || '#ffffff',
                  position: 'middle'
                }
              ]
            }
          });
          if (data.metadata?.text_blocks && data.metadata.text_blocks.length > 0) {
            setExpandedBlock(data.metadata.text_blocks[0].id);
          }
        } catch (error) {
          console.error('Failed to fetch slide:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchSlide();
    }
  }, [slideId]);

  const addBlock = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newBlock: TextBlock = {
      id: newId,
      text: '',
      font_family: 'Inter, sans-serif',
      font_size: '40',
      animation: 'fade',
      animation_speed: 1,
      text_color: '#ffffff',
      position: 'middle'
    };
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        text_blocks: [...(formData.metadata.text_blocks || []), newBlock]
      }
    });
    setExpandedBlock(newId);
  };

  const removeBlock = (id: string) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        text_blocks: (formData.metadata.text_blocks || []).filter(b => b.id !== id)
      }
    });
  };

  const updateBlock = (id: string, updates: Partial<TextBlock>) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        text_blocks: (formData.metadata.text_blocks || []).map(b => b.id === id ? { ...b, ...updates } : b)
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) return;
    setLoading(true);
    
    // For backward compatibility and searchability, we use the first block's text as the main content
    const mainContent = formData.type === 'text' 
      ? (formData.metadata.text_blocks?.[0]?.text || '') 
      : formData.content;

    try {
      const payload = { ...formData, content: mainContent, playlist_id: playlistId };
      if (slideId) {
        await digitalSignageApi.updateSlide(slideId, payload);
      } else {
        await digitalSignageApi.createSlide(payload);
      }
      navigate(`/admin/digital-signage/playlists/${playlistId}/slides`);
    } catch (error) {
      console.error('Failed to save slide:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-center">Loading slide data...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/admin/digital-signage/playlists/${playlistId}/slides`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{slideId ? 'Edit Slide' : 'Add New Slide'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Slide Title</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Summer Special"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Content Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'image', icon: ImageIcon, label: 'Image' },
                  { id: 'video', icon: Video, label: 'Video' },
                  { id: 'text', icon: FileText, label: 'Text' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: item.id as any })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.type === item.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <item.icon size={24} />
                    <span className="text-xs font-bold uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Duration (seconds)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {formData.type === 'text' ? 'Message Content' : 'Media URL'}
            </label>
            {formData.type === 'text' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-500" size={20} />
                    <span className="font-bold text-blue-700">Text Blocks ({formData.metadata.text_blocks?.length || 0})</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={addBlock}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} /> Add Block
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.metadata.text_blocks || []).map((block, index) => (
                    <div key={block.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div 
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="font-bold text-gray-700 truncate max-w-[200px]">
                            {block.text || `Block ${index + 1}`}
                          </span>
                          <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-500 uppercase font-bold">
                            {block.position}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          {expandedBlock === block.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </div>
                      </div>

                      {expandedBlock === block.id && (
                        <div className="p-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                            placeholder="Enter text content..."
                            rows={3}
                            value={block.text}
                            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Position</label>
                              <select
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                value={block.position}
                                onChange={(e) => updateBlock(block.id, { position: e.target.value as any })}
                              >
                                <option value="top">Top</option>
                                <option value="middle">Middle</option>
                                <option value="bottom">Bottom</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Font Size (px)</label>
                              <input
                                type="number"
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                value={block.font_size}
                                onChange={(e) => updateBlock(block.id, { font_size: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Font Family</label>
                              <select
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                value={block.font_family}
                                onChange={(e) => updateBlock(block.id, { font_family: e.target.value })}
                              >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Playfair Display', serif">Playfair</option>
                                <option value="'Courier New', monospace">Courier</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Animation</label>
                              <select
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                value={block.animation}
                                onChange={(e) => updateBlock(block.id, { animation: e.target.value as any })}
                              >
                                <option value="fade">Fade In</option>
                                <option value="slide-up">Slide Up</option>
                                <option value="zoom">Zoom In</option>
                                <option value="typewriter">Typewriter</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Speed (s)</label>
                              <input
                                type="number"
                                step="0.1"
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                value={block.animation_speed}
                                onChange={(e) => updateBlock(block.id, { animation_speed: Number(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Text Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  className="w-10 h-9 p-1 rounded border border-gray-200 bg-white"
                                  value={block.text_color}
                                  onChange={(e) => updateBlock(block.id, { text_color: e.target.value })}
                                />
                                <input
                                  type="text"
                                  className="flex-1 p-2 border border-gray-200 rounded-lg text-xs"
                                  value={block.text_color}
                                  onChange={(e) => updateBlock(block.id, { text_color: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Slide Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      className="w-12 h-10 p-1 rounded border border-gray-200 bg-white"
                      value={formData.metadata.bg_color}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        metadata: { ...formData.metadata, bg_color: e.target.value } 
                      })}
                    />
                    <input
                      type="text"
                      className="w-32 p-2 border border-gray-200 rounded-lg bg-white text-sm"
                      value={formData.metadata.bg_color}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        metadata: { ...formData.metadata, bg_color: e.target.value } 
                      })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., https://example.com/image.jpg"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            )}
          </div>

          {formData.type === 'text' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Live Preview
              </h3>
              
              <div 
                className="rounded-xl flex flex-col min-h-[400px] border border-gray-200 overflow-hidden relative shadow-inner" 
                style={{ backgroundColor: formData.metadata.bg_color }}
              >
                <style>
                  {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    @keyframes typewriter { from { width: 0; } to { width: 100%; } }
                    
                    .preview-fade { animation: fadeIn var(--speed) ease-out forwards; }
                    .preview-slide-up { animation: slideUp var(--speed) ease-out forwards; }
                    .preview-zoom { animation: zoomIn var(--speed) ease-out forwards; }
                    .preview-typewriter { 
                      overflow: hidden; 
                      white-space: pre; 
                      border-right: 3px solid white; 
                      animation: typewriter var(--speed) steps(40, end) forwards; 
                    }
                  `}
                </style>

                <div className="flex-1 flex flex-col w-full h-full p-8" key={previewKey}>
                  {/* Top Slot */}
                  <div className="flex-1 flex items-start justify-center overflow-hidden">
                    {(formData.metadata.text_blocks || []).filter(b => b.position === 'top').map(block => (
                      <div 
                        key={block.id}
                        className={`text-center font-bold preview-${block.animation}`}
                        style={{ 
                          fontFamily: block.font_family, 
                          fontSize: `${Number(block.font_size) * 0.5}px`, // Scaled for preview
                          color: block.text_color,
                          '--speed': `${block.animation_speed}s`
                        } as any}
                      >
                        {block.text}
                      </div>
                    ))}
                  </div>

                  {/* Middle Slot */}
                  <div className="flex-[2] flex flex-col items-center justify-center overflow-hidden">
                    {(formData.metadata.text_blocks || []).filter(b => b.position === 'middle').map(block => (
                      <div 
                        key={block.id}
                        className={`text-center font-black preview-${block.animation} my-2`}
                        style={{ 
                          fontFamily: block.font_family, 
                          fontSize: `${Number(block.font_size) * 0.5}px`, // Scaled for preview
                          color: block.text_color,
                          '--speed': `${block.animation_speed}s`,
                          whiteSpace: block.animation === 'typewriter' ? 'nowrap' : 'pre-wrap'
                        } as any}
                      >
                        {block.text}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Slot */}
                  <div className="flex-1 flex items-end justify-center overflow-hidden">
                    {(formData.metadata.text_blocks || []).filter(b => b.position === 'bottom').map(block => (
                      <div 
                        key={block.id}
                        className={`text-center font-bold preview-${block.animation}`}
                        style={{ 
                          fontFamily: block.font_family, 
                          fontSize: `${Number(block.font_size) * 0.5}px`, // Scaled for preview
                          color: block.text_color,
                          '--speed': `${block.animation_speed}s`
                        } as any}
                      >
                        {block.text}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="absolute bottom-4 right-4 text-[10px] bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded-md uppercase tracking-wider font-bold backdrop-blur-sm"
                >
                  Replay Animation
                </button>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? (slideId ? 'Saving...' : 'Adding...') : (slideId ? 'Save Changes' : 'Add Slide')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SlideForm;
