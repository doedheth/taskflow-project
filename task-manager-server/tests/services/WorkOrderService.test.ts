/**
 * WorkOrderService Unit Tests
 */
/// <reference types="jest" />

import { WorkOrderService } from '../../services/WorkOrderService';
import { WorkOrderRepository } from '../../models/WorkOrderRepository';
import { NotFoundError, ValidationError } from '../../services/BaseService';

// Mock the repository
jest.mock('../../models/WorkOrderRepository');
jest.mock('../../database/db', () => ({
  default: {
    prepare: jest.fn().mockReturnValue({
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn()
    }),
    run: jest.fn()
  }
}));

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let mockRepository: jest.Mocked<WorkOrderRepository>;

  beforeEach(() => {
    mockRepository = new WorkOrderRepository() as jest.Mocked<WorkOrderRepository>;
    service = new WorkOrderService(mockRepository);
    jest.clearAllMocks();
  });

  describe('getByIdWithDetails', () => {
    it('should return work order when found', () => {
      const mockWorkOrder = {
        id: 1,
        wo_number: 'WO-2025-0001',
        title: 'Test WO',
        status: 'open',
        type: 'corrective',
        priority: 'high',
        asset_id: 1,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        assignees: []
      };

      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(mockWorkOrder);

      const result = service.getByIdWithDetails(1);

      expect(result).toEqual(mockWorkOrder);
      expect(mockRepository.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when work order not found', () => {
      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(undefined);

      expect(() => service.getByIdWithDetails(999)).toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should throw ValidationError when asset_id is missing', () => {
      const invalidData = {
        type: 'corrective' as const,
        priority: 'high' as const,
        title: 'Test WO',
        assignee_ids: [1]
      } as any;

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when assignee_ids is empty', () => {
      const invalidData = {
        asset_id: 1,
        type: 'corrective' as const,
        priority: 'high' as const,
        title: 'Test WO',
        assignee_ids: []
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when title is empty', () => {
      const invalidData = {
        asset_id: 1,
        type: 'corrective' as const,
        priority: 'high' as const,
        title: '',
        assignee_ids: [1]
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });
  });

  describe('start', () => {
    it('should throw NotFoundError when work order not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.start(999, 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when work order is not in open status', () => {
      mockRepository.findById = jest.fn().mockReturnValue({
        id: 1,
        status: 'in_progress'
      });

      expect(() => service.start(1, 1)).toThrow(ValidationError);
    });
  });

  describe('complete', () => {
    it('should throw NotFoundError when work order not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.complete(999, {}, 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when work order is not in_progress', () => {
      mockRepository.findById = jest.fn().mockReturnValue({
        id: 1,
        status: 'open'
      });

      expect(() => service.complete(1, {}, 1)).toThrow(ValidationError);
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundError when work order not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.cancel(999, 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when work order is already completed', () => {
      mockRepository.findById = jest.fn().mockReturnValue({
        id: 1,
        status: 'completed'
      });

      expect(() => service.cancel(1, 1)).toThrow(ValidationError);
    });
  });
});

