import axios from 'axios';

export const api = axios.create({
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
      // Don't redirect if we're already on the login page or if it's a login request
      const isLoginPage = window.location.pathname === '/login';
      const isRegisterPage = window.location.pathname === '/register';
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginPage && !isRegisterPage && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, department_id?: number) =>
    api.post('/auth/register', { email, password, name, department_id }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  update: (id: number, data: Partial<{ name: string; email: string; role: string; department_id: number }>) =>
    api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number, password?: string) =>
    api.post(`/users/${id}/reset-password`, { password }),
  getPerformance: (id: number, period?: number) =>
    api.get(`/users/${id}/performance`, { params: { period } }),
  getTeamPerformance: (period?: number) =>
    api.get('/users/performance/team', { params: { period } }),
};

// Departments API
export const departmentsAPI = {
  getAll: () => api.get('/auth/departments'),
  getById: (id: number) => api.get(`/departments/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/departments', data),
  update: (id: number, data: Partial<{ name: string; description: string; color: string }>) =>
    api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// Tickets API
export const ticketsAPI = {
  getAll: (filters?: {
    status?: string;
    type?: string;
    priority?: string;
    assignee?: number;
    department?: number;
    search?: string;
    asset_id?: number;
  }) => api.get('/tickets', { params: filters }),
  getById: (id: number) => api.get(`/tickets/${id}`),
  create: (data: {
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    story_points?: number;
    assignee_ids?: number[];
    department_id?: number;
    epic_id?: number;
    sprint_id?: number;
    due_date?: string;
    // Integration fields
    asset_id?: number;
    related_wo_id?: number;
  }) => api.post('/tickets', data),
  update: (id: number, data: Partial<{
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    story_points: number | null;
    assignee_ids: number[];
    department_id: number | null;
    epic_id: number | null;
    sprint_id: number | null;
    due_date: string | null;
    // Integration fields
    asset_id: number | null;
    related_wo_id: number | null;
  }>) => api.put(`/tickets/${id}`, data),
  delete: (id: number) => api.delete(`/tickets/${id}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }),
  addAssignee: (ticketId: number, userId: number) =>
    api.post(`/tickets/${ticketId}/assignees`, { user_id: userId }),
  removeAssignee: (ticketId: number, userId: number) =>
    api.delete(`/tickets/${ticketId}/assignees/${userId}`),
  // Quick Maintenance Ticket - creates both Ticket and WO
  quickMaintenance: (data: {
    title: string;
    description?: string;
    asset_id: number;
    wo_type: 'preventive' | 'corrective' | 'emergency';
    priority?: string;
    assignee_ids?: number[];
  }) => api.post('/tickets/quick-maintenance', data),
};

// Epics API
export const epicsAPI = {
  getAll: () => api.get('/epics'),
  getById: (id: number) => api.get(`/epics/${id}`),
  create: (data: {
    title: string;
    description?: string;
    priority?: string;
    assignee_id?: number;
    department_id?: number;
    due_date?: string;
  }) => api.post('/epics', data),
  addTicket: (epicId: number, ticketId: number) =>
    api.post(`/epics/${epicId}/tickets`, { ticket_id: ticketId }),
  removeTicket: (epicId: number, ticketId: number) =>
    api.delete(`/epics/${epicId}/tickets/${ticketId}`),
  getAvailableTickets: (epicId: number) =>
    api.get(`/epics/${epicId}/available-tickets`),
};

// Sprints API
export const sprintsAPI = {
  getAll: () => api.get('/sprints'),
  getById: (id: number) => api.get(`/sprints/${id}`),
  create: (data: {
    name: string;
    goal?: string;
    start_date?: string;
    end_date?: string;
  }) => api.post('/sprints', data),
  update: (id: number, data: Partial<{
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    status: string;
  }>) => api.put(`/sprints/${id}`, data),
  delete: (id: number) => api.delete(`/sprints/${id}`),
  start: (id: number) => api.post(`/sprints/${id}/start`),
  complete: (id: number, moveToBacklog?: boolean) =>
    api.post(`/sprints/${id}/complete`, { moveToBacklog }),
  addTicket: (sprintId: number, ticketId: number) =>
    api.post(`/sprints/${sprintId}/tickets`, { ticket_id: ticketId }),
  removeTicket: (sprintId: number, ticketId: number) =>
    api.delete(`/sprints/${sprintId}/tickets/${ticketId}`),
  getBacklog: () => api.get('/sprints/backlog/tickets'),
};

