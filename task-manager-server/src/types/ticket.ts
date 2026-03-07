/**
 * Ticket Type Definitions
 */

import { TimestampFields } from './common';

// ============================================
// Enums
// ============================================

export type TicketType = 'bug' | 'task' | 'story' | 'epic';
export type TicketStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// Main Entity
// ============================================

export interface Ticket extends TimestampFields {
  id: number;
  ticket_key: string;
  title: string;
  description?: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  story_points?: number | null;
  reporter_id: number;
  department_id?: number | null;
  epic_id?: number | null;
  sprint_id?: number | null;
  due_date?: string | null;
  // Maintenance integration
  asset_id?: number | null;
  related_wo_id?: number | null;
}

// ============================================
// Related Types
// ============================================

export interface TicketAssignee {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface TicketAttachment {
  id: number;
  ticket_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: number;
  created_at: string;
  uploaded_by_name?: string;
}

// ============================================
// With Details
// ============================================

export interface TicketWithDetails extends Ticket {
  // Reporter info
  reporter_name?: string;
  reporter_email?: string;
  reporter_avatar?: string;
  // Department info
  department_name?: string;
  department_color?: string;
  // Epic info
  epic_key?: string;
  epic_title?: string;
  // Sprint info
  sprint_name?: string;
  sprint_status?: string;
  // Asset info
  asset_code?: string;
  asset_name?: string;
  // Work Order info
  related_wo_number?: string;
  // Computed
  comment_count?: number;
  // Relations
  assignees?: TicketAssignee[];
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
}

// ============================================
// DTOs
// ============================================

export interface CreateTicketDTO {
  title: string;
  description?: string;
  type?: TicketType;
  priority?: TicketPriority;
  story_points?: number;
  department_id?: number;
  epic_id?: number;
  sprint_id?: number;
  due_date?: string;
  asset_id?: number;
  assignee_ids?: number[];
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  type?: TicketType;
  status?: TicketStatus;
  priority?: TicketPriority;
  story_points?: number;
  department_id?: number | null;
  epic_id?: number | null;
  sprint_id?: number | null;
  due_date?: string | null;
  asset_id?: number | null;
  assignee_ids?: number[];
}

export interface CreateCommentDTO {
  content: string;
}

// ============================================
// Filter Types
// ============================================

export interface TicketFilter {
  status?: TicketStatus;
  type?: TicketType;
  priority?: TicketPriority;
  assignee?: number;
  department?: number;
  sprint?: number | 'backlog';
  epic_id?: number;
  search?: string;
}

// ============================================
// Quick Maintenance
// ============================================

export interface QuickMaintenanceDTO {
  title: string;
  description?: string;
  priority: TicketPriority;
  asset_id: number;
  assignee_ids: number[];
  wo_type?: 'preventive' | 'corrective' | 'emergency';
}

export interface QuickMaintenanceResult {
  ticket: TicketWithDetails;
  workOrder: {
    id: number;
    wo_number: string;
    title: string;
  };
}
