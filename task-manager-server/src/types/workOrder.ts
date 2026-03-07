/**
 * Work Order Type Definitions
 */

import { TimestampFields } from './common';

// ============================================
// Enums
// ============================================

export type WorkOrderType = 'preventive' | 'corrective' | 'emergency';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

// ============================================
// Main Entity
// ============================================

export interface WorkOrder extends TimestampFields {
  id: number;
  wo_number: string;
  asset_id: number;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description?: string | null;
  failure_code_id?: number | null;
  maintenance_schedule_id?: number | null;
  reported_by?: number | null;
  assigned_to?: number | null; // Legacy field
  // Integration fields
  related_ticket_id?: number | null;
  sprint_id?: number | null;
  // Scheduling
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  // Completion
  root_cause?: string | null;
  solution?: string | null;
  parts_used?: string | null;
  labor_hours?: number | null;
}

// ============================================
// Related Types
// ============================================

export interface WorkOrderAssignee {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface WorkOrderWithDetails extends WorkOrder {
  // Asset info
  asset_code?: string;
  asset_name?: string;
  // Failure code info
  failure_code?: string;
  failure_description?: string;
  // Reporter info
  reporter_name?: string;
  // Related ticket info
  related_ticket_key?: string;
  // Sprint info
  sprint_name?: string;
  // Assignees
  assignees?: WorkOrderAssignee[];
}

// ============================================
// DTOs
// ============================================

export interface CreateWorkOrderDTO {
  asset_id: number;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  failure_code_id?: number;
  maintenance_schedule_id?: number;
  related_ticket_id?: number;
  sprint_id?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  assignee_ids?: number[];
}

export interface UpdateWorkOrderDTO {
  asset_id?: number;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  title?: string;
  description?: string;
  failure_code_id?: number | null;
  scheduled_start?: string;
  scheduled_end?: string;
  assignee_ids?: number[];
}

export interface CompleteWorkOrderDTO {
  root_cause?: string;
  solution?: string;
  parts_used?: string;
  labor_hours?: number;
}

export interface StartWorkOrderDTO {
  actual_start?: string;
}

// ============================================
// Filter Types
// ============================================

export interface WorkOrderFilter {
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  priority?: WorkOrderPriority;
  asset_id?: number;
  assigned_to?: number;
  sprint_id?: number;
  related_ticket_id?: number;
  limit?: number;
}
