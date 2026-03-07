/**
 * Supplier Repository
 */

import { BaseRepository } from './BaseRepository';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../types/inspection';

export class SupplierRepository extends BaseRepository<Supplier, CreateSupplierDTO, UpdateSupplierDTO> {
  constructor() {
    super('suppliers');
  }

  create(data: CreateSupplierDTO): Supplier {
    const result = this.execute(
      `INSERT INTO suppliers (code, name, email, address, contact_person, phone)
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

  update(id: number, data: UpdateSupplierDTO): Supplier | null {
    const fields: (keyof UpdateSupplierDTO)[] = [
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
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id) || null;
  }

  search(query: string): Supplier[] {
    const searchTerm = `%${query}%`;
    return this.query(
      `SELECT * FROM suppliers
       WHERE (code LIKE ? OR name LIKE ?) AND is_active = 1
       ORDER BY name ASC LIMIT 20`,
      [searchTerm, searchTerm]
    );
  }
}

export const supplierRepository = new SupplierRepository();
export default supplierRepository;
