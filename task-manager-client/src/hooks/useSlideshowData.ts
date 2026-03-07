import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface SlideData {
  type: 'kpi-summary' | 'production' | 'maintenance' | 'downtime' | 'solar' | 'team-performance' | 'oee' | 'scada';
  duration: number;
  data: any;
}

export interface SlideshowResponse {
  slides: SlideData[];
  generatedAt: string;
}

export const useSlideshowData = () => {
  return useQuery<SlideshowResponse>({
    queryKey: ['public-slideshow'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/v2/public/slideshow`);
      return response.data;
    },
    refetchInterval: 10000, // Refresh data every 10 seconds
    staleTime: 8000,
  });
};
