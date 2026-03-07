/**
 * Inspection Repository
 */

import { BaseRepository } from './BaseRepository';
import {
  Inspection,
  InspectionWithDetails,
  InspectionItem,
  InspectionWeight,
  InspectionAttachment, // Added
  CreateInspectionDTO,
  InspectionFilter
} from '../types/inspection';
import { PaginationParams, PaginatedResponse } from '../types/common';

export class InspectionRepository extends BaseRepository<Inspection, CreateInspectionDTO, any> {
  constructor() {
    super('incoming_inspections');
  }

  /**
   * Generate unique inspection number
   * Format: INSP-YYYYMMDD-SEQ
   */
  generateInspectionNumber(date: string): string {
    const dateStr = date.replace(/-/g, '');
    const result = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM incoming_inspections WHERE inspection_date = ?`,
      [date]
    );
    const seq = String((result?.count || 0) + 1).padStart(3, '0');
    return `INSP-${dateStr}-${seq}`;
  }

  create(data: CreateInspectionDTO): Inspection {
    const inspectionNo = this.generateInspectionNumber(data.inspection_date);

    const columns = [
      'inspection_no', 'inspection_date', 'supplier_id', 'producer_id', 'material_id', 'po_no', 'surat_jalan_no',
      'pabrik_danone', 'product_code', 'kode_produksi', 'nama_produsen', 'negara_produsen', 'logo_halal', 'expedition_name', 'vehicle_no', 'vehicle_type', 'vehicle_cover_type',
      'driver_name', 'driver_phone', 'expired_date', 'no_seal', 'arrival_time',
      'unloading_start_time', 'unloading_end_time', 'total_items_received', 'total_items_received_text',
      'checker_id', 'checker_signature', 'driver_signature', 'warehouse_signature', 'supervisor_signature', 'status', 'notes', 'packaging_notes',
      'vehicle_clean', 'vehicle_no_odor', 'vehicle_closed', 'vehicle_on_time', 'vehicle_on_time_delivery',
      'item_not_wet', 'item_not_torn', 'item_not_dusty', 'item_closed_tight', 'item_no_haram',
      'pkg_condition', 'pkg_name_check', 'pkg_hazard_label', 'pkg_good', 'pkg_label_ok', 'packaging_unit', 'measure_unit',
      'material_type', 'warna', 'jumlah_sampling', 'tanggal_produksi', 'item_name',
      'surat_jalan_photo_url', 'ttb_photo_url', 'coa_photo_url'
    ];
    const values = [
      inspectionNo, data.inspection_date, data.supplier_id, data.producer_id || null, data.material_id || null, data.po_no || null, data.surat_jalan_no || null,
      data.pabrik_danone || null, data.product_code || null, data.kode_produksi || null, data.nama_produsen || null, data.negara_produsen || null, data.logo_halal || null,
      data.expedition_name || null, data.vehicle_no || null, data.vehicle_type || 'Fuso', data.vehicle_cover_type || 'Box',
      data.driver_name || null, data.driver_phone || null, data.expired_date || null, data.no_seal || null, data.arrival_time || null,
      data.unloading_start_time || null, data.unloading_end_time || null, data.total_items_received || null, data.total_items_received_text || null,
      data.checker_id, data.checker_signature || null, data.driver_signature || null, (data as any).warehouse_signature || null, data.supervisor_signature || null, data.status || 'pending', data.notes || null, data.packaging_notes || null,
      data.vehicle_clean ?? 1, data.vehicle_no_odor ?? 1, data.vehicle_closed ?? 1, data.vehicle_on_time ?? 1, data.vehicle_on_time_delivery ?? 1,
      data.item_not_wet ?? 1, data.item_not_torn ?? 1, data.item_not_dusty ?? 1, data.item_closed_tight ?? 1, data.item_no_haram ?? 1,
      data.pkg_condition || null, data.pkg_name_check || null, data.pkg_hazard_label || null, data.pkg_good ?? 1, data.pkg_label_ok ?? 1, (data as any).packaging_unit || 'BOX', data.measure_unit || 'KG',
      data.material_type || null, data.warna || null, data.jumlah_sampling || null, data.tanggal_produksi || null, data.item_name || null,
      (data as any).surat_jalan_photo_url || null, (data as any).ttb_photo_url || null, (data as any).coa_photo_url || null
    ];
    const result = this.execute(
      `INSERT INTO incoming_inspections (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    );

    const inspectionId = Number(result.lastInsertRowid);

    // Insert QC Params
    if (data.qc_params) {
      const q = data.qc_params;
      this.execute(
        `INSERT INTO inspection_qc_params (
          inspection_id, q_berat, q_joint, q_creasing, q_coa_panjang, q_coa_lebar, q_coa_tinggi,
          q_coa_tebal, q_coa_bct, q_coa_cobb, q_coa_bursting, q_coa_batch_lot,
          q_coa_color_chip, q_visual_sobek, q_visual_cetakan, q_visual_flutting,
          q_visual_packaging, q_visual_warna, q_visual_clarity, fs_mat_bersih,
          fs_mat_bau, fs_veh_bersih, fs_veh_bau, fs_veh_bak, fs_veh_segel,
          qc_score, fs_score, decision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inspectionId, q.q_berat ?? null, q.q_joint ?? null, q.q_creasing ?? null, q.q_coa_panjang ?? null, q.q_coa_lebar ?? null, q.q_coa_tinggi ?? null,
          q.q_coa_tebal ?? null, q.q_coa_bct ?? null, q.q_coa_cobb ?? null, q.q_coa_bursting ?? null, q.q_coa_batch_lot ?? null,
          q.q_coa_color_chip ?? null, q.q_visual_sobek ?? null, q.q_visual_cetakan ?? null, q.q_visual_flutting ?? null,
          q.q_visual_packaging ?? null, q.q_visual_warna ?? null, q.q_visual_clarity ?? null, q.fs_mat_bersih ?? null,
          q.fs_mat_bau ?? null, q.fs_veh_bersih ?? null, q.fs_veh_bau ?? null, q.fs_veh_bak ?? null, q.fs_veh_segel ?? null,
          q.qc_score ?? null, q.fs_score ?? null, q.decision || null
        ]
      );
    }

    // Helper: generate LOT code LOTYYMMDDNNN
    const dateForLot = data.inspection_date.replace(/-/g, ''); // YYYYMMDD
    const yymmdd = dateForLot.slice(2); // YYMMDD
    const getNextSeqForDate = (): number => {
      const row = this.queryOne<{ max_seq?: number }>(
        `SELECT MAX(CAST(substr(lot_code, 10, 3) AS INTEGER)) as max_seq
         FROM inspection_items
         WHERE lot_code LIKE ?`,
        [`LOT${yymmdd}%`]
      );
      return ((row?.max_seq || 0) + 1);
    };
    let rollingSeq = getNextSeqForDate();

    // Insert items
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const seq = String(rollingSeq++).padStart(3, '0');
        const lotCode = `LOT${yymmdd}${seq}`;
        this.execute(
          `INSERT INTO inspection_items (inspection_id, batch_no, batch_vendor, expired_date, palet_no, qty, weight_per_unit, scale_weight, is_ok, notes, lot_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [inspectionId, item.batch_no || null, item.batch_vendor || null, item.expired_date || null, item.palet_no || null, item.qty || null, item.weight_per_unit || 0, (item as any).scale_weight ?? null, item.is_ok ?? 1, item.notes || null, lotCode]
        );
      });
    }

