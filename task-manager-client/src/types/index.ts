export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  whatsapp?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'member';
  department_id?: number;
  department_name?: string;
  department_color?: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  color: string;
  member_count?: number;
  members?: User[];
  created_at: string;
  updated_at: string;
}

export interface Assignee {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Ticket {
  id: number;
  ticket_key: string;
  title: string;
  description?: string;
  type: 'bug' | 'task' | 'story' | 'epic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  story_points?: number;
  reporter_id: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_avatar?: string;
  assignees?: Assignee[];
  department_id?: number;
  department_name?: string;
  department_color?: string;
  epic_id?: number;
  epic_key?: string;
  epic_title?: string;
  sprint_id?: number;
  sprint_name?: string;
  sprint_status?: string;
  due_date?: string;
  // Integration fields
  asset_id?: number;
  asset_code?: string;
  asset_name?: string;
  related_wo_id?: number;
  related_wo_number?: string;
  // Failure Code (for maintenance tickets)
  failure_code_id?: number;
  failure_code?: string;
  failure_description?: string;
  failure_category?: string;
  // Counts and relations
  comment_count?: number;
  comments?: Comment[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'completed';
  total_tickets?: number;
  completed_tickets?: number;
  total_points?: number;
  completed_points?: number;
  progress?: number;
  tickets?: Ticket[];
  statusBreakdown?: {
    todo: Ticket[];
    in_progress: Ticket[];
    review: Ticket[];
    done: Ticket[];
  };
  pointsByStatus?: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Epic extends Ticket {
  children?: Ticket[];
  totalChildren?: number;
  doneChildren?: number;
  progress?: number;
  statusBreakdown?: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
}

export interface Comment {
  id: number;
  content: string;
  ticket_id: number;
  user_id: number;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  mimetype?: string;
  size?: number;
  ticket_id: number;
  uploaded_by: number;
  uploaded_by_name?: string;
  created_at: string;
}

export interface Activity {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  user_name?: string;
  user_avatar?: string;
  ticket_key?: string;
  ticket_title?: string;
  details?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'assigned' | 'comment' | 'status' | 'mention';
  title: string;
  message?: string;
  ticket_id?: number;
  ticket_key?: string;
  actor_id?: number;
  actor_name?: string;
  actor_avatar?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  overview: {
    totalTickets: number;
    totalUsers: number;
    totalDepartments: number;
    overdueTickets: number;
    overduePM?: number;
  };
  ticketsByStatus: { status: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByType: { type: string; count: number }[];
  ticketsByDepartment: { name: string; color: string; count: number }[];
  pmDueThisWeek?: {
    id: number;
    title: string;
    next_due: string;
    asset_code: string;
    asset_name: string;
    status: 'overdue' | 'due_today' | 'upcoming';
  }[];
  myTickets: {
    assigned: { status: string; count: number }[];
    reported: number;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, department_id?: number) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isManagerOrAdmin: boolean;
}

// ============================================
// Maintenance Management System Types
// ============================================

export interface AssetCategory {
  id: number;
  name: string;
  description?: string;
  asset_count?: number;
  created_at: string;
}

export interface Asset {
  id: number;
  asset_code: string;
  name: string;
  category_id?: number;
  category_name?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status: 'operational' | 'maintenance' | 'breakdown' | 'retired';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  department_id?: number;
  department_name?: string;
  specifications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  recentWorkOrders?: WorkOrder[];
  maintenanceSchedules?: MaintenanceSchedule[];
  downtimeStats?: {
    total_incidents: number;
    total_downtime_minutes: number;
    unplanned_count: number;
    planned_count: number;
  };
  recentDowntime?: DowntimeLog[];
}

export interface FailureCode {
  id: number;
  code: string;
  category: string;
  description: string;
}

export interface ShiftPattern {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_active: boolean | number; // SQLite returns 1/0 for boolean
}

export interface ProductionScheduleEntry {
  id: number;
  asset_id: number;
  date: string;
  shift_pattern_id?: number;
  shift_name?: string;
  shift_start?: string;
  shift_end?: string;
  status: 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window';
  planned_start?: string;
  planned_end?: string;
  planned_production_minutes?: number;
  actual_production_minutes?: number;
  product_name?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface DowntimeClassification {
  id: number;
  code: string;
  name: string;
  description?: string;
  counts_as_downtime: boolean;
  category: 'breakdown' | 'planned_maintenance' | 'changeover' | 'idle' | 'production';
}

export interface MaintenanceSchedule {
  id: number;
  asset_id: number;
  asset_code?: string;
  asset_name?: string;
  asset_location?: string;
  title: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'runtime_hours';
  frequency_value: number;
  runtime_hours_trigger?: number;
  last_performed?: string;
  next_due?: string;
  estimated_duration_minutes?: number;
  assigned_to?: number;
  assigned_to_name?: string;
  is_active: boolean;
  checklist?: string; // JSON string of checklist items
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
  completed_count?: number;
  total_scheduled?: number;
  criticality?: string;
}

export interface WorkOrderAssignee {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  asset_id: number;
  asset_code?: string;
  asset_name?: string;
  asset_location?: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  failure_code_id?: number;
  failure_code?: string;
  failure_description?: string;
  failure_category?: string;
  maintenance_schedule_id?: number;
  schedule_title?: string;
  reported_by?: number;
  reporter_name?: string;
  reporter_email?: string;
  assignees?: WorkOrderAssignee[]; // Multiple assignees
  assigned_to?: number; // Deprecated, for backward compatibility
  assigned_to_name?: string;
  assigned_to_email?: string;
  // Integration fields
  related_ticket_id?: number;
  related_ticket_key?: string;
  related_ticket_title?: string;
  sprint_id?: number;
  sprint_name?: string;
  sprint_status?: string;
  // Scheduling
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  root_cause?: string;
  solution?: string;
  parts_used?: string;
  labor_hours?: number;
  actual_duration_hours?: number;
  created_at: string;
  updated_at: string;
  downtimeLogs?: DowntimeLog[];
}

export interface DowntimeLog {
  id: number;
  asset_id: number;
  asset_code?: string;
  asset_name?: string;
  work_order_id?: number;
  wo_number?: string;
  work_order_number?: string;
  downtime_type: 'planned' | 'unplanned';
  classification_id?: number;
  classification_code?: string;
  classification_name?: string;
  classification_category?: string;
  counts_as_downtime?: boolean;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  current_duration_minutes?: number;
  was_scheduled_production?: boolean;
  production_schedule_id?: number;
  schedule_date?: string;
  schedule_status?: string;
  reason?: string;
  failure_code_id?: number;
  failure_code?: string;
  failure_code_code?: string;
  failure_code_description?: string;
  failure_description?: string;
  failure_category?: string;
  production_impact?: {
    units_lost?: number;
    batch_affected?: string;
  };
  logged_by?: number;
  logged_by_name?: string;
  created_at: string;
}

export interface MaintenanceKPI {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  kpi: {
    availability: number;
    mtbf: number;
    mttr: number;
    scheduledTimeHours: number;
    downtimeHours: number;
    operatingTimeHours: number;
    failureCount: number;
    totalIncidents?: number;
    unplannedIncidents?: number;
    plannedIncidents?: number;
  };
  downtimeByType?: {
    category: string;
    name: string;
    counts_as_downtime: boolean;
    incidents: number;
    total_minutes: number;
  }[];
  workOrderStats?: {
    type: string;
    count: number;
    completed: number;
    avg_completion_hours: number;
  }[];
  topFailingAssets?: {
    asset_code: string;
    name: string;
    failures: number;
    total_downtime_minutes: number;
  }[];
  topFailureCodes?: {
    code: string;
    category: string;
    description: string;
    occurrences: number;
    total_downtime_minutes: number;
  }[];
  weeklyTrend?: {
    week: string;
    incidents: number;
    total_minutes: number;
    counted_minutes: number;
  }[];
  dailyTrend?: {
    date: string;
    downtime_minutes: number;
    incidents: number;
  }[];
  pmCompliance?: {
    totalScheduled: number;
    completedOnTime: number;
    completedLate: number;
    overdue: number;
    complianceRate: number;
  };
  upcomingPM?: {
    id: number;
    title: string;
    next_due: string;
    frequency_type: string;
    estimated_duration_minutes?: number;
    asset_code: string;
    asset_name: string;
    criticality: string;
    assigned_to_name?: string;
    status: 'overdue' | 'due_today' | 'upcoming';
  }[];
}

export interface ScheduleCheckResult {
  hasSchedule: boolean;
  status: string;
  message: string;
  countsAsDowntime: boolean;
  schedule?: ProductionScheduleEntry;
}

export interface ProductionQuickAction {
  id: number;
  label: string;
  icon: string;
  color: string;
  classification_code: string;
  classification_name?: string;
  classification_description?: string;
  sort_order: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}



// SPK Production Order System Types
export * from './spk';

// Incoming Material Inspection Types
export * from './inspection';

export interface BCSparepart {
  No: string;
  Description: string;
  InventoryCtrl: number;
}

export interface CMMSSparepart {
  id_sp: string;
  kode_sp: string;
  nama_sp: string;
  qty_sp: string;
  nama_kategori?: string;
  nama_asset?: string;
  nama_lokasi?: string;
}

export interface SparepartComparison extends BCSparepart {
  cmms_qty: number;
  cmms_name?: string;
  cmms_asset?: string;
  cmms_location?: string;
  diff: number;
  is_match: boolean;
  exists_in_bc: boolean;
  exists_in_cmms: boolean;
}

// Machine Parameters
export interface MachineParameter {
  id: number;
  asset_id: number;
  name: string;
  section: string;
  unit: string | null;
  setting_a_min: number | null;
  setting_a_max: number | null;
  setting_b_min: number | null;
  setting_b_max: number | null;
  setting_c_min: number | null;
  setting_c_max: number | null;
  sort_order: number;
}

export interface MachineParameterValue {
  id: number;
  set_id: number;
  parameter_id: number;
  value: number;
  // Joined fields
  parameter_name?: string;
  section?: string;
  unit?: string;
  setting_a_min?: number | null;
  setting_a_max?: number | null;
  setting_b_min?: number | null;
  setting_b_max?: number | null;
  setting_c_min?: number | null;
  setting_c_max?: number | null;
}

export interface MachineParameterSet {
  id: number;
  asset_id: number;
  asset_name?: string;
  production_date: string;
  shift: string;
  product_name: string;
  operator_name: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  values?: MachineParameterValue[];
}
