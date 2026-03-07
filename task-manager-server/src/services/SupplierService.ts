/**
 * Supplier Service
 */

import { BaseService, ValidationError } from './BaseService';
import { supplierRepository, SupplierRepository } from '../models/SupplierRepository';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../types/inspection';

export class SupplierService extends BaseService<Supplier, CreateSupplierDTO, UpdateSupplierDTO> {
  private supplierRepository: SupplierRepository;

  constructor() {
    super(supplierRepository);
    this.supplierRepository = supplierRepository;
  }

  search(query: string): Supplier[] {
    if (!query || query.length < 2) return [];
    return this.supplierRepository.search(query);
  }

  create(data: CreateSupplierDTO, userId?: number): Supplier {
    if (!data.name) {
      throw new ValidationError('Supplier name is required', [{ field: 'name', message: 'Name is required' }]);
    }
    if (!data.code || !data.code.trim()) {
      data.code = this.generateUniqueCode('SUP', 3);
    } else {
      data.code = data.code.toUpperCase().trim();
    }

    // Ensure uniqueness if user supplied a code
    const existing = this.supplierRepository.findOneBy('code', data.code);
    if (existing) {
      // If collision on user-provided code, raise an error
      throw new ValidationError('Supplier code already exists', [{ field: 'code', message: 'Supplier code already exists' }]);
    }

    return super.create(data, userId);
  }

  private generateUniqueCode(prefix: string, width: number): string {
    // Start from count+1 and iterate until a free code is found
    const like = `${prefix}%`;
    let idx = this.supplierRepository.count('code LIKE ?', [like]) + 1;
    // Safety cap to avoid infinite loop
    for (let i = 0; i < 10000; i++) {
      const code = `${prefix}${String(idx).padStart(width, '0')}`;
      if (!this.supplierRepository.findOneBy('code', code)) return code;
      idx++;
    }
    // Fallback
    return `${prefix}${Date.now()}`;
  }

  protected validateCreate(data: CreateSupplierDTO): void {
    // Validation moved into create(): require name, ensure unique when provided/generated
  }
}

export const supplierService = new SupplierService();
export default supplierService;
