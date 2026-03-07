/**
 * Downtime Type Definitions
 */

import { TimestampFields } from './common';

// ============================================
// Enums
// ============================================

export type DowntimeType = 'unplanned' | 'planned';
export type DowntimeStatus = 'active' | 'resolved' | 'cancelled';
export type DowntimeCategory = 'maintenance' | 'production';
export type ClassificationType =
  | 'breakdown'
  | 'planned_maintenance'
  | 'changeover'
  | 'idle'
  | 'production';

// ============================================
// Main Entity
// ============================================

export interface DowntimeLog {
  id: number;
  asset_id: number;
  work_order_id?: number | null;
  downtime_type: DowntimeType;
  classification_id?: number | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  was_scheduled_production?: number | null;
  production_schedule_id?: number | null;
  reason?: string | null;
  failure_code_id?: number | null;
  production_impact?: string | null;
  logged_by?: number | null;
  department_id?: number | null;
  status?: DowntimeStatus;
  created_at: string;
  updated_at?: string;
}

// ============================================
// Classification
// ============================================

export interface DowntimeClassification {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: DowntimeCategory;
  counts_as_downtime: number;
  is_active?: number;
}

// ============================================
// With Details
// ============================================

export interface DowntimeLogWithDetails extends DowntimeLog {
  // Asset info
  asset_code?: string;
  asset_name?: string;
  // Classification info
  classification_code?: string;
  classification_name?: string;
  classification_color?: string;
  classification_type?: string;
  classification_category?: string;
  counts_as_downtime?: number;
  // Work Order info
  wo_number?: string;
  wo_title?: string;
  // Logged by info
  logged_by_name?: string;
  department_name?: string;
  // Failure code info
  failure_code?: string;
  failure_description?: string;
  failure_category?: string;
}

// ============================================
// DTOs
// ============================================

export interface CreateDowntimeDTO {
  asset_id: number;
  downtime_type?: DowntimeType;
  classification_id?: number;
  reason?: string;
  failure_code_id?: number;
  production_impact?: string;
  work_order_id?: number;
  start_time?: string;
  end_time?: string;
}

export interface EndDowntimeDTO {
  end_time?: string;
  reason?: string;
  production_impact?: string;
}

export interface UpdateDowntimeDTO {
  reason?: string;
  production_impact?: string;
  classification_id?: number;
  failure_code_id?: number;
}

// ============================================
// Filter Types
// ============================================

export interface DowntimeFilter {
  asset_id?: number;
  start_date?: string;
  end_date?: string;
  downtime_type?: DowntimeType;
  classification_id?: number;
  category?: DowntimeCategory;
  department_id?: number;
  status?: DowntimeStatus;
  work_order_id?: number;
  limit?: number;
}

// ============================================
// Statistics Types
// ============================================

export interface DowntimeStatistics {
  totalDowntime: number;
  activeCount: number;
  byClassification: Array<{
    classification_id: number;
    classification_name: string;
    classification_color: string;
    count: number;
    total_minutes: number;
  }>;
  byAsset: Array<{
    asset_id: number;
    asset_name: string;
    count: number;
    total_minutes: number;
  }>;
}

// ============================================
// Classification Result
// ============================================

export interface ClassificationResult {
  classificationId: number;
  wasScheduledProduction: boolean;
  scheduleId: number | null;
}
