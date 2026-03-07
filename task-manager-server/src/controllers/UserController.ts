/**
 * User Controller - HTTP request handling
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserService, userService } from '../services/UserService';
import { User, CreateUserDTO, UpdateUserDTO, UserFilter } from '../types/user';
import { AuthenticatedRequest } from '../types/common';

export class UserController extends BaseController<User, CreateUserDTO, UpdateUserDTO> {
  protected service: UserService;

  constructor(service: UserService = userService) {
    super(service);
    this.service = service;
  }

  /**
   * GET /users - Get all users
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const filter: UserFilter = {
        role: req.query.role as any,
        department_id: req.query.department_id
          ? parseInt(req.query.department_id as string)
          : undefined,
        search: req.query.search as string,
      };

      const result = this.service.getAllWithDetails(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get users');
    }
  };

  /**
   * GET /users/:id - Get user by ID
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getByIdWithDetails(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get user');
    }
  };

  /**
   * GET /users/:id/stats - Get user with statistics
   */
  getWithStats = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const period = parseInt(req.query.period as string) || 30;
      const result = this.service.getWithStats(id, period);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get user stats');
    }
  };

  /**
   * POST /users - Create user
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const result = this.service.create(req.body, userId);
      const user = this.service.getByIdWithDetails(result.id);
      this.created(res, user);
    } catch (error) {
      this.handleError(res, error, 'Create user');
    }
  };

  /**
   * PUT /users/:id - Update user
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const result = this.service.update(id, req.body, userId);

      if (!result) {
        this.error(res, 'User not found', 404);
        return;
      }

      const user = this.service.getByIdWithDetails(id);
      this.success(res, user);
    } catch (error) {
      this.handleError(res, error, 'Update user');
    }
  };

  /**
   * PUT /users/profile - Update own profile
   */
  updateProfile = (req: Request, res: Response): void => {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        this.error(res, 'Unauthorized', 401);
        return;
      }

      const result = this.service.updateProfile(userId, req.body);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update profile');
    }
  };

  /**
   * POST /users/change-password - Change password
   */
  changePassword = (req: Request, res: Response): void => {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        this.error(res, 'Unauthorized', 401);
        return;
      }

      const { currentPassword, newPassword } = req.body;
      this.service.changePassword(userId, currentPassword, newPassword);
      this.success(res, { message: 'Password changed successfully' });
    } catch (error) {
      this.handleError(res, error, 'Change password');
    }
  };

  /**
   * GET /users/performance/team - Get team performance
   */
  getTeamPerformance = (req: Request, res: Response): void => {
    try {
      const period = parseInt(req.query.period as string) || 30;
      const result = this.service.getTeamPerformance(period);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get team performance');
    }
  };

  /**
   * GET /users/technicians - Get technicians for assignment
   */
  getTechnicians = (req: Request, res: Response): void => {
    try {
      const result = this.service.getTechnicians();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get technicians');
    }
  };

  /**
   * GET /users/:id/activity - Get user activity
   */
  getUserActivity = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const result = this.service.getUserActivity(id, limit);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get user activity');
    }
  };

  /**
   * GET /users/me - Get current user
   */
  getCurrentUser = (req: Request, res: Response): void => {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        this.error(res, 'Unauthorized', 401);
        return;
      }
      const result = this.service.getByIdWithDetails(userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get current user');
    }
  };

  /**
   * GET /users/:id/performance - Get user performance
   */
  getPerformance = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const period = parseInt(req.query.period as string) || 30;
      const result = this.service.getPerformance(id, period);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get user performance');
    }
  };

  /**
   * POST /users/:id/reset-password - Reset user password
   */
  resetPassword = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;
      const result = this.service.resetPassword(id, password);
      this.success(res, { message: 'Password reset successfully', newPassword: result });
    } catch (error) {
      this.handleError(res, error, 'Reset password');
    }
  };
}

// Export singleton
export const userController = new UserController();
export default userController;
