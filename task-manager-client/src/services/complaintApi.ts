import api from './api';
import { Complaint } from '@/types/complaint';

export const complaintAPI = {
  getByInspection: (inspection_id: number) => api.get(`/v2/complaints?inspection_id=${inspection_id}`),
  create: (data: Partial<Complaint>) => api.post('/v2/complaints', data),
  update: (id: number, data: Partial<Complaint>) => api.put(`/v2/complaints/${id}`, data),
  getById: (id: number) => api.get(`/v2/complaints/${id}`),
  delete: (id: number) => api.delete(`/v2/complaints/${id}`),
};
