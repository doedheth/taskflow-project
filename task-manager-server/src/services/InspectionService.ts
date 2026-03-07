/**
 * Inspection Service
 */

import { BaseService, ValidationError, NotFoundError } from './BaseService';
import { inspectionRepository, InspectionRepository } from '../models/InspectionRepository';
import {
  Inspection,
  InspectionWithDetails,
  CreateInspectionDTO,
  InspectionFilter
} from '../types/inspection';
import { PaginationParams, PaginatedResponse } from '../types/common';

export class InspectionService extends BaseService<Inspection, CreateInspectionDTO, any> {
  private inspectionRepository: InspectionRepository;

  constructor() {
    super(inspectionRepository);
    this.inspectionRepository = inspectionRepository;
  }

  getAllWithFilter(
    filter?: InspectionFilter,
    pagination?: PaginationParams
  ): InspectionWithDetails[] | PaginatedResponse<InspectionWithDetails> {
    return this.inspectionRepository.findAllWithFilter(filter, pagination);
  }

  getWithDetails(id: number): InspectionWithDetails | undefined {
    return this.inspectionRepository.findWithDetails(id);
  }

  create(data: CreateInspectionDTO): Inspection {
    this.validateCreate(data);
    return this.inspectionRepository.create(data);
  }

  update(id: number, data: CreateInspectionDTO): Inspection {
    this.validateCreate(data); // Reuse validation for update
    const result = this.inspectionRepository.update(id, data);
    if (!result) {
      throw new NotFoundError('Inspection not found');
    }
    return result;
  }

  delete(id: number): boolean {
    const result = this.inspectionRepository.delete(id);
    if (!result) {
      throw new NotFoundError('Inspection not found');
    }
    return result;
  }

  protected validateCreate(data: CreateInspectionDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.inspection_date) {
      errors.push({ field: 'inspection_date', message: 'Inspection date is required' });
    }
    if (!data.supplier_id) {
      errors.push({ field: 'supplier_id', message: 'Supplier is required' });
    }
    if (!data.checker_id) {
      errors.push({ field: 'checker_id', message: 'Checker is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }
}

export const inspectionService = new InspectionService();
export default inspectionService;
