/**
 * AssetService Unit Tests
 */
/// <reference types="jest" />

import { AssetService } from '../../services/AssetService';
import { AssetRepository } from '../../models/AssetRepository';
import { NotFoundError, ValidationError, ConflictError } from '../../services/BaseService';

// Mock the repository
jest.mock('../../models/AssetRepository');
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

describe('AssetService', () => {
  let service: AssetService;
  let mockRepository: jest.Mocked<AssetRepository>;

  beforeEach(() => {
    mockRepository = new AssetRepository() as jest.Mocked<AssetRepository>;
    service = new AssetService(mockRepository);
    jest.clearAllMocks();
  });

  describe('getByIdWithDetails', () => {
    it('should return asset when found', () => {
      const mockAsset = {
        id: 1,
        asset_code: 'AST-001',
        name: 'Test Asset',
        status: 'operational',
        criticality: 'medium',
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      };

      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(mockAsset);

      const result = service.getByIdWithDetails(1);

      expect(result).toEqual(mockAsset);
      expect(mockRepository.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when asset not found', () => {
      mockRepository.findByIdWithDetails = jest.fn().mockReturnValue(undefined);

      expect(() => service.getByIdWithDetails(999)).toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should throw ValidationError when asset_code is empty', () => {
      const invalidData = {
        asset_code: '',
        name: 'Test Asset'
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ValidationError when name is empty', () => {
      const invalidData = {
        asset_code: 'AST-001',
        name: ''
      };

      expect(() => service.create(invalidData, 1)).toThrow(ValidationError);
    });

    it('should throw ConflictError when asset_code already exists', () => {
      const validData = {
        asset_code: 'AST-001',
        name: 'Test Asset'
      };

      mockRepository.findByAssetCode = jest.fn().mockReturnValue({ id: 1 });

      expect(() => service.create(validData, 1)).toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('should throw ConflictError when updating to existing asset_code', () => {
      mockRepository.findById = jest.fn().mockReturnValue({ id: 1 });
      mockRepository.findByAssetCode = jest.fn().mockReturnValue({ id: 2 });

      expect(() => service.update(1, { asset_code: 'EXISTING' }, 1)).toThrow(ConflictError);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundError when asset not found', () => {
      mockRepository.findById = jest.fn().mockReturnValue(undefined);

      expect(() => service.updateStatus(999, 'down', 1)).toThrow(NotFoundError);
    });

    it('should throw ValidationError when status is invalid', () => {
      mockRepository.findById = jest.fn().mockReturnValue({ id: 1, status: 'operational' });

      expect(() => service.updateStatus(1, 'invalid', 1)).toThrow(ValidationError);
    });
  });
});

