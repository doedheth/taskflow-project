/**
 * Base Service - Abstract class for business logic layer
 * Handles business rules, validation, and orchestration
 */

import { BaseRepository } from '../models/BaseRepository';
import { PaginationParams, PaginatedResponse } from '../types/common';

export abstract class BaseService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected repository: BaseRepository<T, CreateDTO, UpdateDTO>;

  constructor(repository: BaseRepository<T, CreateDTO, UpdateDTO>) {
    this.repository = repository;
  }

  /**
   * Get all records with optional pagination
   */
  getAll(pagination?: PaginationParams): T[] | PaginatedResponse<T> {
    return this.repository.findAll(pagination);
  }

  /**
   * Get single record by ID
   */
  getById(id: number): T | undefined {
    return this.repository.findById(id);
  }

  /**
   * Create new record
   */
  create(data: CreateDTO, userId?: number): T {
    this.validateCreate(data);
    return this.repository.create(data, userId);
  }

  /**
   * Update existing record
   */
  update(id: number, data: UpdateDTO, userId?: number): T | null {
    this.validateUpdate(id, data);
    return this.repository.update(id, data, userId);
  }

  /**
   * Delete record
   */
  delete(id: number): boolean {
    this.validateDelete(id);
    return this.repository.delete(id);
  }

  /**
   * Check if record exists
   */
  exists(id: number): boolean {
    return this.repository.exists(id);
  }

  /**
   * Validation hook for create - override in subclasses
   */
  protected validateCreate(data: CreateDTO): void {
    // Override in subclass for custom validation
  }

  /**
   * Validation hook for update - override in subclasses
   */
  protected validateUpdate(id: number, data: UpdateDTO): void {
    if (!this.exists(id)) {
      throw new NotFoundError('Record not found');
    }
  }

  /**
   * Validation hook for delete - override in subclasses
   */
  protected validateDelete(id: number): void {
    if (!this.exists(id)) {
      throw new NotFoundError('Record not found');
    }
  }
}

// ============================================
// Custom Error Classes
// ============================================

export class ServiceError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }> = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export default BaseService;
