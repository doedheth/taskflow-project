
import { Complaint } from '../types/complaint';
import { BaseRepository } from './BaseRepository';
import { prepare, run } from '../database/db';


export class ComplaintRepository extends BaseRepository<Complaint, Partial<Complaint>, any> {
  constructor() {
    super('inspection_complaints');
  }

  create(data: Partial<Complaint>): Complaint {
    // Separate photos from complaint data
    const { photos, ...complaintData } = data as any;

    // Compose keys/values
    const keys = Object.keys(complaintData).join(', ');
    const placeholders = Object.keys(complaintData).map(() => '?').join(', ');
    const values = Object.values(complaintData);
    this.execute(`INSERT INTO inspection_complaints (${keys}) VALUES (${placeholders})`, values);
    const last = this.queryOne<Complaint>(`SELECT * FROM inspection_complaints ORDER BY id DESC LIMIT 1`);
    if (!last) throw new Error('Failed to insert complaint');

    // Insert photos if provided
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        run(
          'INSERT INTO complaint_photos (complaint_id, photo_url, description) VALUES (?, ?, ?)',
          [last.id, photo.photo_url, photo.description || '']
        );
      }
    }

    return this.findById(last.id)!;
  }

  update(id: number, data: Partial<Complaint>): Complaint | null {
    // Separate photos from complaint data
    const { photos, ...complaintData } = data as any;

    // Update complaint data if any
    if (Object.keys(complaintData).length > 0) {
      const fields = Object.keys(complaintData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(complaintData), id];
      this.execute(`UPDATE inspection_complaints SET ${fields} WHERE id = ?`, values);
    }

    // Handle photos replacement if provided
    if (photos !== undefined) {
      // Delete existing photos
      run('DELETE FROM complaint_photos WHERE complaint_id = ?', [id]);

      // Insert new photos if any
      if (Array.isArray(photos) && photos.length > 0) {
        for (const photo of photos) {
          run(
            'INSERT INTO complaint_photos (complaint_id, photo_url, description) VALUES (?, ?, ?)',
            [id, photo.photo_url, photo.description || '']
          );
        }
      }
    }

    return this.findById(id) || null;
  }

  findById(id: number): Complaint | null {
    const complaint = super.findById(id);
    if (!complaint) return null;

    // Fetch photos
    const photos = prepare('SELECT photo_url, description FROM complaint_photos WHERE complaint_id = ?')
      .all(id) as any[];

    return { ...complaint, photos };
  }

  findByInspectionId(inspection_id: number): Complaint[] {
    const complaints = this.query<Complaint>('SELECT * FROM inspection_complaints WHERE inspection_id = ?', [inspection_id]);

    // Fetch photos for each complaint
    return complaints.map(complaint => {
      const photos = prepare('SELECT photo_url, description FROM complaint_photos WHERE complaint_id = ?')
        .all(complaint.id) as any[];
      return { ...complaint, photos };
    });
  }
}

export const complaintRepository = new ComplaintRepository();
