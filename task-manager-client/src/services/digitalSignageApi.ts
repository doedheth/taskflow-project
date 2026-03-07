import axios from 'axios';
import { Template, Playlist, Slide, Schedule } from '../types/digitalSignage';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const digitalSignageApi = {
  // Templates
  getTemplates: async (): Promise<Template[]> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/templates`);
    return response.data;
  },
  createTemplate: async (data: Partial<Template>) => {
    const response = await axios.post(`${API_URL}/v2/digital-signage/templates`, data);
    return response.data;
  },
  updateTemplate: async (id: string, data: Partial<Template>) => {
    const response = await axios.put(`${API_URL}/v2/digital-signage/templates/${id}`, data);
    return response.data;
  },
  deleteTemplate: async (id: string) => {
    const response = await axios.delete(`${API_URL}/v2/digital-signage/templates/${id}`);
    return response.data;
  },

  // Playlists
  getPlaylists: async (): Promise<Playlist[]> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/playlists`);
    return response.data;
  },
  createPlaylist: async (data: Partial<Playlist>) => {
    const response = await axios.post(`${API_URL}/v2/digital-signage/playlists`, data);
    return response.data;
  },
  updatePlaylist: async (id: string, data: Partial<Playlist>) => {
    const response = await axios.put(`${API_URL}/v2/digital-signage/playlists/${id}`, data);
    return response.data;
  },
  deletePlaylist: async (id: string) => {
    const response = await axios.delete(`${API_URL}/v2/digital-signage/playlists/${id}`);
    return response.data;
  },

  // Slides
  getSlides: async (playlistId: string): Promise<Slide[]> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/slides/${playlistId}`);
    return response.data;
  },
  getSlide: async (id: string): Promise<Slide> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/slides/detail/${id}`);
    return response.data;
  },
  createSlide: async (data: Partial<Slide>) => {
    const response = await axios.post(`${API_URL}/v2/digital-signage/slides`, data);
    return response.data;
  },
  updateSlide: async (id: string, data: Partial<Slide>) => {
    const response = await axios.put(`${API_URL}/v2/digital-signage/slides/${id}`, data);
    return response.data;
  },
  deleteSlide: async (id: string) => {
    const response = await axios.delete(`${API_URL}/v2/digital-signage/slides/${id}`);
    return response.data;
  },

  // Schedules
  getSchedules: async (playlistId: string): Promise<Schedule[]> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/schedules/${playlistId}`);
    return response.data;
  },
  createSchedule: async (data: Partial<Schedule>) => {
    const response = await axios.post(`${API_URL}/v2/digital-signage/schedules`, data);
    return response.data;
  },

  // Public Active Content
  getActiveContent: async (): Promise<{ slides: Slide[], config: any }> => {
    const response = await axios.get(`${API_URL}/v2/digital-signage/active`);
    return response.data;
  }
};
