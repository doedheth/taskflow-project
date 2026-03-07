import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import ImageLightbox from './ImageLightbox';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  isDark?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  readOnly = false,
  minHeight = '200px',
  isDark = true,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Image upload handler
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      try {
        toast.loading('Uploading image...', { id: 'upload' });
        const response = await uploadAPI.uploadImage(file);
        const imageUrl = `${import.meta.env.VITE_API_URL || ''}${response.data.url}`;

        // Get quill editor instance
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        }

        toast.success('Image uploaded!', { id: 'upload' });
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image', { id: 'upload' });
      }
    };
  }, []);

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [imageHandler]
  );

  // Quill formats
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'blockquote',
    'code-block',
    'link',
    'image',
  ];

  const darkEditorStyles = `
    .rich-text-editor-dark .ql-toolbar {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgb(51, 65, 85);
      border-radius: 12px 12px 0 0;
      padding: 8px;
    }
    
    .rich-text-editor-dark .ql-container {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgb(51, 65, 85);
      border-top: none;
      border-radius: 0 0 12px 12px;
      min-height: ${minHeight};
      font-family: inherit;
      font-size: 14px;
    }
    
    .rich-text-editor-dark .ql-editor {
      color: #e2e8f0;
      min-height: ${minHeight};
    }
    
    .rich-text-editor-dark .ql-editor.ql-blank::before {
      color: rgb(100, 116, 139);
      font-style: normal;
    }
    
    .rich-text-editor-dark .ql-snow .ql-stroke {
      stroke: rgb(148, 163, 184);
    }
    
    .rich-text-editor-dark .ql-snow .ql-fill {
      fill: rgb(148, 163, 184);
    }
    
    .rich-text-editor-dark .ql-snow .ql-picker {
      color: rgb(148, 163, 184);
    }
    
    .rich-text-editor-dark .ql-snow .ql-picker-label:hover,
    .rich-text-editor-dark .ql-snow .ql-picker-label.ql-active,
    .rich-text-editor-dark .ql-snow button:hover,
    .rich-text-editor-dark .ql-snow button.ql-active {
      color: #3b82f6 !important;
    }
    
    .rich-text-editor-dark .ql-snow button:hover .ql-stroke,
    .rich-text-editor-dark .ql-snow button.ql-active .ql-stroke {
      stroke: #3b82f6 !important;
    }
    
    .rich-text-editor-dark .ql-snow button:hover .ql-fill,
    .rich-text-editor-dark .ql-snow button.ql-active .ql-fill {
      fill: #3b82f6 !important;
    }
    
    .rich-text-editor-dark .ql-snow .ql-picker-options {
      background: rgb(30, 41, 59);
      border: 1px solid rgb(51, 65, 85);
      border-radius: 8px;
    }
    
    .rich-text-editor-dark .ql-snow .ql-picker-item:hover,
    .rich-text-editor-dark .ql-snow .ql-picker-item.ql-selected {
      color: #3b82f6 !important;
    }
    
    .rich-text-editor-dark .ql-editor a {
      color: #3b82f6;
    }
    
    .rich-text-editor-dark .ql-editor img {
      max-width: 100%;
      border-radius: 8px;
      margin: 8px 0;
    }
    
    .rich-text-editor-dark .ql-editor pre.ql-syntax {
      background: rgb(15, 23, 42);
      color: #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
    }
    
    .rich-text-editor-dark .ql-editor blockquote {
      border-left: 4px solid #3b82f6;
      margin: 8px 0;
      padding-left: 16px;
      color: rgb(148, 163, 184);
    }
    
    .rich-text-editor-dark .ql-snow .ql-tooltip {
      background: rgb(30, 41, 59);
      border: 1px solid rgb(51, 65, 85);
      border-radius: 8px;
      color: #e2e8f0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    
    .rich-text-editor-dark .ql-snow .ql-tooltip input[type=text] {
      background: rgb(15, 23, 42);
      border: 1px solid rgb(51, 65, 85);
      border-radius: 6px;
      color: #e2e8f0;
      padding: 4px 8px;
    }
    
    .rich-text-editor-dark .ql-snow .ql-tooltip a.ql-action,
    .rich-text-editor-dark .ql-snow .ql-tooltip a.ql-remove {
      color: #3b82f6;
    }
  `;

  const lightEditorStyles = `
    .rich-text-editor-light .ql-toolbar {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px 12px 0 0;
      padding: 8px;
    }
    
    .rich-text-editor-light .ql-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 12px 12px;
      min-height: ${minHeight};
      font-family: inherit;
      font-size: 14px;
    }
    
    .rich-text-editor-light .ql-editor {
      color: #1f2937;
      min-height: ${minHeight};
    }
    
    .rich-text-editor-light .ql-editor.ql-blank::before {
      color: #9ca3af;
      font-style: normal;
    }
    
    .rich-text-editor-light .ql-snow .ql-stroke {
      stroke: #6b7280;
    }
    
    .rich-text-editor-light .ql-snow .ql-fill {
      fill: #6b7280;
    }
    
    .rich-text-editor-light .ql-snow .ql-picker {
      color: #6b7280;
    }
    
    .rich-text-editor-light .ql-snow .ql-picker-label:hover,
    .rich-text-editor-light .ql-snow .ql-picker-label.ql-active,
    .rich-text-editor-light .ql-snow button:hover,
    .rich-text-editor-light .ql-snow button.ql-active {
      color: #2563eb !important;
    }
    
    .rich-text-editor-light .ql-snow button:hover .ql-stroke,
    .rich-text-editor-light .ql-snow button.ql-active .ql-stroke {
      stroke: #2563eb !important;
    }
    
    .rich-text-editor-light .ql-snow button:hover .ql-fill,
    .rich-text-editor-light .ql-snow button.ql-active .ql-fill {
      fill: #2563eb !important;
    }
    
    .rich-text-editor-light .ql-snow .ql-picker-options {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .rich-text-editor-light .ql-snow .ql-picker-item:hover,
    .rich-text-editor-light .ql-snow .ql-picker-item.ql-selected {
      color: #2563eb !important;
    }
    
    .rich-text-editor-light .ql-editor a {
      color: #2563eb;
    }
    
    .rich-text-editor-light .ql-editor img {
      max-width: 100%;
      border-radius: 8px;
      margin: 8px 0;
    }
    
    .rich-text-editor-light .ql-editor pre.ql-syntax {
      background: #f3f4f6;
      color: #1f2937;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      border: 1px solid #e5e7eb;
    }
    
    .rich-text-editor-light .ql-editor blockquote {
      border-left: 4px solid #2563eb;
      margin: 8px 0;
      padding-left: 16px;
      color: #4b5563;
      background: #f9fafb;
    }
    
    .rich-text-editor-light .ql-snow .ql-tooltip {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #1f2937;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .rich-text-editor-light .ql-snow .ql-tooltip input[type=text] {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #1f2937;
      padding: 4px 8px;
    }
    
    .rich-text-editor-light .ql-snow .ql-tooltip a.ql-action,
    .rich-text-editor-light .ql-snow .ql-tooltip a.ql-remove {
      color: #2563eb;
    }
  `;

  const readonlyStyles = `
    .rich-text-editor-readonly .ql-toolbar {
      display: none;
    }
    
    .rich-text-editor-readonly .ql-container {
      border-radius: 12px;
      border: none;
      background: transparent;
    }
    
    .rich-text-editor-readonly .ql-editor {
      padding: 0;
    }
  `;

  const editorClass = isDark ? 'rich-text-editor-dark' : 'rich-text-editor-light';

  return (
    <div className={editorClass}>
      <style>{isDark ? darkEditorStyles : lightEditorStyles}</style>
      {readOnly && <style>{readonlyStyles}</style>}
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={readOnly ? { toolbar: false } : modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        className={readOnly ? 'rich-text-editor-readonly' : ''}
      />
    </div>
  );
}

