/**
 * Material Repository
 */

import { BaseRepository } from './BaseRepository';
import { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../types/inspection';

export class MaterialRepository extends BaseRepository<Material, CreateMaterialDTO, UpdateMaterialDTO> {
  constructor() {
    super('materials');
  }

  create(data: CreateMaterialDTO): Material {
    const result = this.execute(
      `INSERT INTO materials (code, name, description)
       VALUES (?, ?, ?)`,
      [
        data.code,
        data.name,
        data.description || null
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, data: UpdateMaterialDTO): Material | null {
    const fields: (keyof UpdateMaterialDTO)[] = [
      'code',
      'name',
      'description',
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
      `UPDATE materials SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id) || null;
  }

  search(query: string): Material[] {
    const searchTerm = `%${query}%`;
    return this.query(
      `SELECT * FROM materials
       WHERE (code LIKE ? OR name LIKE ?) AND is_active = 1
       ORDER BY name ASC LIMIT 20`,
      [searchTerm, searchTerm]
    );
  }
}

export const materialRepository = new MaterialRepository();
export default materialRepository;
