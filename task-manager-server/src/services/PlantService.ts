import { BaseService, ValidationError } from './BaseService';
import { plantRepository, PlantRepository } from '../models/PlantRepository';
import { Plant, CreatePlantDTO } from '../types/inspection';

export class PlantService extends BaseService<Plant, CreatePlantDTO, Partial<CreatePlantDTO>> {
  private repo: PlantRepository;
  constructor() {
    super(plantRepository);
    this.repo = plantRepository;
  }

  search(query: string): Plant[] {
    if (!query || query.length < 2) return [];
    return this.repo.search(query);
  }

  create(data: CreatePlantDTO, userId?: number): Plant {
    if (!data.name) throw new ValidationError('Plant name is required', [{ field: 'name', message: 'Name is required' }]);
    if (!data.code || !data.code.trim()) {
      data.code = this.generateUniqueCode('PLT', 3);
    } else {
      data.code = data.code.toUpperCase().trim();
    }
    const existing = this.repo.findOneBy('code', data.code);
    if (existing) throw new ValidationError('Plant code already exists', [{ field: 'code', message: 'Plant code already exists' }]);
    return super.create(data, userId);
  }

  private generateUniqueCode(prefix: string, width: number): string {
    const like = `${prefix}%`;
    let idx = this.repo.count('code LIKE ?', [like]) + 1;
    for (let i = 0; i < 10000; i++) {
      const code = `${prefix}${String(idx).padStart(width, '0')}`;
      if (!this.repo.findOneBy('code', code)) return code;
      idx++;
    }
    return `${prefix}${Date.now()}`;
  }
}

export const plantService = new PlantService();
export default plantService;
