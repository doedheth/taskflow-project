/**
 * Complaint Type Definition for Incoming Inspection Complaint Module
 */
export type ComplaintStatus = 'draft' | 'pending' | 'on_hold' | 'resolved';

export interface ComplaintPhoto {
  photo_url: string;
  description?: string;
}

export interface Complaint {
  id: number;
  inspection_id: number;
  no: string; // running number/ID
  item_name: string;
  tanggal_datang: string;
  qty: number;
  unit?: string;
  batch_no?: string | null;
  attn: string;
  keterangan: string;
  dibuat_oleh: string;
  diketahui_oleh: string;
  created_at: string;
  supplier_response_analisa: string;
  supplier_response_perbaikan: string;
  supplier_response_pencegahan: string;
  supplier_ttd: string;
  photos?: ComplaintPhoto[]; // Foto-foto bukti ketidaksesuaian
  status: ComplaintStatus;
  updated_at: string;
}