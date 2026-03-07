/**
 * Material Service
 */

import { BaseService, ValidationError } from './BaseService';
import { materialRepository, MaterialRepository } from '../models/MaterialRepository';
import { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../types/inspection';

export class MaterialService extends BaseService<Material, CreateMaterialDTO, UpdateMaterialDTO> {
  private materialRepository: MaterialRepository;

  constructor() {
    super(materialRepository);
    this.materialRepository = materialRepository;
  }

  search(query: string): Material[] {
    if (!query || query.length < 2) return [];
    return this.materialRepository.search(query);
  }

  create(data: CreateMaterialDTO, userId?: number): Material {
    // Transform name to Title Case (Capitalize Each Word)
    // Example: "plastic bag" -> "Plastic Bag"
    if (data.name) {
      data.name = data.name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    if (!data.code || !data.code.trim()) {
      // Use 'MAT-' as prefix to match UI placeholder
      data.code = this.generateUniqueCode('MAT-', 3);
    } else {
      data.code = data.code.toUpperCase().trim();
    }

    // Ensure uniqueness if provided/generated
    const existing = this.materialRepository.findOneBy('code', data.code);
    if (existing) {
      throw new ValidationError('Material code already exists', [{ field: 'code', message: 'Material code already exists' }]);
    }

    return super.create(data, userId);
  }

  update(id: number, data: UpdateMaterialDTO, userId?: number): Material | null {
    // Transform name to Title Case (Capitalize Each Word)
    if (data.name) {
      data.name = data.name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return super.update(id, data, userId);
  }

  protected validateCreate(data: CreateMaterialDTO): void {
    if (!data.name) {
      throw new ValidationError('Material name is required', [{ field: 'name', message: 'Name is required' }]);
    }
  }

  private generateUniqueCode(prefix: string, width: number): string {
    const like = `${prefix}%`;
    let idx = this.materialRepository.count('code LIKE ?', [like]) + 1;
    for (let i = 0; i < 10000; i++) {
      const code = `${prefix}${String(idx).padStart(width, '0')}`;
      if (!this.materialRepository.findOneBy('code', code)) return code;
      idx++;
    }
    return `${prefix}${Date.now()}`;
  }
}

export const materialService = new MaterialService();
export default materialService;
