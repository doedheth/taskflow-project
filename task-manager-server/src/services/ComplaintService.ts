import { Complaint, ComplaintStatus } from '../types/complaint';
import { complaintRepository, ComplaintRepository } from '../models/ComplaintRepository';
import { prepare, run } from '../database/db';

export class ComplaintService {
  private repo: ComplaintRepository;

  constructor(repo: ComplaintRepository = complaintRepository) {
    this.repo = repo;
  }

  create(data: Partial<Complaint>): Complaint {
    // Validate return case first to prevent invalid rows
    if (data.inspection_id && data.batch_no && typeof data.qty === 'number' && data.qty > 0) {
      const item = prepare('SELECT id, qty FROM inspection_items WHERE inspection_id = ? AND batch_no = ? LIMIT 1').get(
        data.inspection_id,
        data.batch_no
      ) as any;
      if (!item) {
        throw new Error('Batch tidak ditemukan untuk inspeksi ini');
      }
      if (typeof item.qty !== 'number' || data.qty > item.qty) {
        throw new Error('Jumlah retur melebihi jumlah batch yang tersedia');
      }
    }

    const saved = this.repo.create(data);

    // Auto-adjust received qty if batch and qty provided (return)
    try {
      if (data.inspection_id && data.batch_no && typeof data.qty === 'number' && data.qty > 0) {
        const item = prepare('SELECT id, qty FROM inspection_items WHERE inspection_id = ? AND batch_no = ? LIMIT 1').get(
          data.inspection_id,
          data.batch_no
        ) as any;
        if (item && typeof item.qty === 'number') {
          const newQty = Math.max(0, item.qty - data.qty);
          run('UPDATE inspection_items SET qty = ? WHERE id = ?', [newQty, item.id]);
        }

        const main = prepare('SELECT total_items_received FROM incoming_inspections WHERE id = ?').get(
          data.inspection_id
        ) as any;
        if (main && typeof main.total_items_received === 'number') {
          const newTotal = Math.max(0, main.total_items_received - data.qty);
          run('UPDATE incoming_inspections SET total_items_received = ? WHERE id = ?', [newTotal, data.inspection_id]);
        }
      }
    } catch (e) {
      console.warn('ComplaintService auto-adjust failed:', e);
    }
    return saved;
  }
  
  update(id: number, data: Partial<Complaint>): Complaint | null {
    return this.repo.update(id, data);
  }

  findByInspection(inspection_id: number): Complaint[] {
    return this.repo.findByInspectionId(inspection_id);
  }

  findById(id: number): Complaint | null {
    return this.repo.findById(id);
  }
  
  delete(id: number): boolean {
    return this.repo.delete(id);
  }
}

export const complaintService = new ComplaintService();