    // Insert weights
    if (data.weights && data.weights.length > 0) {
      data.weights.forEach(w => {
        // Only insert if weight is provided or photo exists
        if (w.weight !== null && w.weight !== undefined) {
          this.execute(
            `INSERT INTO inspection_weights (inspection_id, batch_no, batch_vendor, weight, photo_url) VALUES (?, ?, ?, ?, ?)`,
            [inspectionId, w.batch_no || null, (w as any).batch_vendor || null, w.weight || 0, w.photo_url || null]
          );
        }
      });
    }

    // Insert attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(att => {
        this.execute(
          `INSERT INTO inspection_attachments (inspection_id, photo_url, description) VALUES (?, ?, ?)`,
          [inspectionId, att.photo_url, att.description || null]
        );
      });
    }

    return this.findById(inspectionId)!;
  }

  update(id: number, data: CreateInspectionDTO): Inspection | null {
    // 1. Update main record
    this.execute(
      `UPDATE incoming_inspections SET
        inspection_date = ?, supplier_id = ?, producer_id = ?, material_id = ?, po_no = ?, surat_jalan_no = ?,
        pabrik_danone = ?, product_code = ?, kode_produksi = ?, nama_produsen = ?, negara_produsen = ?, logo_halal = ?, expedition_name = ?, vehicle_no = ?, vehicle_type = ?, vehicle_cover_type = ?,
        driver_name = ?, driver_phone = ?, expired_date = ?, no_seal = ?, arrival_time = ?,
        unloading_start_time = ?, unloading_end_time = ?, total_items_received = ?, total_items_received_text = ?,
        status = ?, notes = ?, packaging_notes = ?,
        vehicle_clean = ?, vehicle_no_odor = ?, vehicle_closed = ?, vehicle_on_time = ?, vehicle_on_time_delivery = ?,
        item_not_wet = ?, item_not_torn = ?, item_not_dusty = ?, item_closed_tight = ?, item_no_haram = ?,
        pkg_condition = ?, pkg_name_check = ?, pkg_hazard_label = ?, pkg_good = ?, pkg_label_ok = ?, packaging_unit = ?, measure_unit = ?,
        material_type = ?, warna = ?, jumlah_sampling = ?, tanggal_produksi = ?, item_name = ?,
        surat_jalan_photo_url = ?, ttb_photo_url = ?, coa_photo_url = ?,
        checker_id = ?, checker_signature = ?, driver_signature = ?, warehouse_signature = ?, supervisor_signature = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        data.inspection_date, data.supplier_id, data.producer_id || null, data.material_id || null, data.po_no || null, data.surat_jalan_no || null,
        data.pabrik_danone || null, data.product_code || null, data.kode_produksi || null, data.nama_produsen || null, data.negara_produsen || null, data.logo_halal || null,
        data.expedition_name || null, data.vehicle_no || null, data.vehicle_type || 'Fuso', data.vehicle_cover_type || 'Box',
        data.driver_name || null, data.driver_phone || null, data.expired_date || null, data.no_seal || null, data.arrival_time || null,
        data.unloading_start_time || null, data.unloading_end_time || null, data.total_items_received || null, data.total_items_received_text || null,
        data.status || 'pending', data.notes || null, data.packaging_notes || null,
        data.vehicle_clean ?? 1, data.vehicle_no_odor ?? 1, data.vehicle_closed ?? 1, data.vehicle_on_time ?? 1, data.vehicle_on_time_delivery ?? 1,
        data.item_not_wet ?? 1, data.item_not_torn ?? 1, data.item_not_dusty ?? 1, data.item_closed_tight ?? 1, data.item_no_haram ?? 1,
        data.pkg_condition || null, data.pkg_name_check || null, data.pkg_hazard_label || null, data.pkg_good ?? 1, data.pkg_label_ok ?? 1, (data as any).packaging_unit || 'BOX', data.measure_unit || 'KG',
        data.material_type || null, data.warna || null, data.jumlah_sampling || null, data.tanggal_produksi || null, data.item_name || null,
        (data as any).surat_jalan_photo_url || null, (data as any).ttb_photo_url || null, (data as any).coa_photo_url || null,
        data.checker_id, data.checker_signature || null, data.driver_signature || null, (data as any).warehouse_signature || null, data.supervisor_signature || null,
        id
      ]
    );

    // 2. Update QC Params
    if (data.qc_params) {
      const q = data.qc_params;
      this.execute(
        `UPDATE inspection_qc_params SET
          q_berat = ?, q_joint = ?, q_creasing = ?, q_coa_panjang = ?, q_coa_lebar = ?, q_coa_tinggi = ?,
          q_coa_tebal = ?, q_coa_bct = ?, q_coa_cobb = ?, q_coa_bursting = ?, q_coa_batch_lot = ?,
          q_coa_color_chip = ?, q_visual_sobek = ?, q_visual_cetakan = ?, q_visual_flutting = ?,
          q_visual_packaging = ?, q_visual_warna = ?, q_visual_clarity = ?, fs_mat_bersih = ?,
          fs_mat_bau = ?, fs_veh_bersih = ?, fs_veh_bau = ?, fs_veh_bak = ?, fs_veh_segel = ?,
          qc_score = ?, fs_score = ?, decision = ?
        WHERE inspection_id = ?`,
        [
          q.q_berat ?? null, q.q_joint ?? null, q.q_creasing ?? null, q.q_coa_panjang ?? null, q.q_coa_lebar ?? null, q.q_coa_tinggi ?? null,
          q.q_coa_tebal ?? null, q.q_coa_bct ?? null, q.q_coa_cobb ?? null, q.q_coa_bursting ?? null, q.q_coa_batch_lot ?? null,
          q.q_coa_color_chip ?? null, q.q_visual_sobek ?? null, q.q_visual_cetakan ?? null, q.q_visual_flutting ?? null,
          q.q_visual_packaging ?? null, q.q_visual_warna ?? null, q.q_visual_clarity ?? null, q.fs_mat_bersih ?? null,
          q.fs_mat_bau ?? null, q.fs_veh_bersih ?? null, q.fs_veh_bau ?? null, q.fs_veh_bak ?? null, q.fs_veh_segel ?? null,
          q.qc_score ?? null, q.fs_score ?? null, q.decision || null,
          id
        ]
      );
    }

    // 3. Update items (Preserve existing lot_code order; generate for new)
    if (data.items) {
      const existing = this.query<{ lot_code: string | null }>(
        `SELECT lot_code FROM inspection_items WHERE inspection_id = ? ORDER BY id ASC`, [id]
      ).map(r => r.lot_code);

      this.execute(`DELETE FROM inspection_items WHERE inspection_id = ?`, [id]);

      const dateForLot = data.inspection_date.replace(/-/g, '');
      const yymmdd = dateForLot.slice(2);
      const getNextSeqForDate = (): number => {
        const row = this.queryOne<{ max_seq?: number }>(
          `SELECT MAX(CAST(substr(lot_code, 10, 3) AS INTEGER)) as max_seq
           FROM inspection_items
           WHERE lot_code LIKE ?`,
          [`LOT${yymmdd}%`]
        );
        return ((row?.max_seq || 0) + 1);
      };
      let rollingSeq = getNextSeqForDate();

      data.items.forEach((item, idx) => {
        const preserved = existing[idx] || null;
        const lotCode = preserved || `LOT${yymmdd}${String(rollingSeq++).padStart(3, '0')}`;
        this.execute(
          `INSERT INTO inspection_items (inspection_id, batch_no, batch_vendor, expired_date, palet_no, qty, weight_per_unit, scale_weight, is_ok, notes, lot_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, item.batch_no || null, item.batch_vendor || null, item.expired_date || null, item.palet_no || null, item.qty || null, item.weight_per_unit || 0, (item as any).scale_weight ?? null, item.is_ok ?? 1, item.notes || null, lotCode]
        );
      });
    }

    // 4. Update weights (Simple approach: delete and re-insert)
    if (data.weights) {
      this.execute(`DELETE FROM inspection_weights WHERE inspection_id = ?`, [id]);
      data.weights.forEach(w => {
        // Only insert if weight is provided or photo exists
        if (w.weight !== null && w.weight !== undefined) {
          this.execute(
            `INSERT INTO inspection_weights (inspection_id, batch_no, batch_vendor, weight, photo_url) VALUES (?, ?, ?, ?, ?)`,
            [id, w.batch_no || null, (w as any).batch_vendor || null, w.weight || 0, w.photo_url || null]
          );
        }
      });
    }

    // Insert attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(att => {
        this.execute(
          `INSERT INTO inspection_attachments (inspection_id, photo_url, description) VALUES (?, ?, ?)`,
          [id, att.photo_url, att.description || null]
        );
      });
    }

    return this.findById(id);
  }

  delete(id: number): boolean {
    // Delete related records first (if foreign keys are not ON DELETE CASCADE)
    this.execute(`DELETE FROM inspection_qc_params WHERE inspection_id = ?`, [id]);
    this.execute(`DELETE FROM inspection_items WHERE inspection_id = ?`, [id]);
    this.execute(`DELETE FROM inspection_weights WHERE inspection_id = ?`, [id]);
    this.execute(`DELETE FROM inspection_attachments WHERE inspection_id = ?`, [id]); // Added

    // Delete main record
    const result = this.execute(`DELETE FROM incoming_inspections WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  findWithDetails(id: number): InspectionWithDetails | undefined {
    const header = this.queryOne<InspectionWithDetails>(
      `SELECT i.*, s.name as supplier_name, s.code as supplier_code,
       p.name as producer_name, p.code as producer_code,
       m.name as material_name, m.code as material_code,
       u.name as checker_name,
       (SELECT COALESCE(SUM(qty * COALESCE(weight_per_unit, 0)), 0) FROM inspection_items ii WHERE ii.inspection_id = i.id) as total_arrival_qty,
       (SELECT COALESCE(SUM(qty * COALESCE(weight_per_unit, 0)), 0) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.is_ok = 1) as total_received_qty
       FROM incoming_inspections i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       LEFT JOIN producers p ON i.producer_id = p.id
       LEFT JOIN materials m ON i.material_id = m.id
       LEFT JOIN users u ON i.checker_id = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!header) return undefined;

    header.items = this.query<InspectionItem>(
      `SELECT * FROM inspection_items WHERE inspection_id = ?`,
      [id]
    );

    header.weights = this.query<InspectionWeight>(
      `SELECT * FROM inspection_weights WHERE inspection_id = ?`,
      [id]
    );

    header.attachments = this.query<InspectionAttachment>(
      `SELECT * FROM inspection_attachments WHERE inspection_id = ?`,
      [id]
    );

    header.qc_params = this.queryOne(
      `SELECT * FROM inspection_qc_params WHERE inspection_id = ?`,
      [id]
    );

    return header;
  }

  findAllWithFilter(
    filter?: InspectionFilter,
    pagination?: PaginationParams
  ): InspectionWithDetails[] | PaginatedResponse<InspectionWithDetails> {
    let sql = `
      SELECT i.*, s.name as supplier_name, s.code as supplier_code,
      p.name as producer_name, p.code as producer_code,
      m.name as material_name, m.code as material_code,
      u.name as checker_name,
      (SELECT COALESCE(SUM(qty * COALESCE(weight_per_unit, 0)), 0) FROM inspection_items ii WHERE ii.inspection_id = i.id) as total_arrival_qty,
      (SELECT COALESCE(SUM(qty * COALESCE(weight_per_unit, 0)), 0) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.is_ok = 1) as total_received_qty,
      (SELECT GROUP_CONCAT(batch_no || ':' || COALESCE(qty, 0), ', ') FROM inspection_items ii WHERE ii.inspection_id = i.id AND batch_no IS NOT NULL AND batch_no != '') as batch_numbers
      FROM incoming_inspections i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN producers p ON i.producer_id = p.id
      LEFT JOIN materials m ON i.material_id = m.id
      LEFT JOIN users u ON i.checker_id = u.id
      WHERE 1=1
    `;
    let countSql = `SELECT COUNT(*) as count FROM incoming_inspections i WHERE 1=1`;
    const params: any[] = [];

    if (filter?.supplier_id) {
      sql += ` AND i.supplier_id = ?`;
      countSql += ` AND i.supplier_id = ?`;
      params.push(filter.supplier_id);
    }

    if (filter?.status) {
      sql += ` AND i.status = ?`;
      countSql += ` AND i.status = ?`;
      params.push(filter.status);
    }

    if (filter?.date_from) {
      sql += ` AND i.inspection_date >= ?`;
      countSql += ` AND i.inspection_date >= ?`;
      params.push(filter.date_from);
    }

    if (filter?.date_to) {
      sql += ` AND i.inspection_date <= ?`;
      countSql += ` AND i.inspection_date <= ?`;
      params.push(filter.date_to);
    }

    if (filter?.search) {
      const searchTerm = `%${filter.search}%`;
      // Expanded search to include Batch No from items table and Producer name
      sql += ` AND (
        i.inspection_no LIKE ?
        OR i.po_no LIKE ?
        OR s.name LIKE ?
        OR p.name LIKE ?
        OR m.name LIKE ?
        OR EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id AND (ii.batch_no LIKE ? OR ii.lot_code LIKE ?))
      )`;
      countSql += ` AND (
        i.inspection_no LIKE ?
        OR i.po_no LIKE ?
        OR s.name LIKE ?
        OR p.name LIKE ?
        OR m.name LIKE ?
        OR EXISTS (SELECT 1 FROM inspection_items ii WHERE ii.inspection_id = i.id AND (ii.batch_no LIKE ? OR ii.lot_code LIKE ?))
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY i.inspection_date DESC, i.created_at DESC`;

    if (pagination) {
      const countResult = this.queryOne<{ count: number }>(countSql, params);
      const total = countResult?.count || 0;

      sql += ` LIMIT ? OFFSET ?`;
      const data = this.query<InspectionWithDetails>(sql, [...params, pagination.limit, pagination.offset]);

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }

    return this.query<InspectionWithDetails>(sql, params);
  }
}

export const inspectionRepository = new InspectionRepository();
export default inspectionRepository;
