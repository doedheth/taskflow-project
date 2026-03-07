/**
 * SPK Service
 *
 * Business logic layer for SPK (Surat Perintah Kerja) Production Order System
 */

import {
  BaseService,
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from './BaseService';
import { spkRepository, SPKRepository } from '../models/SPKRepository';
import {
  SPKHeader,
  SPKHeaderWithDetails,
  SPKWithItems,
  SPKFilter,
  CreateSPKHeaderDTO,
  UpdateSPKHeaderDTO,
  SPKStatus,
  SPK_STATUS_TRANSITIONS,
  SPKDashboardSummary,
  DuplicateSPKDTO,
} from '../types/spk';
import { PaginationParams, PaginatedResponse, AuthenticatedUser } from '../types/common';

export class SPKService extends BaseService<SPKHeader, CreateSPKHeaderDTO, UpdateSPKHeaderDTO> {
  private spkRepository: SPKRepository;

  constructor() {
    super(spkRepository);
    this.spkRepository = spkRepository;
  }

  /**
   * Get all SPKs with filters and pagination
   */
  getAllWithFilter(
    filter?: SPKFilter,
    pagination?: PaginationParams
  ): SPKHeaderWithDetails[] | PaginatedResponse<SPKHeaderWithDetails> {
    return this.spkRepository.findAllWithFilter(filter, pagination);
  }

  /**
   * Get SPK with all details
   */
  getWithDetails(id: number): SPKHeaderWithDetails | undefined {
    return this.spkRepository.findWithDetails(id);
  }

  /**
   * Get SPK with line items
   */
  getWithItems(id: number): SPKWithItems | undefined {
    return this.spkRepository.findWithItems(id);
  }

  /**
   * Get dashboard summary
   */
  getDashboard(date?: string): SPKDashboardSummary {
    return this.spkRepository.getDashboardSummary(date);
  }

  /**
   * Create SPK with validation
   */
  create(data: CreateSPKHeaderDTO, userId?: number): SPKHeader {
    this.validateCreate(data);
    return this.spkRepository.create(data, userId);
  }

  /**
   * Update SPK (only draft status)
   */
  update(id: number, data: UpdateSPKHeaderDTO, userId?: number): SPKHeader | null {
    this.validateUpdate(id, data);
    return this.spkRepository.update(id, data);
  }

  /**
   * Submit SPK for approval (draft → pending)
   */
  submit(id: number, userId: number): SPKHeader | null {
    const spk = this.spkRepository.findWithItems(id);
    if (!spk) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    this.validateStatusTransition(spk.status, 'pending');

    // Validate SPK has at least one line item
    if (!spk.line_items || spk.line_items.length === 0) {
      throw new ValidationError('SPK must have at least one line item', [
        { field: 'line_items', message: 'At least one line item is required' },
      ]);
    }

    return this.spkRepository.updateStatus(id, 'pending', userId);
  }

  /**
   * Approve SPK (pending → approved) - Manager only
   */
  approve(id: number, user: AuthenticatedUser): SPKHeader | null {
    this.validateApprovalPermission(user);

    const spk = this.spkRepository.findById(id);
    if (!spk) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    this.validateStatusTransition(spk.status, 'approved');

    // Update status
    const result = this.spkRepository.updateStatus(id, 'approved', user.id);

    // Auto-link to production schedule
    this.spkRepository.linkToProductionSchedule(id);

    return result;
  }

  /**
   * Reject SPK (pending → rejected) - Manager only
   */
  reject(id: number, user: AuthenticatedUser, rejectionReason: string): SPKHeader | null {
    this.validateApprovalPermission(user);

    const spk = this.spkRepository.findById(id);
    if (!spk) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    this.validateStatusTransition(spk.status, 'rejected');

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new ValidationError('Rejection reason is required', [
        { field: 'rejection_reason', message: 'Rejection reason is required' },
      ]);
    }

    return this.spkRepository.updateStatus(id, 'rejected', user.id, { rejection_reason: rejectionReason });
  }

  /**
   * Cancel SPK
   */
  cancel(id: number, userId: number): SPKHeader | null {
    const spk = this.spkRepository.findById(id);
    if (!spk) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    this.validateStatusTransition(spk.status, 'cancelled');

    return this.spkRepository.updateStatus(id, 'cancelled', userId);
  }

  /**
   * Revert rejected SPK to draft for editing
   */
  revertToDraft(id: number, userId: number): SPKHeader | null {
    const spk = this.spkRepository.findById(id);
    if (!spk) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    this.validateStatusTransition(spk.status, 'draft');

    return this.spkRepository.updateStatus(id, 'draft', userId);
  }

  /**
   * Duplicate SPK to new date
   */
  duplicate(id: number, data: DuplicateSPKDTO, userId: number): SPKHeader {
    const source = this.spkRepository.findById(id);
    if (!source) {
      throw new NotFoundError(`Source SPK with ID ${id} not found`);
    }

    if (!data.new_production_date) {
      throw new ValidationError('New production date is required', [
        { field: 'new_production_date', message: 'New production date is required' },
      ]);
    }

    return this.spkRepository.duplicate(id, data.new_production_date, data.new_asset_id, userId);
  }

  /**
   * Get SPKs for specific user (for PPIC who can only see their own)
   */
  getByUser(
    userId: number,
    filter?: Omit<SPKFilter, 'created_by'>,
    pagination?: PaginationParams
  ): SPKHeaderWithDetails[] | PaginatedResponse<SPKHeaderWithDetails> {
    return this.spkRepository.findAllWithFilter(
      { ...filter, created_by: userId },
      pagination
    );
  }

  /**
   * Get SPKs linked to a production schedule
   */
  getByProductionSchedule(productionScheduleId: number): SPKHeaderWithDetails[] {
    return this.spkRepository.findByProductionScheduleId(productionScheduleId);
  }

  /**
   * Validate create data
   */
  protected validateCreate(data: CreateSPKHeaderDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.asset_id) {
      errors.push({ field: 'asset_id', message: 'Asset is required' });
    }

    if (!data.production_date) {
      errors.push({ field: 'production_date', message: 'Production date is required' });
    }

    if (!data.line_items || data.line_items.length === 0) {
      errors.push({ field: 'line_items', message: 'At least one line item is required' });
    }

    // Validate line items
    if (data.line_items) {
      data.line_items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push({ field: `line_items[${index}].product_id`, message: 'Product is required' });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({ field: `line_items[${index}].quantity`, message: 'Quantity must be positive' });
        }
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validate update data
   */
  protected validateUpdate(id: number, data: UpdateSPKHeaderDTO): void {
    const existing = this.spkRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`SPK with ID ${id} not found`);
    }

    if (existing.status !== 'draft') {
      throw new ValidationError('Cannot edit SPK that is not in draft status', [
        { field: 'status', message: `Current status is "${existing.status}"` },
      ]);
    }

    // Validate line items if provided
    if (data.line_items) {
      const errors: Array<{ field: string; message: string }> = [];
      data.line_items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push({ field: `line_items[${index}].product_id`, message: 'Product is required' });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({ field: `line_items[${index}].quantity`, message: 'Quantity must be positive' });
        }
      });

      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: SPKStatus, newStatus: SPKStatus): void {
    const allowedTransitions = SPK_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from "${currentStatus}" to "${newStatus}"`,
        [{ field: 'status', message: `Invalid transition from "${currentStatus}" to "${newStatus}"` }]
      );
    }
  }

  /**
   * Validate approval permission (Manager or Admin only)
   */
  private validateApprovalPermission(user: AuthenticatedUser): void {
    if (!['admin', 'manager'].includes(user.role)) {
      throw new ForbiddenError('Only Manager or Admin can approve/reject SPK');
    }
  }
}

// Export singleton instance
export const spkService = new SPKService();
export default spkService;
