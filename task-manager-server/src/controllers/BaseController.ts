/**
 * Base Controller - Abstract class for HTTP request handling
 * Handles request parsing, response formatting, and error handling
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest, PaginationParams, ApiResponse } from '../types/common';
import { BaseService, ServiceError, NotFoundError, ValidationError } from '../services/BaseService';

export abstract class BaseController<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected service: BaseService<T, CreateDTO, UpdateDTO>;

  constructor(service: BaseService<T, CreateDTO, UpdateDTO>) {
    this.service = service;
  }

  /**
   * Get current user from request
   */
  protected getUser(req: Request): AuthenticatedRequest['user'] {
    return (req as AuthenticatedRequest).user;
  }

  /**
   * Get user ID from request
   */
  protected getUserId(req: Request): number | undefined {
    return this.getUser(req)?.id;
  }

  /**
   * Check if user has role
   */
  protected hasRole(req: Request, roles: string[]): boolean {
    const user = this.getUser(req);
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Parse pagination parameters from query
   */
  protected getPagination(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
  }

  /**
   * Validate request using express-validator
   */
  protected validate(req: Request, res: Response): boolean {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.error(res, 'Validation failed', 400, errors.array());
      return false;
    }
    return true;
  }

  /**
   * Send success response
   */
  protected success<D = T>(res: Response, data: D, statusCode: number = 200): void {
    res.status(statusCode).json(data);
  }

  /**
   * Send created response (201)
   */
  protected created<D = T>(res: Response, data: D): void {
    this.success(res, data, 201);
  }

  /**
   * Send no content response (204)
   */
  protected noContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send error response
   */
  protected error(res: Response, message: string, statusCode: number = 500, errors?: any[]): void {
    const response: ApiResponse = { success: false, error: message };
    if (errors) {
      response.errors = errors;
    }
    res.status(statusCode).json(response);
  }

  /**
   * Handle service errors
   */
  protected handleError(res: Response, error: unknown, context: string): void {
    console.error(`${context} error:`, error);

    if (error instanceof ServiceError) {
      if (error instanceof ValidationError) {
        this.error(res, error.message, error.statusCode, error.errors as any);
      } else {
        this.error(res, error.message, error.statusCode);
      }
      return;
    }

    if (error instanceof Error) {
      this.error(res, 'Server error', 500);
      return;
    }

    this.error(res, 'Unknown error occurred', 500);
  }

  /**
   * Standard getAll handler
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const usePagination = req.query.page !== undefined || req.query.limit !== undefined;

      if (usePagination) {
        const pagination = this.getPagination(req);
        const result = this.service.getAll(pagination);
        this.success(res, result);
      } else {
        const result = this.service.getAll();
        this.success(res, result);
      }
    } catch (error) {
      this.handleError(res, error, 'GetAll');
    }
  };

  /**
   * Standard getById handler
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getById(id);

      if (!result) {
        this.error(res, 'Resource not found', 404);
        return;
      }

      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'GetById');
    }
  };

  /**
   * Standard create handler
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const result = this.service.create(req.body as CreateDTO, userId);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create');
    }
  };

  /**
   * Standard update handler
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const result = this.service.update(id, req.body as UpdateDTO, userId);

      if (!result) {
        this.error(res, 'Resource not found', 404);
        return;
      }

      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update');
    }
  };

  /**
   * Standard delete handler
   */
  delete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const success = this.service.delete(id);

      if (!success) {
        this.error(res, 'Resource not found', 404);
        return;
      }

      this.noContent(res);
    } catch (error) {
      this.handleError(res, error, 'Delete');
    }
  };
}

export default BaseController;