// Read-only viewer component for displaying rich text
export function RichTextViewer({ content, isDark = true, compact = false }: { content: string; isDark?: boolean; compact?: boolean }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract all images from content
  const extractImages = useCallback((html: string): string[] => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }
    return images;
  }, []);

  // Handle image clicks
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        const imgSrc = (target as HTMLImageElement).src;
        const allImages = extractImages(content);
        const clickedIndex = allImages.findIndex(src => imgSrc.includes(src) || src.includes(imgSrc));
        
        setLightboxImages(allImages);
        setLightboxIndex(clickedIndex >= 0 ? clickedIndex : 0);
        setLightboxOpen(true);
      }
    };

    container.addEventListener('click', handleImageClick);
    return () => container.removeEventListener('click', handleImageClick);
  }, [content, extractImages]);

  if (!content) {
    return <span className={isDark ? "text-dark-500 italic" : "text-gray-400 italic"}>No description</span>;
  }

  const darkFontSize = compact ? '11px' : '14px';
  const darkLineHeight = compact ? '1.5' : '1.6';
  
  const darkStyles = `
    .rich-text-viewer-dark {
      color: #e2e8f0 !important;
      line-height: ${darkLineHeight};
      font-size: ${darkFontSize};
    }
    
    .rich-text-viewer-dark * {
      color: inherit;
    }
    
    .rich-text-viewer-dark p {
      margin-bottom: 0.5em;
      color: #e2e8f0 !important;
    }
    
    .rich-text-viewer-dark h1, .rich-text-viewer-dark h2, .rich-text-viewer-dark h3 {
      color: #f1f5f9 !important;
      font-weight: 600;
      margin: 0.75em 0 0.4em;
    }
    
    .rich-text-viewer-dark h1 { font-size: 1.3em; }
    .rich-text-viewer-dark h2 { font-size: 1.15em; }
    .rich-text-viewer-dark h3 { font-size: 1.05em; }
    
    .rich-text-viewer-dark a {
      color: #60a5fa !important;
      text-decoration: underline;
    }
    
    .rich-text-viewer-dark a:hover {
      color: #93c5fd !important;
    }
    
    .rich-text-viewer-dark img {
      max-width: 100%;
      border-radius: 8px;
      margin: 8px 0;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .rich-text-viewer-dark img:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .rich-text-viewer-dark ul, .rich-text-viewer-dark ol {
      padding-left: 1.5em;
      margin: 0.5em 0;
      color: #e2e8f0 !important;
    }
    
    .rich-text-viewer-dark li {
      margin: 0.25em 0;
      color: #e2e8f0 !important;
    }
    
    .rich-text-viewer-dark blockquote {
      border-left: 4px solid #3b82f6;
      margin: 8px 0;
      padding-left: 16px;
      color: #cbd5e1 !important;
      background: rgba(30, 41, 59, 0.5);
      padding: 8px 8px 8px 16px;
      border-radius: 0 8px 8px 0;
    }
    
    .rich-text-viewer-dark pre {
      background: rgb(15, 23, 42);
      color: #e2e8f0 !important;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      font-family: 'Fira Code', 'Monaco', monospace;
      font-size: 11px;
    }
    
    .rich-text-viewer-dark code {
      background: rgb(30, 41, 59);
      color: #e2e8f0 !important;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', 'Monaco', monospace;
      font-size: 11px;
    }
    
    .rich-text-viewer-dark pre code {
      background: transparent;
      padding: 0;
    }
    
    .rich-text-viewer-dark strong {
      color: #f1f5f9 !important;
      font-weight: 600;
    }
    
    .rich-text-viewer-dark em {
      color: #e2e8f0 !important;
    }
  `;

  const baseFontSize = compact ? '11px' : '13px';
  const baseLineHeight = compact ? '1.5' : '1.6';
  
  const lightStyles = `
    .rich-text-viewer-light {
      color: #1f2937 !important;
      line-height: ${baseLineHeight};
      font-size: ${baseFontSize};
    }
    
    .rich-text-viewer-light * {
      color: inherit;
    }
    
    .rich-text-viewer-light p {
      margin-bottom: 0.5em;
      color: #374151 !important;
    }
    
    .rich-text-viewer-light h1, .rich-text-viewer-light h2, .rich-text-viewer-light h3 {
      color: #111827 !important;
      font-weight: 600;
      margin: 0.75em 0 0.4em;
    }
    
    .rich-text-viewer-light h1 { font-size: 1.3em; }
    .rich-text-viewer-light h2 { font-size: 1.15em; }
    .rich-text-viewer-light h3 { font-size: 1.05em; }
    
    .rich-text-viewer-light a {
      color: #2563eb !important;
      text-decoration: underline;
    }
    
    .rich-text-viewer-light a:hover {
      color: #1d4ed8 !important;
    }
    
    .rich-text-viewer-light img {
      max-width: 100%;
      border-radius: 8px;
      margin: 8px 0;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .rich-text-viewer-light img:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .rich-text-viewer-light ul, .rich-text-viewer-light ol {
      padding-left: 1.5em;
      margin: 0.5em 0;
      color: #374151 !important;
    }
    
    .rich-text-viewer-light li {
      margin: 0.25em 0;
      color: #374151 !important;
    }
    
    .rich-text-viewer-light blockquote {
      border-left: 4px solid #2563eb;
      margin: 8px 0;
      padding-left: 16px;
      color: #4b5563 !important;
      background: #f3f4f6;
      padding: 8px 8px 8px 16px;
      border-radius: 0 8px 8px 0;
    }
    
    .rich-text-viewer-light pre {
      background: #f3f4f6;
      color: #1f2937 !important;
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      font-family: 'Fira Code', 'Monaco', monospace;
      font-size: 11px;
      border: 1px solid #e5e7eb;
    }
    
    .rich-text-viewer-light code {
      background: #e5e7eb;
      color: #1f2937 !important;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', 'Monaco', monospace;
      font-size: 11px;
    }
    
    .rich-text-viewer-light pre code {
      background: transparent;
      padding: 0;
      border: none;
    }
    
    .rich-text-viewer-light strong {
      color: #111827 !important;
      font-weight: 600;
    }
    
    .rich-text-viewer-light em {
      color: #374151 !important;
    }
  `;

  return (
    <>
      <div className={isDark ? 'rich-text-viewer-dark' : 'rich-text-viewer-light'}>
        <style>{isDark ? darkStyles : lightStyles}</style>
        
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {lightboxOpen && lightboxImages.length > 0 && (
        <ImageLightbox
          src={lightboxImages[lightboxIndex]}
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

