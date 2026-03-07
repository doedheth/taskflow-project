/**
 * SPK (Surat Perintah Kerja) Type Definitions
 *
 * Types for the SPK Production Order System
 */

import { TimestampFields } from './common';

// ============= Enums / Union Types =============

export type SPKStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PackagingType = 'BOX' | 'NICTAINER' | 'ZAK' | 'KARUNG';

// Valid status transitions
export const SPK_STATUS_TRANSITIONS: Record<SPKStatus, SPKStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected'],
  approved: ['cancelled'],
  rejected: ['draft'],
  cancelled: [],
};

// ============= Product (Master Data) =============

export interface Product extends TimestampFields {
  id: number;
  code: string;
  name: string;
  material: string | null;
  weight_gram: number | null;
  default_packaging: string | null;
  is_active: number; // 1 = active, 0 = inactive (SQLite boolean)
}

export interface CreateProductDTO {
  code: string;
  name: string;
  material?: string;
  weight_gram?: number;
  default_packaging?: string;
}

export interface UpdateProductDTO {
  code?: string;
  name?: string;
  material?: string;
  weight_gram?: number;
  default_packaging?: string;
  is_active?: number;
}

export interface ProductFilter {
  search?: string;
  is_active?: number;
}

// ============= SPK Header =============

export interface SPKHeader extends TimestampFields {
  id: number;
  spk_number: string;
  asset_id: number;
  production_date: string; // YYYY-MM-DD
  production_schedule_id: number | null;
  status: SPKStatus;
  created_by: number;
  approved_by: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

export interface SPKHeaderWithDetails extends SPKHeader {
  asset_code?: string;
  asset_name?: string;
  created_by_name?: string;
  approved_by_name?: string;
  line_items_count?: number;
}

export interface CreateSPKHeaderDTO {
  asset_id: number;
  production_date: string;
  production_schedule_id?: number;
  notes?: string;
  line_items: CreateSPKLineItemDTO[];
}

export interface UpdateSPKHeaderDTO {
  asset_id?: number;
  production_date?: string;
  production_schedule_id?: number;
  notes?: string;
  line_items?: CreateSPKLineItemDTO[]; // Replace all line items
}

export interface SPKFilter {
  asset_id?: number;
  status?: SPKStatus;
  date_from?: string;
  date_to?: string;
  created_by?: number;
  production_date?: string;
}

// ============= SPK Line Item =============

export interface SPKLineItem {
  id: number;
  spk_header_id: number;
  sequence: number;
  product_id: number;
  quantity: number;
  packaging_type: string | null;
  packaging_confirmed: number; // 1 = confirmed, 0 = not confirmed
  remarks: string | null;
}

export interface SPKLineItemWithProduct extends SPKLineItem {
  product_code?: string;
  product_name?: string;
  product_material?: string;
  product_weight_gram?: number;
}

export interface CreateSPKLineItemDTO {
  sequence?: number; // Will be auto-assigned if not provided
  product_id: number;
  quantity: number;
  packaging_type?: string;
  packaging_confirmed?: number;
  remarks?: string;
}

// ============= Combined Types =============

export interface SPKWithItems extends SPKHeaderWithDetails {
  line_items: SPKLineItemWithProduct[];
}

export interface SPKDashboardItem {
  asset_id: number;
  asset_code: string;
  asset_name: string;
  total_spk: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  draft_count: number;
}

export interface SPKDashboardSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  cancelled: number;
  by_asset: SPKDashboardItem[];
}

// ============= Action DTOs =============

export type SubmitSPKDTO = Record<string, never>;

export type ApproveSPKDTO = Record<string, never>;

export interface RejectSPKDTO {
  rejection_reason: string;
}

export interface DuplicateSPKDTO {
  new_production_date: string;
  new_asset_id?: number; // Optional, defaults to same asset
}
