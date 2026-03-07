import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  images?: string[]; // Array of all images for navigation
  currentIndex?: number;
}

export default function ImageLightbox({ 
  src, 
  alt = 'Image', 
  onClose,
  images = [],
  currentIndex = 0
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isLoading, setIsLoading] = useState(true);

  const currentSrc = images.length > 0 ? images[activeIndex] : src;
  const hasMultipleImages = images.length > 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultipleImages) {
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            resetTransform();
          }
          break;
        case 'ArrowRight':
          if (hasMultipleImages) {
            setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            resetTransform();
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, hasMultipleImages, images.length]);

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setIsLoading(true);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = currentSrc;
    link.download = `image-${Date.now()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentSrc]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransform();
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransform();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/30 mx-1" />
        <button
          onClick={handleRotate}
          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Rotate (R)"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation arrows */}
      {hasMultipleImages && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Previous (←)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Next (→)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image counter */}
      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm z-10">
          {activeIndex + 1} / {images.length}
        </div>
      )}

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={currentSrc}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            opacity: isLoading ? 0 : 1,
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          draggable={false}
        />
      </div>

      {/* Thumbnail strip for multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md max-w-[80vw] overflow-x-auto z-10">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                resetTransform();
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === activeIndex
                  ? 'border-white scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs hidden md:block">
        <span className="mr-3">Esc: Close</span>
        {hasMultipleImages && <span className="mr-3">←→: Navigate</span>}
        <span className="mr-3">+/-: Zoom</span>
        <span>R: Rotate</span>
      </div>
    </div>,
    document.body
  );
}

// Hook to use lightbox with RichTextViewer
export function useLightbox() {
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const openLightbox = useCallback((images: string[], index: number = 0) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex: index,
    });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    ...lightboxState,
    openLightbox,
    closeLightbox,
  };
}

