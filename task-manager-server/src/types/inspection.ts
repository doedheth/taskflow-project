/**
 * Incoming Material Inspection Type Definitions
 */

import { TimestampFields } from './common';

export type InspectionStatus = 'pending' | 'completed' | 'cancelled';

export interface Supplier extends TimestampFields {
  id: number;
  code: string;
  name: string;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  is_active: number;
}

export interface CreateSupplierDTO {
  code: string;
  name: string;
  email?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
}

export interface Material extends TimestampFields {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: number;
}

export interface CreateMaterialDTO {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateMaterialDTO {
  code?: string;
  name?: string;
  description?: string;
  is_active?: number;
}

export interface Producer extends TimestampFields {
  id: number;
  code: string;
  name: string;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  is_active: number;
}

export interface CreateProducerDTO {
  code: string;
  name: string;
  email?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
}

// Plants (Pabrik Danone)
export interface Plant {
  id: number;
  code: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlantDTO {
  code?: string;
  name: string;
  address?: string;
  contact_person?: string;
  phone?: string;
}

export interface UpdateProducerDTO {
  code?: string;
  name?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  is_active?: number;
}

export interface UpdateSupplierDTO {
  code?: string;
  name?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  is_active?: number;
}

export interface Inspection extends TimestampFields {
  id: number;
  inspection_no: string;
  inspection_date: string;
  supplier_id: number;
  producer_id: number | null;
  material_id: number | null;
  po_no: string | null;
  surat_jalan_no: string | null;
  pabrik_danone: string | null;
  product_code: string | null;
  kode_produksi: string | null;
  nama_produsen: string | null;
  negara_produsen: string | null;
  logo_halal: string | null;
  expedition_name: string | null;
  vehicle_no: string | null;
  vehicle_type: string | null; // Added
  vehicle_cover_type: string | null; // Added: 'Box' | 'Terpal'
  driver_name: string | null;
  driver_phone: string | null;
  expired_date: string | null;
  no_seal: string | null;
  arrival_time: string | null;
  unloading_start_time: string | null;
  unloading_end_time: string | null;
  total_items_received: number | null;
  total_items_received_text: string | null;
  checker_id: number;
  checker_signature: string | null;
  driver_signature: string | null;
  warehouse_signature: string | null;
  supervisor_signature: string | null;
  status: InspectionStatus;
  notes: string | null;
  packaging_notes: string | null;
  vehicle_clean: number;
  vehicle_no_odor: number;
  vehicle_closed: number;
  vehicle_on_time: number;
  vehicle_on_time_delivery: number;
  item_not_wet: number;
  item_not_torn: number;
  item_not_dusty: number;
  item_closed_tight: number;
  item_no_haram: number;
  pkg_condition: string | null; // Baik, Rusak, Rusak Sebagian
  pkg_name_check: string | null; // Ada, Tidak Ada
  pkg_hazard_label: string | null; // Ada, Tidak Ada, Tidak Perlu
  pkg_good: number;
  pkg_label_ok: number;
  packaging_unit: string | null;
  measure_unit: string | null; // Added
  material_type: string | null;
  warna: string | null;
  jumlah_sampling: string | null;
  tanggal_produksi: string | null;
  item_name: string | null;
  surat_jalan_photo_url: string | null;
  ttb_photo_url: string | null;
  coa_photo_url: string | null;
}

export interface InspectionItem {
  id: number;
  inspection_id: number;
  batch_no: string | null;
  lot_code?: string | null;
  batch_vendor?: string | null; // Added
  expired_date: string | null;
  palet_no: string | null;
  qty: number | null;
  weight_per_unit?: number | null; // Added
  scale_weight?: number | null; // Added: sampling scale weight (input-only)
  is_ok: number;
  notes: string | null;
}

export interface InspectionWeight {
  id: number;
  inspection_id: number;
  batch_no: string | null;
  batch_vendor?: string | null; // Added: vendor batch for weight attachment
  weight: number;
  photo_url: string | null;
}

export interface InspectionAttachment {
  id: number;
  inspection_id: number;
  photo_url: string;
  description: string | null;
}

export interface InspectionQCParams {
  id: number;
  inspection_id: number;
  q_berat?: number;
  q_joint?: number;
  q_creasing?: number;
  q_coa_panjang?: number;
  q_coa_lebar?: number;
  q_coa_tinggi?: number;
  q_coa_tebal?: number;
  q_coa_bct?: number;
  q_coa_cobb?: number;
  q_coa_bursting?: number;
  q_coa_batch_lot?: number;
  q_coa_color_chip?: number;
  q_visual_sobek?: number;
  q_visual_cetakan?: number;
  q_visual_flutting?: number;
  q_visual_packaging?: number;
  q_visual_warna?: number;
  q_visual_clarity?: number;
  fs_mat_bersih?: number;
  fs_mat_bau?: number;
  fs_veh_bersih?: number;
  fs_veh_bau?: number;
  fs_veh_bak?: number;
  fs_veh_segel?: number;
  qc_score?: number;
  fs_score?: number;
  decision?: string;
}

export interface InspectionWithDetails extends Inspection {
  supplier_name?: string;
  supplier_code?: string;
  producer_name?: string;
  producer_code?: string;
  material_name?: string;
  material_code?: string;
  checker_name?: string;
  items?: InspectionItem[];
  weights?: InspectionWeight[];
  attachments?: InspectionAttachment[]; // Added
  qc_params?: InspectionQCParams;
}

export interface CreateInspectionDTO {
  inspection_date: string;
  supplier_id: number;
  producer_id?: number;
  material_id?: number;
  po_no?: string;
  surat_jalan_no?: string;
  pabrik_danone?: string;
  product_code?: string;
  kode_produksi?: string;
  nama_produsen?: string;
  negara_produsen?: string;
  logo_halal?: string;
  expedition_name?: string;
  vehicle_no?: string;
  vehicle_type?: string; // Added
  vehicle_cover_type?: string; // Added
  driver_name?: string;
  driver_phone?: string;
  expired_date?: string;
  no_seal?: string;
  arrival_time?: string;
  unloading_start_time?: string;
  unloading_end_time?: string;
  total_items_received?: number;
  total_items_received_text?: string;
  checker_id: number;
  checker_signature?: string;
  driver_signature?: string;
  warehouse_signature?: string;
  supervisor_signature?: string;
  status?: InspectionStatus;
  notes?: string;
  packaging_notes?: string;
  vehicle_clean?: number;
  vehicle_no_odor?: number;
  vehicle_closed?: number;
  vehicle_on_time?: number;
  vehicle_on_time_delivery?: number;
  item_not_wet?: number;
  item_not_torn?: number;
  item_not_dusty?: number;
  item_closed_tight?: number;
  item_no_haram?: number;
  pkg_condition?: string;
  pkg_name_check?: string;
  pkg_hazard_label?: string;
  pkg_good?: number;
  pkg_label_ok?: number;
  packaging_unit?: string | null;
  measure_unit?: string | null;
  material_type?: string;
  warna?: string;
  jumlah_sampling?: string;
  tanggal_produksi?: string;
  item_name?: string;
  surat_jalan_photo_url?: string;
  ttb_photo_url?: string;
  coa_photo_url?: string;
  items?: Omit<InspectionItem, 'id' | 'inspection_id'>[];
  weights?: Omit<InspectionWeight, 'id' | 'inspection_id'>[];
  attachments?: { photo_url: string; description?: string }[]; // Added
  qc_params?: Omit<InspectionQCParams, 'id' | 'inspection_id'>;
}

export interface InspectionFilter {
  supplier_id?: number;
  status?: InspectionStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
}
