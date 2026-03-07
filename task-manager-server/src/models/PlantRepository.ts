import { BaseRepository } from './BaseRepository';
import { Plant, CreatePlantDTO } from '../types/inspection';

export class PlantRepository extends BaseRepository<Plant, CreatePlantDTO, Partial<CreatePlantDTO>> {
  constructor() {
    super('plants');
  }

  create(data: CreatePlantDTO): Plant {
    const result = this.execute(
      `INSERT INTO plants (code, name, address, contact_person, phone) VALUES (?, ?, ?, ?, ?)`,
      [data.code || null, data.name, data.address || null, data.contact_person || null, data.phone || null]
    );
    return this.findById(Number(result.lastInsertRowid))!;
  }

  update(id: number, data: Partial<CreatePlantDTO>): Plant | null {
    const fields: (keyof CreatePlantDTO)[] = ['code','name','address','contact_person','phone'];
    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];
    fields.forEach((f) => {
      if (data[f] !== undefined) { updates.push(`${f} = ?`); params.push(data[f]); }
    });
    if (updates.length === 1) return this.findById(id) || null;
    params.push(id);
    this.execute(`UPDATE plants SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(id) || null;
  }

  search(q: string): Plant[] {
    const s = `%${q}%`;
    return this.query<Plant>(`SELECT * FROM plants WHERE is_active = 1 AND (code LIKE ? OR name LIKE ?) ORDER BY name LIMIT 20`, [s, s]);
  }
}

export const plantRepository = new PlantRepository();
export default plantRepository;
