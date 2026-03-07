/**
 * Work Order Controller - HTTP request handling
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { WorkOrderService, workOrderService } from '../services/WorkOrderService';
import {
  WorkOrder,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WorkOrderFilter,
} from '../types/workOrder';

export class WorkOrderController extends BaseController<
  WorkOrder,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO
> {
  protected service: WorkOrderService;

  constructor(service: WorkOrderService = workOrderService) {
    super(service);
    this.service = service;
  }

  /**
   * GET /work-orders - Get all work orders with filters
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const filter: WorkOrderFilter = {
        status: req.query.status as any,
        type: req.query.type as any,
        priority: req.query.priority as any,
        asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
        assigned_to: req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined,
        sprint_id: req.query.sprint_id ? parseInt(req.query.sprint_id as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const usePagination = req.query.page !== undefined;

      if (usePagination) {
        const pagination = this.getPagination(req);
        const result = this.service.getAllWithDetails(filter, pagination);
        this.success(res, result);
      } else {
        const result = this.service.getAllWithDetails(filter);
        this.success(res, result);
      }
    } catch (error) {
      this.handleError(res, error, 'Get work orders');
    }
  };

  /**
   * GET /work-orders/:id - Get work order by ID
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getByIdWithDetails(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get work order');
    }
  };

  /**
   * GET /work-orders/ticket/:ticketId - Get work orders by ticket
   */
  getByTicket = (req: Request, res: Response): void => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const result = this.service.getByTicketId(ticketId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get work orders by ticket');
    }
  };

  /**
   * POST /work-orders - Create work order
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const data: CreateWorkOrderDTO = {
        asset_id: req.body.asset_id,
        type: req.body.type,
        priority: req.body.priority,
        title: req.body.title,
        description: req.body.description,
        failure_code_id: req.body.failure_code_id,
        maintenance_schedule_id: req.body.maintenance_schedule_id,
        related_ticket_id: req.body.related_ticket_id,
        sprint_id: req.body.sprint_id,
        scheduled_start: req.body.scheduled_start,
        scheduled_end: req.body.scheduled_end,
        assignee_ids: req.body.assignee_ids,
      };

      const result = this.service.create(data, userId);

      // Return with details
      const workOrder = this.service.getByIdWithDetails(result.id);
      this.created(res, workOrder);
    } catch (error) {
      this.handleError(res, error, 'Create work order');
    }
  };

  /**
   * PUT /work-orders/:id - Update work order
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const data: UpdateWorkOrderDTO = {
        asset_id: req.body.asset_id,
        type: req.body.type,
        priority: req.body.priority,
        title: req.body.title,
        description: req.body.description,
        failure_code_id: req.body.failure_code_id,
        scheduled_start: req.body.scheduled_start,
        scheduled_end: req.body.scheduled_end,
        assignee_ids: req.body.assignee_ids,
      };

      const result = this.service.update(id, data, userId);

      if (!result) {
        this.error(res, 'Work order not found', 404);
        return;
      }

      // Return with details
      const workOrder = this.service.getByIdWithDetails(id);
      this.success(res, workOrder);
    } catch (error) {
      this.handleError(res, error, 'Update work order');
    }
  };

  /**
   * POST /work-orders/:id/start - Start work order
   */
  start = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const result = this.service.start(id, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Start work order');
    }
  };

  /**
   * POST /work-orders/:id/complete - Complete work order
   */
  complete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const data = {
        root_cause: req.body.root_cause,
        solution: req.body.solution,
        parts_used: req.body.parts_used,
        labor_hours: req.body.labor_hours ? parseFloat(req.body.labor_hours) : undefined,
      };

      const result = this.service.complete(id, data, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Complete work order');
    }
  };

  /**
   * POST /work-orders/:id/cancel - Cancel work order
   */
  cancel = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const result = this.service.cancel(id, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Cancel work order');
    }
  };

  /**
   * GET /work-orders/statistics - Get work order statistics
   */
  getStatistics = (req: Request, res: Response): void => {
    try {
      const result = this.service.getStatistics();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get work order statistics');
    }
  };

  /**
   * POST /work-orders/from-ticket/:ticketId - Create work order from ticket
   */
  createFromTicket = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const ticketId = parseInt(req.params.ticketId);
      const userId = this.getUserId(req);
      const data: CreateWorkOrderDTO = {
        asset_id: req.body.asset_id,
        type: req.body.type,
        priority: req.body.priority,
        title: req.body.title,
        description: req.body.description,
        related_ticket_id: ticketId,
        assignee_ids: req.body.assignee_ids,
        scheduled_start: req.body.scheduled_start,
        scheduled_end: req.body.scheduled_end,
      };

      const result = this.service.createFromTicket(ticketId, data, userId);
      const workOrder = this.service.getByIdWithDetails(result.id);
      this.created(res, workOrder);
    } catch (error) {
      this.handleError(res, error, 'Create work order from ticket');
    }
  };

  /**
   * POST /work-orders/:id/assignees - Add assignee
   */
  addAssignee = (req: Request, res: Response): void => {
    try {
      const workOrderId = parseInt(req.params.id);
      const { user_id } = req.body;
      const userId = this.getUserId(req);

      if (!user_id) {
        this.error(res, 'User ID is required', 400);
        return;
      }

      const result = this.service.addAssignee(workOrderId, user_id, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Add assignee');
    }
  };

  /**
   * DELETE /work-orders/:id/assignees/:userId - Remove assignee
   */
  removeAssignee = (req: Request, res: Response): void => {
    try {
      const workOrderId = parseInt(req.params.id);
      const assigneeId = parseInt(req.params.userId);
      const userId = this.getUserId(req);

      const result = this.service.removeAssignee(workOrderId, assigneeId, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Remove assignee');
    }
  };
}

// Export singleton instance
export const workOrderController = new WorkOrderController();
export default workOrderController;
