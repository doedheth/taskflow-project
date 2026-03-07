/**
 * Asset Type Definitions
 */

import { TimestampFields } from './common';

// ============================================
// Enums
// ============================================

export type AssetStatus = 'operational' | 'down' | 'maintenance' | 'retired';
export type AssetCriticality = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// Main Entity
// ============================================

export interface Asset extends TimestampFields {
  id: number;
  asset_code: string;
  name: string;
  category_id?: number | null;
  location?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  status: AssetStatus;
  criticality: AssetCriticality;
  department_id?: number | null;
  specifications?: string | null;
  notes?: string | null;
}

// ============================================
// Related Types
// ============================================

export interface AssetCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface FailureCode {
  id: number;
  code: string;
  category: string;
  description: string;
}

// ============================================
// With Details
// ============================================

export interface AssetWithDetails extends Asset {
  category_name?: string;
  department_name?: string;
  // Statistics
  total_downtime_minutes?: number;
  total_work_orders?: number;
  pending_work_orders?: number;
  recent_downtime_count?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreateAssetDTO {
  asset_code: string;
  name: string;
  category_id?: number;
  location?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status?: AssetStatus;
  criticality?: AssetCriticality;
  department_id?: number;
  specifications?: string;
  notes?: string;
}

export interface UpdateAssetDTO {
  asset_code?: string;
  name?: string;
  category_id?: number | null;
  location?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  status?: AssetStatus;
  criticality?: AssetCriticality;
  department_id?: number | null;
  specifications?: string | null;
  notes?: string | null;
}

// ============================================
// Filter Types
// ============================================

export interface AssetFilter {
  status?: AssetStatus;
  category_id?: number;
  department_id?: number;
  criticality?: AssetCriticality;
  search?: string;
}

// ============================================
// Statistics
// ============================================

export interface AssetStatistics {
  total: number;
  byStatus: { status: string; count: number }[];
  byCriticality: { criticality: string; count: number }[];
  needingAttention: number;
}
