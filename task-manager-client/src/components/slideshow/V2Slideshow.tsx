import React, { useEffect, useState, useCallback } from 'react';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Slide } from '../../types/digitalSignage';
import { Loader2, AlertCircle } from 'lucide-react';

const V2Slideshow: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      const data = await digitalSignageApi.getActiveContent();
      
      if (data.slides && data.slides.length > 0) {
        // Deep comparison using JSON.stringify to only update if content actually changed
        const currentSlidesStr = JSON.stringify(slides);
        const newSlidesStr = JSON.stringify(data.slides);
        const currentConfigStr = JSON.stringify(config);
        const newConfigStr = JSON.stringify(data.config);

        if (currentSlidesStr !== newSlidesStr) {
          console.log('🔄 Slides updated from server');
          setSlides(data.slides);
          // Optional: reset index if the current one is out of bounds
          if (currentIndex >= data.slides.length) {
            setCurrentIndex(0);
          }
        }

        if (currentConfigStr !== newConfigStr) {
          console.log('⚙️ Config updated from server');
          setConfig(data.config);
        }

        setError(null);
      } else {
        // If we already have slides, don't clear them immediately (prevents black screen)
        if (slides.length === 0) {
          setError('No active content found for this time/schedule.');
        }
      }
    } catch (err) {
      console.error('Signage poll error:', err);
      // If we already have slides, don't show error (keep running old content)
      if (slides.length === 0) {
        setError('Failed to connect to the digital signage server.');
      }
    } finally {
      setLoading(false);
    }
  }, [slides, config, currentIndex]);

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, 10000); // Check for new content every 10 seconds
    return () => clearInterval(interval);
  }, [fetchContent]);

  useEffect(() => {
    if (slides.length === 0) return;

    const currentSlide = slides[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, (currentSlide?.duration || 10) * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, slides]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-2xl text-white font-medium animate-pulse tracking-[0.3em]">Initializing Content...</p>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4 uppercase">System Standby</h1>
        <p className="text-xl text-gray-400 max-w-xl font-medium">{error}</p>
      </div>
    );
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderSlideContent = (slide: Slide) => {
    const metadata = slide.metadata || {};
    
    if (slide.type === 'video') {
      const youtubeId = getYoutubeId(slide.content);
      if (youtubeId) {
        return (
          <iframe
            className="w-full h-full border-0"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&rel=0&showinfo=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return (
        <video 
          src={slide.content} 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        />
      );
    }

    if (slide.type === 'image') {
      return (
        <img 
          src={slide.content} 
          alt={slide.title}
          className="w-full h-full object-contain" // object-contain ensures full image is visible
        />
      );
    }

    if (slide.type === 'text') {
      const textBlocks = metadata.text_blocks || [];
      
      // If legacy slide (single block), wrap it in an array for consistent rendering
      const blocks = textBlocks.length > 0 ? textBlocks : [{
        id: 'legacy',
        text: slide.content,
        font_family: metadata.font_family || 'Inter, sans-serif',
        font_size: metadata.font_size || '60',
        animation: metadata.animation || 'fade',
        animation_speed: metadata.animation_speed || 1,
        text_color: metadata.text_color || 'white',
        position: 'middle' as const
      }];

      return (
        <div 
          className="w-full h-full flex flex-col p-20 transition-all duration-1000 overflow-hidden"
          style={{ backgroundColor: metadata.bg_color || 'transparent' }}
        >
          <style>
            {`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
              @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              @keyframes typewriter { from { width: 0; } to { width: 100%; } }
              
              .animate-fade { animation: fadeIn var(--speed) ease-out forwards; }
              .animate-slide-up { animation: slideUp var(--speed) ease-out forwards; }
              .animate-zoom { animation: zoomIn var(--speed) ease-out forwards; }
              .animate-typewriter { 
                overflow: hidden;
                white-space: pre;
                border-right: 4px solid white;
                animation: typewriter var(--speed) steps(40, end) forwards;
              }
            `}
          </style>

          {/* Top Section */}
          <div className="flex-1 flex items-start justify-center overflow-hidden">
            {blocks.filter(b => b.position === 'top').map(block => (
              <div 
                key={block.id}
                className={`text-center font-bold animate-${block.animation}`}
                style={{ 
                  fontFamily: block.font_family, 
                  fontSize: `${block.font_size}px`,
                  color: block.text_color,
                  '--speed': `${block.animation_speed}s`
                } as any}
              >
                {block.text}
              </div>
            ))}
          </div>

          {/* Middle Section - Higher priority/larger */}
          <div className="flex-[2] flex flex-col items-center justify-center overflow-hidden">
            {blocks.filter(b => b.position === 'middle').map(block => (
              <div 
                key={block.id}
                className={`text-center font-black animate-${block.animation} my-4 max-h-full`}
                style={{ 
                  fontFamily: block.font_family, 
                  fontSize: `${block.font_size}px`,
                  color: block.text_color,
                  '--speed': `${block.animation_speed}s`,
                  whiteSpace: block.animation === 'typewriter' ? 'nowrap' : 'pre-wrap',
                  lineHeight: 1.1
                } as any}
              >
                {block.text}
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="flex-1 flex items-end justify-center overflow-hidden">
            {blocks.filter(b => b.position === 'bottom').map(block => (
              <div 
                key={block.id}
                className={`text-center font-bold animate-${block.animation}`}
                style={{ 
                  fontFamily: block.font_family, 
                  fontSize: `${block.font_size}px`,
                  color: block.text_color,
                  '--speed': `${block.animation_speed}s`
                } as any}
              >
                {block.text}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const currentSlide = slides[currentIndex];
  const orientation = config?.template?.orientation?.type || 'landscape';

  return (
    <div className={`fixed inset-0 w-screen h-screen bg-black overflow-hidden flex items-center justify-center ${
      orientation === 'portrait' ? 'flex-col' : ''
    }`}>
      <div key={currentSlide.id} className="relative w-full h-full">
        {renderSlideContent(currentSlide)}
      </div>
      
      {/* Small indicator at the bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default V2Slideshow;
