/**
 * Producer Repository
 */

import { BaseRepository } from './BaseRepository';
import { Producer, CreateProducerDTO, UpdateProducerDTO } from '../types/inspection';

export class ProducerRepository extends BaseRepository<Producer, CreateProducerDTO, UpdateProducerDTO> {
  constructor() {
    super('producers');
  }

  create(data: CreateProducerDTO): Producer {
    const result = this.execute(
      `INSERT INTO producers (code, name, email, address, contact_person, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.code,
        data.name,
        data.email || null,
        data.address || null,
        data.contact_person || null,
        data.phone || null
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, data: UpdateProducerDTO): Producer | null {
    const fields: (keyof UpdateProducerDTO)[] = [
      'code',
      'name',
      'email',
      'address',
      'contact_person',
      'phone',
      'is_active'
    ];

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    if (updates.length === 1) {
      return this.findById(id) || null;
    }

    params.push(id);
    this.execute(
      `UPDATE producers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id) || null;
  }

  search(query: string): Producer[] {
    const searchTerm = `%${query}%`;
    return this.query(
      `SELECT * FROM producers
       WHERE (code LIKE ? OR name LIKE ?) AND is_active = 1
       ORDER BY name ASC LIMIT 20`,
      [searchTerm, searchTerm]
    );
  }
}

export const producerRepository = new ProducerRepository();
export default producerRepository;
