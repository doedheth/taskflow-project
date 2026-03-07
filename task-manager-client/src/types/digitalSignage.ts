export interface Template {
  id: string;
  name: string;
  description?: string;
  layout_type: 'grid' | 'single' | 'split' | 'custom';
  layout_config: any;
  orientation?: {
    orientation_type: 'portrait' | 'landscape';
    width?: number;
    height?: number;
  };
}

export interface Playlist {
  id: string;
  name: string;
  template_id: string;
  template_name?: string;
  priority: number;
}

export interface TextBlock {
  id: string;
  text: string;
  font_family: string;
  font_size: string; // in px
  animation: 'fade' | 'slide-up' | 'zoom' | 'typewriter';
  animation_speed: number;
  text_color: string;
  position: 'top' | 'middle' | 'bottom';
}

export interface Slide {
  id: string;
  playlist_id: string;
  title: string;
  type: 'image' | 'video' | 'text';
  content: string;
  duration: number;
  order_index: number;
  metadata?: {
    bg_color?: string;
    text_blocks?: TextBlock[];
    // Legacy support for single block
    font_family?: string;
    font_size?: string;
    animation?: 'fade' | 'slide-up' | 'zoom' | 'typewriter';
    animation_speed?: number;
    text_color?: string;
  };
}

export interface Schedule {
  id: string;
  playlist_id: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
}
