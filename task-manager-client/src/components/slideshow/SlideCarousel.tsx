import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { KPISummarySlide } from './slides/KPISummarySlide';
import { ProductionSlide } from './slides/ProductionSlide';
import { MaintenanceSlide } from './slides/MaintenanceSlide';
import { DowntimeSlide } from './slides/DowntimeSlide';
import { SolarSlide } from './slides/SolarSlide';
import { TeamPerformanceSlide } from './slides/TeamPerformanceSlide';
import { OEESlide } from './slides/OEESlide';
import { ScadaSlide } from './slides/ScadaSlide';
import { SlideData } from '../../hooks/useSlideshowData';

interface SlideCarouselProps {
  slides: SlideData[];
}

export const SlideCarousel: React.FC<SlideCarouselProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentSlide = slides[currentIndex];
  const duration = (currentSlide?.duration || 30) * 1000;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = 100; // Update progress every 100ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, duration, nextSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const renderSlide = () => {
    if (!currentSlide) return null;

    switch (currentSlide.type) {
      case 'kpi-summary':
        return <KPISummarySlide data={currentSlide.data} />;
      case 'production':
        return <ProductionSlide data={currentSlide.data} />;
      case 'maintenance':
        return <MaintenanceSlide data={currentSlide.data} />;
      case 'downtime':
        return <DowntimeSlide data={currentSlide.data} />;
      case 'solar':
        return <SolarSlide data={currentSlide.data} />;
      case 'team-performance':
        return <TeamPerformanceSlide data={currentSlide.data} />;
      case 'oee':
        return <OEESlide data={currentSlide.data} />;
      case 'scada':
        return <ScadaSlide data={currentSlide.data} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-white text-3xl">
            Unknown Slide Type: {currentSlide.type}
          </div>
        );
    }
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-950 text-white text-3xl">
        Tidak ada slide yang aktif.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      {/* Current Slide */}
      <div className="w-full h-full transition-opacity duration-500">
        {renderSlide()}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls Overlay (Visible on Hover) */}
      <div className="absolute inset-0 flex items-center justify-between px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button
          onClick={prevSlide}
          className="p-4 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/80 transition-all pointer-events-auto shadow-2xl"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>

        <div className="flex flex-col items-center gap-6 mt-auto mb-12 pointer-events-auto">
          <div className="flex items-center gap-6 p-4 rounded-3xl bg-black/50 border border-white/20 backdrop-blur-md shadow-2xl">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
            </button>
            <div className="h-8 w-px bg-white/20" />
            <button onClick={toggleFullscreen} className="p-2 hover:scale-110 transition-transform">
              {isFullscreen ? <Minimize className="w-8 h-8 text-white" /> : <Maximize className="w-8 h-8 text-white" />}
            </button>
          </div>
          <div className="flex gap-3">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-12 bg-blue-500' : 'w-3 bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="p-4 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/80 transition-all pointer-events-auto shadow-2xl"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
};