// Comments API
export const commentsAPI = {
  add: (ticketId: number, content: string) =>
    api.post(`/comments/${ticketId}`, { content }),
  update: (id: number, content: string) =>
    api.put(`/comments/${id}`, { content }),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: (limit?: number) => api.get('/dashboard/activity', { params: { limit } }),
  getMyTickets: () => api.get('/dashboard/my-tickets'),
  getMyWorkOrders: () => api.get('/dashboard/my-work-orders'),
  // Role-specific dashboard endpoints
  getSupervisorDashboard: () => api.get('/dashboard/supervisor'),
  getMemberDashboard: () => api.get('/dashboard/member'),
  getManagerDashboard: () => api.get('/dashboard/manager'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (limit?: number, unreadOnly?: boolean) =>
    api.get('/notifications', { params: { limit, unread_only: unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (filename: string) => api.delete(`/upload/${filename}`),
};

// AI Agent API
export const aiAPI = {
  suggestAssignee: (data: {
    ticket_type?: string;
    priority?: string;
    department_id?: number | null;
    title?: string;
    description?: string;
  }) => api.post('/ai/suggest-assignee', data),
  smartAssign: (data: {
    ticket_type?: string;
    priority?: string;
    department_id?: number | null;
    title?: string;
    description?: string;
  }) => api.post('/ai/smart-assign', data),
  chat: (message: string, conversationHistory?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, conversationHistory }).then(res => res.data),
  // Chat with persistent memory
  chatWithMemory: (message: string, conversationId?: number) =>
    api.post('/ai/chat-with-memory', { message, conversationId }).then(res => res.data),
  // Smart chat with function calling (MCP-like)
  smartChat: (message: string, conversationId?: number) =>
    api.post('/ai/smart-chat', { message, conversationId }).then(res => res.data),
  // Get available tools
  getTools: () => api.get('/ai/tools').then(res => res.data),
  // Execute tool directly
  executeTool: (toolName: string, params: Record<string, any>) =>
    api.post(`/ai/tools/${toolName}`, params).then(res => res.data),
  getConversation: () => api.get('/ai/conversation').then(res => res.data),
  getConversations: (limit?: number) =>
    api.get('/ai/conversations', { params: { limit } }).then(res => res.data),
  newConversation: () => api.post('/ai/conversation/new').then(res => res.data),
  activateConversation: (id: number) =>
    api.post(`/ai/conversation/${id}/activate`).then(res => res.data),
  deleteConversation: (id: number) => api.delete(`/ai/conversation/${id}`),
  getUserContext: () => api.get('/ai/context').then(res => res.data),
  updatePreferences: (preferences: Record<string, any>) =>
    api.put('/ai/context/preferences', { preferences }),
  getUserStats: (userId: number) => api.get(`/ai/user-stats/${userId}`),
  analyzeTeamCapacity: (data: { sprint_id?: number; target_story_points?: number }) =>
    api.post('/ai/team-capacity', data),
  enhanceText: (data: { title?: string; description?: string; ticket_type?: string }) =>
    api.post('/ai/enhance-text', data),
  autocomplete: (data: { title: string; ticket_type?: string }) =>
    api.post('/ai/autocomplete', data),
  analyzeTicket: (data: { title: string; description?: string }) =>
    api.post('/ai/analyze-ticket', data),
  // Format text with AI
  formatText: (data: { text: string; format_type: 'ticket_description' | 'work_order_description' | 'comment' | 'report' | 'checklist' | 'improve'; language?: 'id' | 'en' }) =>
    api.post('/ai/format-text', data).then(res => res.data),
  // Get context-aware suggestions
  getSuggestions: (data: { page: string; entity_id?: string | number; entity_type?: string; context?: string }) =>
    api.post('/ai/suggestions', data).then(res => res.data),
  // Get rich context for writing
  getWritingContext: (data: { scope: string; ticket_id?: number; asset_id?: number; work_order_id?: number }) =>
    api.post('/ai/get-writing-context', data).then(res => res.data),
  // Writing assistance with rich context
  writeAssist: (data: { prompt: string; type?: string; context?: string; richContext?: Record<string, unknown> }) =>
    api.post('/ai/write-assist', data).then(res => res.data),
  // AI Settings & Analytics (Admin Only)
  getSettings: () => api.get('/ai/settings').then(res => res.data),
  updateSettings: (settings: Record<string, string>) =>
    api.put('/ai/settings', { settings }).then(res => res.data),
  getUsageStats: () => api.get('/ai/usage-stats').then(res => res.data),
  getFeatureStatus: () => api.get('/ai/feature-status').then(res => res.data),
  getRateLimit: () => api.get('/ai/rate-limit').then(res => res.data),
  // Task Prioritization (Story 7.3)
  prioritizeTasks: (taskIds: number[], taskType: 'work_order' | 'ticket') =>
    api.post('/ai/prioritize', { taskIds, taskType }).then(res => res.data),
  suggestTechnician: (data: {
    taskType: 'work_order' | 'ticket';
    title: string;
    priority?: string;
    assetId?: number;
    departmentId?: number;
  }) => api.post('/ai/suggest-technician', data).then(res => res.data),
  // Smart Work Order Generation (Story 7.4)
  generateWO: (data: {
    description: string;
    asset_id?: number;
    wo_type?: 'preventive' | 'corrective' | 'emergency';
  }) => api.post('/ai/generate-wo', data).then(res => res.data),
  // Duplicate Detection (Story 7.5)
  checkDuplicate: (data: {
    text: string;
    type: 'ticket' | 'wo';
    asset_id?: number;
    exclude_id?: number;
  }) => api.post('/ai/check-duplicate', data).then(res => res.data),
  // Predictive Maintenance (Story 7.6)
  getPredictions: (params?: { minRiskScore?: number; limit?: number }) =>
    api.get('/ai/predictions', { params }).then(res => res.data),
  getPredictionDetail: (id: number) =>
    api.get(`/ai/predictions/${id}`).then(res => res.data),
  recordPredictionFeedback: (id: number, data: {
    actual_outcome: 'breakdown_occurred' | 'no_breakdown' | 'partial';
    occurred_at?: string;
    notes?: string;
  }) => api.post(`/ai/predictions/${id}/feedback`, data).then(res => res.data),
  runPredictionAnalysis: (machine_id?: number) =>
    api.post('/ai/predictions/analyze', { machine_id }).then(res => res.data),
  getPredictionAccuracy: () =>
    api.get('/ai/predictions/accuracy').then(res => res.data),
  // AI Report Generation (Story 7.7)
  generateReport: (data: {
    period_type: 'monthly' | 'weekly' | 'quarterly';
    year: number;
    month?: number;
    week?: number;
    quarter?: number;
  }) => api.post('/ai/generate-report', data).then(res => res.data),
  getReports: (limit?: number) =>
    api.get('/ai/reports', { params: { limit } }).then(res => res.data),
  getReportDetail: (id: number) =>
    api.get(`/ai/reports/${id}`).then(res => res.data),
  emailReport: (reportId: number, data: { recipients: string[]; subject: string }) =>
    api.post(`/ai/reports/${reportId}/email`, data).then(res => res.data),

  // Production Reports
  generateProductionReport: (data: {
    period_type: 'monthly' | 'weekly' | 'quarterly' | 'daily';
    year: number;
    month?: number;
    week?: number;
    quarter?: number;
    machine_ids?: number[];
    shift?: string;
  }) => api.post('/ai/generate-production-report', data).then(res => res.data),
  getProductionReports: (limit?: number) =>
    api.get('/ai/production-reports', { params: { limit } }).then(res => res.data),
  getProductionReportDetail: (id: number) =>
    api.get(`/ai/production-reports/${id}`).then(res => res.data),
  emailProductionReport: (reportId: number, data: { recipients: string[]; subject?: string }) =>
    api.post(`/ai/production-reports/${reportId}/email`, data).then(res => res.data),

  // Root Cause Analysis (Story 7.8)
  analyzeRootCause: (data: {
    machine_id: number;
    breakdown_id?: number;
    lookback_days?: number;
  }) => api.post('/ai/rca/analyze', data).then(res => res.data),
  getRCADetail: (id: number) =>
    api.get(`/ai/rca/${id}`).then(res => res.data),
  getMachineRCAs: (machineId: number, limit?: number) =>
    api.get(`/ai/rca/machine/${machineId}`, { params: { limit } }).then(res => res.data),
  recordRCAFeedback: (id: number, data: {
    feedback_type: 'accurate' | 'inaccurate' | 'partial';
    actual_root_cause?: string;
    notes?: string;
  }) => api.post(`/ai/rca/${id}/feedback`, data).then(res => res.data),
  getRCAAccuracy: () =>
    api.get('/ai/rca/accuracy').then(res => res.data),

  // AI Admin Statistics (Story 7.9)
  getAdminStats: (days: number = 30) =>
    api.get('/ai/admin/stats', { params: { days } }).then(res => res.data),
  getAdminDailyStats: (days: number = 30) =>
    api.get('/ai/admin/stats/daily', { params: { days } }).then(res => res.data),
  getAdminFeatureStats: (days: number = 30) =>
    api.get('/ai/admin/stats/by-feature', { params: { days } }).then(res => res.data),
  getAdminMetrics: () =>
    api.get('/ai/admin/metrics').then(res => res.data),
  getAdminCostSummary: () =>
    api.get('/ai/admin/cost-summary').then(res => res.data),
  getAdminErrors: (limit: number = 20) =>
    api.get('/ai/admin/errors', { params: { limit } }).then(res => res.data),
  getFeatureToggles: () =>
    api.get('/ai/admin/feature-toggles').then(res => res.data),
  updateFeatureToggles: (updates: Array<{ feature: string; role: string; enabled: boolean }>) =>
    api.put('/ai/admin/feature-toggles', { updates }).then(res => res.data),
  getFeatureAvailability: () =>
    api.get('/ai/feature-availability').then(res => res.data),
  // API Key Management (Story 7.9 - Task 8.4)
  getAPIKeyStatus: () =>
    api.get('/ai/admin/api-key-status').then(res => res.data),
  updateAPIKey: (apiKey: string) =>
    api.post('/ai/admin/api-key', { apiKey }).then(res => res.data),
};

// ============================================
// Maintenance Management System APIs
// ============================================

// Assets API
export const assetsAPI = {
  getAll: (filters?: {
    status?: string;
    category_id?: number;
    department_id?: number;
    criticality?: string;
    search?: string;
  }) => api.get('/assets', { params: filters }),
  getById: (id: number) => api.get(`/assets/${id}`),
  create: (data: {
    asset_code: string;
    name: string;
    category_id?: number;
    location?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    warranty_expiry?: string;
    status?: string;
    criticality?: string;
    department_id?: number;
    specifications?: string;
    notes?: string;
  }) => api.post('/assets', data),
  update: (id: number, data: Partial<{
    name: string;
    category_id: number | null;
    location: string | null;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    purchase_date: string | null;
    warranty_expiry: string | null;
    status: string;
    criticality: string;
    department_id: number | null;
    specifications: string | null;
    notes: string | null;
  }>) => api.put(`/assets/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/assets/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/assets/${id}`),
  getCategories: () => api.get('/assets/categories/list'),
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/assets/categories', data),
  getFailureCodes: () => api.get('/assets/failure-codes/list'),
  getFailureCodesByAsset: (assetId: number) => api.get(`/assets/failure-codes/by-asset/${assetId}`),
  generateFailureCode: (category: string) => api.get(`/assets/failure-codes/generate/${encodeURIComponent(category)}`),
  createFailureCode: (data: { code?: string; category: string; description: string }) =>
    api.post('/assets/failure-codes', data),
  updateFailureCode: (id: number, data: { code?: string; category?: string; description?: string }) =>
    api.put(`/assets/failure-codes/${id}`, data),
  deleteFailureCode: (id: number) => api.delete(`/assets/failure-codes/${id}`),
  getStatsOverview: () => api.get('/assets/stats/overview'),
};

// Work Orders API
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
  create: (data: {
    asset_id: number;
    type: 'preventive' | 'corrective' | 'emergency';
    title: string;
    description?: string;
    priority?: string;
    failure_code_id?: number;
    maintenance_schedule_id?: number;
    assignee_ids?: number[];
    scheduled_start?: string;
    scheduled_end?: string;
    // Integration fields
    related_ticket_id?: number;
    sprint_id?: number;
  }) => api.post('/work-orders', data),
  update: (id: number, data: Partial<{
    title: string;
    description: string | null;
    priority: string;
    status: string;
    failure_code_id: number | null;
    assignee_ids: number[];
    scheduled_start: string | null;
    scheduled_end: string | null;
    root_cause: string | null;
    solution: string | null;
    parts_used: string | null;
    labor_hours: number | null;
    // Integration fields
    related_ticket_id: number | null;
    sprint_id: number | null;
  }>) => api.put(`/work-orders/${id}`, data),
  start: (id: number) => api.post(`/work-orders/${id}/start`),
  complete: (id: number, data?: {
    solution?: string;
    root_cause?: string;
    labor_hours?: number;
    parts_used?: string;
  }) => api.post(`/work-orders/${id}/complete`, data),
  cancel: (id: number) => api.post(`/work-orders/${id}/cancel`),
  addAssignee: (id: number, userId: number) =>
    api.post(`/work-orders/${id}/assignees`, { user_id: userId }),
  removeAssignee: (id: number, userId: number) =>
    api.delete(`/work-orders/${id}/assignees/${userId}`),
  getStatsOverview: () => api.get('/work-orders/stats/overview'),
  // Create WO from Ticket
  createFromTicket: (ticketId: number, data: {
    asset_id: number;
    type: 'preventive' | 'corrective' | 'emergency';
    priority?: string;
    description?: string;
    assignee_ids?: number[];
    scheduled_start?: string;
    scheduled_end?: string;
  }) => api.post(`/work-orders/from-ticket/${ticketId}`, data),
  // Get child WOs for a ticket
  getByTicket: (ticketId: number) => api.get(`/work-orders/by-ticket/${ticketId}`),
};

// Inspections API (v2)
export const inspectionsAPI = {
  getMaterials: (filters?: { search?: string }) => api.get('/v2/inspections/materials', { params: filters }),
  searchMaterials: (query: string) => api.get('/v2/inspections/materials/search', { params: { q: query } }),
};

// Downtime API
export const downtimeAPI = {
  getAll: (filters?: {
    asset_id?: number;
    start_date?: string;
    end_date?: string;
    downtime_type?: string;
    classification_id?: number;
    counts_only?: boolean;
    limit?: number;
  }) => api.get('/downtime', { params: filters }),
  getActive: () => api.get('/downtime/active'),
  getById: (id: number) => api.get(`/downtime/${id}`),
  checkSchedule: (assetId: number, datetime?: string) =>
    api.get(`/downtime/check-schedule/${assetId}`, { params: { datetime } }),
  create: (data: {
    asset_id: number;
    work_order_id?: number;
    downtime_type: 'planned' | 'unplanned';
    classification_id?: number;
    start_time?: string;
    end_time?: string;
    reason?: string;
    failure_code_id?: number;
    production_impact?: { units_lost?: number; batch_affected?: string } | string;
  }) => api.post('/downtime', data),
  start: (data: {
    asset_id: number;
    downtime_type: 'planned' | 'unplanned';
    reason?: string;
    production_impact?: string;
    classification_id?: number;
    failure_code_id?: number;
  }) => api.post('/downtime', data),
  end: (id: number, data?: {
    end_time?: string;
    reason?: string;
    failure_code_id?: number;
    production_impact?: { units_lost?: number; batch_affected?: string };
  }) => api.post(`/downtime/${id}/end`, data),
  update: (id: number, data: Partial<{
    classification_id: number;
    reason: string | null;
    failure_code_id: number | null;
    production_impact: { units_lost?: number; batch_affected?: string } | null;
  }>) => api.put(`/downtime/${id}`, data),
  delete: (id: number) => api.delete(`/downtime/${id}`),
  getClassifications: (category?: string) =>
    api.get('/downtime/classifications/list', { params: { category } }),
  getStatsSummary: (params?: { asset_id?: number; start_date?: string; end_date?: string; days?: number }) =>
    api.get('/downtime/stats/summary', { params }),
};

// Maintenance API
export const maintenanceAPI = {
  // Schedules
  getSchedules: (filters?: { asset_id?: number; is_active?: boolean; overdue_only?: boolean }) =>
    api.get('/maintenance/schedules', { params: filters }),
  getUpcoming: (days?: number) =>
    api.get('/maintenance/schedules/upcoming', { params: { days } }),
  getScheduleById: (id: number) => api.get(`/maintenance/schedules/${id}`),
  createSchedule: (data: {
    asset_id: number;
    title: string;
    description?: string;
    frequency_type: string;
    frequency_value: number;
    runtime_hours_trigger?: number;
    next_due?: string;
    estimated_duration_minutes?: number;
    assigned_to?: number;
    checklist?: string[];
  }) => api.post('/maintenance/schedules', data),
  updateSchedule: (id: number, data: Partial<{
    title: string;
    description: string | null;
    frequency_type: string;
    frequency_value: number;
    runtime_hours_trigger: number | null;
    next_due: string | null;
    estimated_duration_minutes: number | null;
    assigned_to: number | null;
    is_active: boolean;
    checklist: string[] | null;
  }>) => api.put(`/maintenance/schedules/${id}`, data),
  generateWorkOrder: (scheduleId: number) =>
    api.post(`/maintenance/schedules/${scheduleId}/generate-wo`),
  deleteSchedule: (id: number) => api.delete(`/maintenance/schedules/${id}`),

  // Generate recurring/loop schedules until end date
  generateLoopSchedules: (data: {
    asset_id: number;
    title: string;
    description?: string;
    frequency_type: string;
    frequency_value: number;
    start_date: string;
    end_date?: string;
    estimated_duration_minutes?: number;
    assigned_to?: number;
    checklist?: string[];
  }) => api.post('/maintenance/schedules/generate-loop', data),

  // Production Schedule
  getProductionSchedule: (assetId: number, startDate?: string, endDate?: string) =>
    api.get('/maintenance/production-schedule', { params: { asset_id: assetId, start_date: startDate, end_date: endDate } }),
  createProductionSchedule: (data: {
    asset_id: number;
    date: string;
    shift_pattern_id?: number;
    status: 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window';
    planned_start?: string;
    planned_end?: string;
    planned_production_minutes?: number;
    product_name?: string;
    notes?: string;
  }) => api.post('/maintenance/production-schedule', data),
  updateProductionSchedule: (id: number, data: {
    asset_id: number;
    date: string;
    shift_pattern_id?: number;
    status: 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window';
    planned_start?: string;
    planned_end?: string;
    planned_production_minutes?: number;
    product_name?: string;
    notes?: string;
  }) => api.put(`/maintenance/production-schedule/${id}`, data),
  bulkCreateProductionSchedule: (data: {
    asset_id: number;
    start_date: string;
    end_date: string;
    pattern: { day_of_week: number; shift_pattern_id?: number; status: string; product_name?: string }[];
  }) => api.post('/maintenance/production-schedule/bulk', data),
  deleteProductionSchedule: (id: number) => api.delete(`/maintenance/production-schedule/${id}`),

  // Shifts
  getShifts: () => api.get('/maintenance/shifts'),
  createShift: (data: { name: string; start_time: string; end_time: string; break_minutes?: number }) =>
    api.post('/maintenance/shifts', data),
  updateShift: (id: number, data: Partial<{
    name: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    is_active: boolean;
  }>) => api.put(`/maintenance/shifts/${id}`, data),
  deleteShift: (id: number) => api.delete(`/maintenance/shifts/${id}`),

  // Calendar
  getCalendar: (startDate: string, endDate: string, assetId?: number) =>
    api.get('/maintenance/calendar', { params: { start_date: startDate, end_date: endDate, asset_id: assetId } }),
};

// Reports API
export const reportsAPI = {
  getKPIDashboard: (params?: { asset_id?: number; days?: number }) =>
    api.get('/reports/kpi/dashboard', { params }),
  getAssetKPI: (assetId: number, days?: number) =>
    api.get(`/reports/kpi/asset/${assetId}`, { params: { days } }),
  getProductionKPI: (params?: { asset_id?: number; days?: number; start_date?: string; end_date?: string }) =>
    api.get('/reports/kpi/production', { params }),
  getWorkOrderReport: (params?: {
    start_date?: string;
    end_date?: string;
    type?: string;
    status?: string;
    asset_id?: number;
  }) => api.get('/reports/work-orders', { params }),
  getDowntimeReport: (params?: {
    start_date?: string;
    end_date?: string;
    asset_id?: number;
    counts_only?: boolean;
  }) => api.get('/reports/downtime', { params }),
  getMaintenanceCompliance: (days?: number) =>
    api.get('/reports/maintenance-compliance', { params: { days } }),
  getTechnicianPerformance: (days?: number) =>
    api.get('/reports/technician-performance', { params: { days } }),
};

// Quick Actions API (Production Downtime)
export const quickActionsAPI = {
  getAll: (includeInactive?: boolean) =>
    api.get('/quick-actions', { params: { include_inactive: includeInactive } }),
  getById: (id: number) => api.get(`/quick-actions/${id}`),
  create: (data: {
    label: string;
    icon?: string;
    color?: string;
    classification_code: string;
    sort_order?: number;
  }) => api.post('/quick-actions', data),
  update: (id: number, data: Partial<{
    label: string;
    icon: string;
    color: string;
    classification_code: string;
    sort_order: number;
    is_active: boolean;
  }>) => api.put(`/quick-actions/${id}`, data),
  delete: (id: number) => api.delete(`/quick-actions/${id}`),
  reorder: (order: { id: number; sort_order: number }[]) =>
    api.post('/quick-actions/reorder', { order }),
};

// Products API (Master Data for SPK)
export const productsAPI = {
  getAll: (params?: { search?: string; is_active?: number; page?: number; limit?: number }) =>
    api.get('/v2/products', { params }),
  search: (q: string, is_active?: number) =>
    api.get('/v2/products/search', { params: { q, is_active } }),
  getById: (id: number) => api.get(`/v2/products/${id}`),
  create: (data: { code: string; name: string; material?: string; weight_gram?: number; default_packaging?: string }) =>
    api.post('/v2/products', data),
  update: (id: number, data: Partial<{ code: string; name: string; material: string; weight_gram: number; default_packaging: string; is_active: number }>) =>
    api.put(`/v2/products/${id}`, data),
  delete: (id: number) => api.delete(`/v2/products/${id}`),
  deactivate: (id: number) => api.patch(`/v2/products/${id}/deactivate`),
  reactivate: (id: number) => api.patch(`/v2/products/${id}/reactivate`),
};

// SPK (Surat Perintah Kerja) API
export const spkAPI = {
  getAll: (params?: {
    asset_id?: number;
    status?: string;
    production_date?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) => api.get('/v2/spk', { params }),
  getDashboard: (date?: string) => api.get('/v2/spk/dashboard', { params: { date } }),
  getById: (id: number) => api.get(`/v2/spk/${id}`),
  create: (data: {
    asset_id: number;
    production_date: string;
    production_schedule_id?: number;
    notes?: string;
    line_items: Array<{
      product_id: number;
      quantity: number;
      packaging_type?: string;
      remarks?: string;
    }>;
  }) => api.post('/v2/spk', data),
  update: (id: number, data: {
    asset_id?: number;
    production_date?: string;
    notes?: string;
    line_items?: Array<{
      product_id: number;
      quantity: number;
      packaging_type?: string;
      remarks?: string;
    }>;
  }) => api.put(`/v2/spk/${id}`, data),
  delete: (id: number) => api.delete(`/v2/spk/${id}`),
  submit: (id: number) => api.post(`/v2/spk/${id}/submit`),
  approve: (id: number) => api.post(`/v2/spk/${id}/approve`),
  reject: (id: number, rejection_reason: string) => api.post(`/v2/spk/${id}/reject`, { rejection_reason }),
  cancel: (id: number) => api.post(`/v2/spk/${id}/cancel`),
  revertToDraft: (id: number) => api.post(`/v2/spk/${id}/revert-to-draft`),
  duplicate: (id: number, new_production_date: string, new_asset_id?: number) =>
    api.post(`/v2/spk/${id}/duplicate`, { new_production_date, new_asset_id }),
};

// Solar API
export const solarAPI = {
  getComparison: (startDate: string, endDate: string) =>
    api.get('/v2/solar/comparison', { params: { startDate, endDate } }),
  getTrend: (date: string, dimension: number) =>
    api.get('/v2/solar/trend', { params: { date, dimension } }),
  getRealtime: () => api.get('/v2/solar/realtime'),
  saveManual: (date: string, kwh: number) =>
    api.post('/v2/solar/manual', { date, kwh }),
  syncData: (date?: string) =>
    api.get('/v2/solar/sync', { params: { date } }),
  getConfig: () => api.get('/v2/solar/config'),
  saveConfig: (data: any) =>
    api.post('/v2/solar/config', data),
  exportCsv: (startDate: string, endDate: string) =>
    api.get('/v2/solar/export', { params: { startDate, endDate }, responseType: 'blob' }),
  // PV History endpoints - Daily (from monthly data)
  getPVDaily: (startDate?: string, endDate?: string) =>
    api.get('/v2/solar/pv-history/daily', { params: { startDate, endDate } }),
  savePVHistory: (month?: number, year?: number) =>
    api.post('/v2/solar/pv-history/save', null, { params: { month, year } }),
  // PV History endpoints - Hourly
  getPVHistory: (startDate?: string, endDate?: string) =>
    api.get('/v2/solar/pv-history', { params: { startDate, endDate } }),
  getPVHistoryHourly: (date: string) =>
    api.get('/v2/solar/pv-history/hourly', { params: { date } }),
};

// Energy API (Story 9.4/9.5)
export const energyAPI = {
  getLatest: () => api.get('/v2/energy/latest'),
  getRevenue: (startDate: string, endDate: string) =>
    api.get('/v2/energy/revenue', { params: { startDate, endDate } }),
  getHistory: (startDate: string, endDate: string) =>
    api.get('/v2/energy/history', { params: { startDate, endDate } }),
};

// Incoming Material Inspection API
export const inspectionAPI = {
  getAll: (params?: {
    supplier_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/v2/inspections', { params }),
  getById: (id: number) => api.get(`/v2/inspections/${id}`),
  create: (data: any) => api.post('/v2/inspections', data),
  update: (id: number, data: any) => api.put(`/v2/inspections/${id}`, data),
  delete: (id: number) => api.delete(`/v2/inspections/${id}`),

  // Suppliers for inspection
  searchSuppliers: (q: string) => api.get('/v2/inspections/suppliers/search', { params: { q } }),
  getSuppliers: () => api.get('/v2/inspections/suppliers'),
  createSupplier: (data: any) => api.post('/v2/inspections/suppliers', data),
  updateSupplier: (id: number, data: any) => api.put(`/v2/inspections/suppliers/${id}`, data),

  // Producers for inspection
  searchProducers: (q: string) => api.get('/v2/inspections/producers/search', { params: { q } }),
  getProducers: () => api.get('/v2/inspections/producers'),
  createProducer: (data: any) => api.post('/v2/inspections/producers', data),
  updateProducer: (id: number, data: any) => api.put(`/v2/inspections/producers/${id}`, data),

  // Materials for inspection
  searchMaterials: (q: string) => api.get('/v2/inspections/materials/search', { params: { q } }),
  getMaterials: () => api.get('/v2/inspections/materials'),
  createMaterial: (data: any) => api.post('/v2/inspections/materials', data),
  updateMaterial: (id: number, data: any) => api.put(`/v2/inspections/materials/${id}`, data),

  // Plants (Pabrik Danone)
  searchPlants: (q: string) => api.get('/v2/inspections/plants/search', { params: { q } }),
  getPlants: () => api.get('/v2/inspections/plants'),
  createPlant: (data: any) => api.post('/v2/inspections/plants', data),
  updatePlant: (id: number, data: any) => api.put(`/v2/inspections/plants/${id}`, data),
};

// Production API (Machine Parameters)
export const productionAPI = {
  submitLog: (data: {
    asset_id: number;
    production_date: string;
    shift: string;
    product_name: string;
    operator_name: string;
    values: { parameter_id: number; value: number }[];
  }) => api.post('/v2/production/logs', data),
  
  getLogs: (assetId: number, params?: { limit?: number; date?: string; shift?: string }) =>
    api.get(`/v2/production/logs/${assetId}`, { params }),
    
  getLogDetail: (id: number) =>
    api.get(`/v2/production/logs/detail/${id}`),

  getParameters: (assetId: number) => 
    api.get(`/v2/production/parameters/${assetId}`),

  createParameter: (data: {
    asset_id: number;
    section: string;
    name: string;
    unit?: string;
    setting_a_min?: number;
    setting_a_max?: number;
    setting_b_min?: number;
    setting_b_max?: number;
    setting_c_min?: number;
    setting_c_max?: number;
  }) => api.post('/v2/production/parameters', data),

  updateParameter: (id: number, data: {
    section: string;
    name: string;
    unit?: string;
    setting_a_min?: number;
    setting_a_max?: number;
    setting_b_min?: number;
    setting_b_max?: number;
    setting_c_min?: number;
    setting_c_max?: number;
  }) => api.put(`/v2/production/parameters/${id}`, data),

  deleteParameter: (id: number) =>
    api.delete(`/v2/production/parameters/${id}`),

  updateParametersOrder: (orders: { id: number; sort_order: number; section: string }[]) =>
    api.put('/v2/production/parameters/order', { orders }),

  // Downtime by shift (auto-fetch for production form)
  getDowntimeByShift: (params: { asset_id: number; date: string; shift: string }) =>
    api.get('/v2/production/downtime-by-shift', { params }),

  // Production Reports
  getReport: (parameterSetId: number) =>
    api.get(`/v2/production/reports/${parameterSetId}`),
    
  saveReport: (data: {
    parameter_set_id: number;
    material_usage: any[];
    material_aux_usage: any[];
    waste_data: any[];
    downtime_data: any;
    production_result: any[];
    notes?: string;
  }) => api.post('/v2/production/reports', data),
};

export const publicAPI = {
  getVersion: () => api.get('/public/version'),
};

export default api;
