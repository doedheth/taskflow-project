export type ComplaintStatus = 'draft' | 'pending' | 'on_hold' | 'resolved';

export interface ComplaintPhoto {
  photo_url: string;
  description?: string;
}

export interface Complaint {
  id: number;
  inspection_id: number;
  no: string; // Nomor komplain
  item_name: string;
  tanggal_datang: string;
  qty: number;
  unit?: string;
  batch_no?: string | null;
  po_no?: string | null;
  surat_jalan_ref?: string | null;
  attn: string;
  keterangan: string; // Keterangan ketidaksesuaian
  dibuat_oleh: string;
  diketahui_oleh: string;
  created_at: string;
  supplier_response_analisa: string;
  supplier_response_perbaikan: string;
  supplier_response_pencegahan: string;
  qaqc_signature_url?: string | null;
  spv_qaqc_signature_url?: string | null; // Tanda tangan SPV QAQC
  ppic_signature_url?: string | null;
  supplier_signature_url?: string | null;
  qc_incoming_name?: string | null;
  spv_qaqc_name?: string | null;
  ppic_name?: string | null;
  supplier_person_name?: string | null;
  supplier_ttd: string;
  photos?: ComplaintPhoto[]; // Foto-foto bukti ketidaksesuaian
  status: ComplaintStatus;
  updated_at: string;
}