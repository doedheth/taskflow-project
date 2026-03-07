/**
 * TicketService Unit Tests
 */
/// <reference types="jest" />

import { TicketService } from '../../services/TicketService';
import { TicketRepository } from '../../models/TicketRepository';
import { NotFoundError, ValidationError } from '../../services/BaseService';

// Mock the repository
jest.mock('../../models/TicketRepository');
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

describe('TicketService', () => {
  let service: TicketService;
  let mockRepository: jest.Mocked<TicketRepository>;

  beforeEach(() => {
    mockRepository = new TicketRepository() as jest.Mocked<TicketRepository>;
    service = new TicketService(mockRepository);
    jest.clearAllMocks();
  });

  describe('getByIdWithDetails', () => {
    it('should return ticket when found', () => {
      const mockTicket = {
        id: 1,
        ticket_key: 'TM-1',
        title: 'Test Ticket',
        status: 'todo',
        type: 'task',
        priority: 'medium',
        reporter_id: 1,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        assignees: [],
        comments: [],
        attachments: []
      };

      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(mockTicket);

      const result = service.getByIdWithDetails(1);

      expect(result).toEqual(mockTicket);
      expect(mockRepository.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when ticket not found', () => {
      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(undefined);

      expect(() => service.getByIdWithDetails(999)).toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should throw ValidationError when title is too short', () => {
      const invalidData = {
        title: 'AB'
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when type is invalid', () => {
      const invalidData = {
        title: 'Valid Title',
        type: 'invalid' as any
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when priority is invalid', () => {
      const invalidData = {
        title: 'Valid Title',
        priority: 'invalid' as any
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundError when ticket not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.updateStatus(999, 'done', 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when status is invalid', () => {
      mockRepository.findById = jest.fn().mockReturnValue({
        id: 1,
        status: 'todo'
      });

      expect(() => service.updateStatus(1, 'invalid', 1)).toThrow(ValidationError);
    });
  });

  describe('addComment', () => {
    it('should throw NotFoundError when ticket not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.addComment(999, { content: 'Test' }, 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when content is empty', () => {
      mockRepository.findById = jest.fn().mockReturnValue({ id: 1 });

      expect(() => service.addComment(1, { content: '' }, 1)).toThrow(ValidationError);
    });
  });

  describe('quickMaintenance', () => {
    it('should throw ValidationError when title is too short', () => {
      const invalidData = {
        title: 'AB',
        priority: 'high' as const,
        asset_id: 1,
        assignee_ids: [1]
      };

      expect(() => service.quickMaintenance(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when asset_id is missing', () => {
      const invalidData = {
        title: 'Valid Title',
        priority: 'high' as const,
        assignee_ids: [1]
      } as any;

      expect(() => service.quickMaintenance(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when assignee_ids is empty', () => {
      const invalidData = {
        title: 'Valid Title',
        priority: 'high' as const,
        asset_id: 1,
        assignee_ids: []
      };

      expect(() => service.quickMaintenance(invalidData, 1)).toThrow(ValidationError);
    });
  });
});

