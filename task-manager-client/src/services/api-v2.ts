/**
 * API v2 Service
 * Uses the new OOP backend endpoints
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Work Orders API v2
// ============================================
export const workOrdersAPI = {
  getAll: (filters?: {
    status?: string;
    type?: string;
    priority?: string;
    asset_id?: number;
    assigned_to?: number;
    sprint_id?: number;
    limit?: number;
  }) => api.get('/work-orders', { params: filters }),
  
  getById: (id: number) => api.get(`/work-orders/${id}`),
  
  getByTicket: (ticketId: number) => api.get(`/work-orders/ticket/${ticketId}`),
  
  getStatistics: () => api.get('/work-orders/statistics'),
  
  create: (data: {
    asset_id: number;
    type: string;
    priority: string;
    title: string;
    description?: string;
    assignee_ids: number[];
    related_ticket_id?: number;
    scheduled_start?: string;
    scheduled_end?: string;
  }) => api.post('/work-orders', data),
  
  update: (id: number, data: {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    assignee_ids?: number[];
  }) => api.put(`/work-orders/${id}`, data),
  
  delete: (id: number) => api.delete(`/work-orders/${id}`),
  
  start: (id: number) => api.post(`/work-orders/${id}/start`),
  
  complete: (id: number, data?: {
    root_cause?: string;
    solution?: string;
    parts_used?: string;
    labor_hours?: number;
  }) => api.post(`/work-orders/${id}/complete`, data),
  
  cancel: (id: number) => api.post(`/work-orders/${id}/cancel`),
};

// ============================================
// Tickets API v2
// ============================================
export const ticketsAPI = {
  getAll: (filters?: {
    status?: string;
    type?: string;
    priority?: string;
    assignee?: number;
    department?: number;
    sprint?: number | string;
    search?: string;
  }) => api.get('/tickets', { params: filters }),
  
  getById: (id: number) => api.get(`/tickets/${id}`),
  
  getByKey: (ticketKey: string) => api.get(`/tickets/key/${ticketKey}`),
  
  getBySprint: (sprintId: number) => api.get(`/tickets/sprint/${sprintId}`),
  
  getByEpic: (epicId: number) => api.get(`/tickets/epic/${epicId}`),
  
  search: (query: string, limit?: number) => 
    api.get('/tickets/search', { params: { q: query, limit } }),
  
  getStatistics: () => api.get('/tickets/statistics'),
  
  create: (data: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    assignee_ids?: number[];
    department_id?: number;
    sprint_id?: number;
    due_date?: string;
    asset_id?: number;
  }) => api.post('/tickets', data),
  
  update: (id: number, data: {
    title?: string;
    description?: string;
    status?: string;
    type?: string;
    priority?: string;
    assignee_ids?: number[];
  }) => api.put(`/tickets/${id}`, data),
  
  updateStatus: (id: number, status: string) => 
    api.patch(`/tickets/${id}/status`, { status }),
  
  delete: (id: number) => api.delete(`/tickets/${id}`),
  
  addComment: (id: number, content: string) => 
    api.post(`/tickets/${id}/comments`, { content }),
  
  quickMaintenance: (data: {
    title: string;
    description?: string;
    priority: string;
    asset_id: number;
    assignee_ids: number[];
    wo_type?: string;
  }) => api.post('/tickets/quick-maintenance', data),
};

// ============================================
// Downtime API v2
// ============================================
export const downtimeAPI = {
  getAll: (filters?: {
    asset_id?: number;
    start_date?: string;
    end_date?: string;
    downtime_type?: string;
    classification_id?: number;
    category?: string;
    status?: string;
    limit?: number;
  }) => api.get('/downtime', { params: filters }),
  
  getById: (id: number) => api.get(`/downtime/${id}`),
  
  getActiveByAsset: (assetId: number) => api.get(`/downtime/asset/${assetId}/active`),
  
  getDashboard: () => api.get('/downtime/dashboard'),
  
  getStatistics: (filters?: {
    start_date?: string;
    end_date?: string;
    asset_id?: number;
  }) => api.get('/downtime/statistics', { params: filters }),
  
  getClassifications: (category?: string) => 
    api.get('/downtime/classifications', { params: { category } }),
  
  getClassificationById: (id: number) => api.get(`/downtime/classifications/${id}`),
  
  createClassification: (data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }) => api.post('/downtime/classifications', data),
  
  updateClassification: (id: number, data: {
    code?: string;
    name?: string;
    category?: string;
    description?: string;
  }) => api.put(`/downtime/classifications/${id}`, data),
  
  deleteClassification: (id: number) => api.delete(`/downtime/classifications/${id}`),
  
  generateClassificationCode: (category: string) => 
    api.get(`/downtime/classifications/generate/${category}`),
  
  start: (data: {
    asset_id: number;
    downtime_type?: string;
    classification_id?: number;
    reason?: string;
    work_order_id?: number;
  }) => api.post('/downtime/start', data),
  
  end: (id: number, data?: {
    reason?: string;
    production_impact?: string;
  }) => api.post(`/downtime/${id}/end`, data),
  
  update: (id: number, data: {
    reason?: string;
    production_impact?: string;
    classification_id?: number;
  }) => api.put(`/downtime/${id}`, data),
  
  delete: (id: number) => api.delete(`/downtime/${id}`),
};

// ============================================
// Assets API v2
// ============================================
export const assetsAPI = {
  getAll: (filters?: {
    status?: string;
    category_id?: number;
    department_id?: number;
    criticality?: string;
    search?: string;
  }) => api.get('/assets', { params: filters }),
  
  getById: (id: number) => api.get(`/assets/${id}`),
  
  getCategories: () => api.get('/assets/categories'),
  
  getFailureCodes: (category?: string) => 
    api.get('/assets/failure-codes', { params: { category } }),
  
  getFailureCodesByAsset: (assetId: number) =>
    api.get(`/assets/failure-codes/by-asset/${assetId}`),
  
  generateFailureCode: (category: string) =>
    api.get(`/assets/failure-codes/generate/${encodeURIComponent(category)}`),
  
  createFailureCode: (data: {
    code?: string;
    category: string;
    description: string;
  }) => api.post('/assets/failure-codes', data),
  
  getStatistics: () => api.get('/assets/statistics'),
  
  getWorkOrders: (id: number) => api.get(`/assets/${id}/work-orders`),
  
  getDowntimeHistory: (id: number) => api.get(`/assets/${id}/downtime`),
  
  create: (data: {
    asset_code: string;
    name: string;
    category_id?: number;
    status?: string;
    criticality?: string;
    department_id?: number;
  }) => api.post('/assets', data),
  
  update: (id: number, data: {
    name?: string;
    status?: string;
    criticality?: string;
  }) => api.put(`/assets/${id}`, data),
  
  updateStatus: (id: number, status: string) => 
    api.patch(`/assets/${id}/status`, { status }),
  
  delete: (id: number) => api.delete(`/assets/${id}`),
};

// ============================================
// Users API v2
// ============================================
export const usersAPI = {
  getAll: (filters?: {
    role?: string;
    department_id?: number;
    search?: string;
  }) => api.get('/users', { params: filters }),
  
  getById: (id: number) => api.get(`/users/${id}`),
  
  getCurrentUser: () => api.get('/users/me'),
  
  getWithStats: (id: number, period?: number) => 
    api.get(`/users/${id}/stats`, { params: { period } }),
  
  getTechnicians: () => api.get('/users/technicians'),
  
  getTeamPerformance: (period?: number) => 
    api.get('/users/performance/team', { params: { period } }),
  
  getUserActivity: (id: number, limit?: number) => 
    api.get(`/users/${id}/activity`, { params: { limit } }),
  
  create: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department_id?: number;
  }) => api.post('/users', data),
  
  update: (id: number, data: {
    name?: string;
    email?: string;
    role?: string;
    department_id?: number;
  }) => api.put(`/users/${id}`, data),
  
  updateProfile: (data: {
    name?: string;
    avatar?: string;
    whatsapp?: string;
  }) => api.put('/users/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/users/change-password', { currentPassword, newPassword }),
  
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ============================================
// Reports API v2
// ============================================
export const reportsAPI = {
  getKPIDashboard: (filters?: {
    days?: number;
    asset_id?: number;
  }) => api.get('/reports/kpi/dashboard', { params: filters }),
  
  getProductionKPI: (filters?: {
    days?: number;
    start_date?: string;
    end_date?: string;
    asset_id?: number;
  }) => api.get('/reports/kpi/production', { params: filters }),
  
  getProductionSummary: (filters?: {
    days?: number;
    asset_id?: number;
  }) => api.get('/reports/production/summary', { params: filters }),
  
  getDailyBreakdown: (filters?: {
    days?: number;
    asset_id?: number;
  }) => api.get('/reports/production/daily', { params: filters }),
  
  getWorkOrderReport: (filters?: { days?: number }) => 
    api.get('/reports/work-orders', { params: filters }),
  
  getTicketReport: (filters?: { days?: number }) => 
    api.get('/reports/tickets', { params: filters }),
  
  getTeamReport: () => api.get('/reports/team'),
  
  getDashboard: (filters?: { days?: number }) => 
    api.get('/reports/dashboard', { params: filters }),
  
  getMaintenanceMetrics: (filters?: {
    days?: number;
    asset_id?: number;
  }) => api.get('/reports/maintenance/metrics', { params: filters }),
};

// ============================================
// AI API v2
// ============================================
export const aiAPI = {
  chat: (message: string, context?: string) => 
    api.post('/ai/chat', { message, context }),
  
  chatWithMemory: (message: string, conversationId?: string) => 
    api.post('/ai/chat-with-memory', { message, conversationId }),
  
  smartChat: (message: string) => 
    api.post('/ai/smart-chat', { message }),
  
  smartAssignment: (data: {
    title: string;
    description?: string;
    type: string;
    priority: string;
    department_id?: number;
  }) => api.post('/ai/smart-assignment', data),
  
  writeAssist: (data: {
    prompt: string;
    type?: string;
    context?: string;
    ticket_id?: number;
    asset_id?: number;
    work_order_id?: number;
  }) => api.post('/ai/write-assist', data),
  
  getWritingContext: (data: {
    ticket_id?: number;
    asset_id?: number;
    work_order_id?: number;
  }) => api.post('/ai/get-writing-context', data),
  
  getTools: () => api.get('/ai/tools'),
  
  executeTool: (toolName: string, args?: Record<string, unknown>) => 
    api.post('/ai/execute-tool', { tool_name: toolName, args }),
  
  getTeamCapacity: () => api.get('/ai/team-capacity'),

  // PM AI Suggestions
  getPMSuggestions: (data: { asset_id: number; title?: string; frequency_type?: string }) =>
    api.post('/ai/pm-suggestions', data),

  getInsights: {
    workload: () => api.get('/ai/insights/workload'),
    downtime: (days?: number) => api.get('/ai/insights/downtime', { params: { days } }),
    assets: () => api.get('/ai/insights/assets'),
    workOrders: () => api.get('/ai/insights/work-orders'),
  },
};

// Export all APIs
export default {
  workOrders: workOrdersAPI,
  tickets: ticketsAPI,
  downtime: downtimeAPI,
  assets: assetsAPI,
  users: usersAPI,
  reports: reportsAPI,
  ai: aiAPI,
  spareparts: {
    getComparison: () => api.get('/v2/spareparts/comparison'),
  },
};

