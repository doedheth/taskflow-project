/**
 * Ticket Controller - HTTP request handling
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TicketService, ticketService } from '../services/TicketService';
import { Ticket, CreateTicketDTO, UpdateTicketDTO, TicketFilter } from '../types/ticket';

export class TicketController extends BaseController<Ticket, CreateTicketDTO, UpdateTicketDTO> {
  protected service: TicketService;

  constructor(service: TicketService = ticketService) {
    super(service);
    this.service = service;
  }

  /**
   * GET /tickets - Get all tickets with filters
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const filter: TicketFilter = {
        status: req.query.status as any,
        type: req.query.type as any,
        priority: req.query.priority as any,
        assignee: req.query.assignee ? parseInt(req.query.assignee as string) : undefined,
        department: req.query.department ? parseInt(req.query.department as string) : undefined,
        sprint:
          req.query.sprint === 'backlog'
            ? 'backlog'
            : req.query.sprint
              ? parseInt(req.query.sprint as string)
              : undefined,
        search: req.query.search as string,
      };

      const result = this.service.getAllWithDetails(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get tickets');
    }
  };

  /**
   * GET /tickets/:id - Get ticket by ID
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getByIdWithDetails(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get ticket');
    }
  };

  /**
   * GET /tickets/key/:ticketKey - Get ticket by key
   */
  getByKey = (req: Request, res: Response): void => {
    try {
      const ticketKey = req.params.ticketKey;
      const result = this.service.getByTicketKey(ticketKey);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get ticket by key');
    }
  };

  /**
   * GET /tickets/sprint/:sprintId - Get tickets by sprint
   */
  getBySprint = (req: Request, res: Response): void => {
    try {
      const sprintId = parseInt(req.params.sprintId);
      const result = this.service.getBySprint(sprintId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get tickets by sprint');
    }
  };

  /**
   * GET /tickets/epic/:epicId - Get tickets by epic
   */
  getByEpic = (req: Request, res: Response): void => {
    try {
      const epicId = parseInt(req.params.epicId);
      const result = this.service.getByEpic(epicId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get tickets by epic');
    }
  };

  /**
   * GET /tickets/search - Search tickets
   */
  search = (req: Request, res: Response): void => {
    try {
      const query = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 20;
      const result = this.service.search(query, limit);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Search tickets');
    }
  };

  /**
   * POST /tickets - Create ticket
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const data: CreateTicketDTO = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        priority: req.body.priority,
        story_points: req.body.story_points,
        department_id: req.body.department_id,
        epic_id: req.body.epic_id,
        sprint_id: req.body.sprint_id,
        due_date: req.body.due_date,
        asset_id: req.body.asset_id,
        assignee_ids: req.body.assignee_ids,
      };

      const result = this.service.create(data, userId);

      // Return with details
      const ticket = this.service.getByIdWithDetails(result.id);
      this.created(res, ticket);
    } catch (error) {
      this.handleError(res, error, 'Create ticket');
    }
  };

  /**
   * PUT /tickets/:id - Update ticket
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const data: UpdateTicketDTO = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        status: req.body.status,
        priority: req.body.priority,
        story_points: req.body.story_points,
        department_id: req.body.department_id,
        epic_id: req.body.epic_id,
        sprint_id: req.body.sprint_id,
        due_date: req.body.due_date,
        asset_id: req.body.asset_id,
        assignee_ids: req.body.assignee_ids,
      };

      const result = this.service.update(id, data, userId);

      if (!result) {
        this.error(res, 'Ticket not found', 404);
        return;
      }

      // Return with details
      const ticket = this.service.getByIdWithDetails(id);
      this.success(res, ticket);
    } catch (error) {
      this.handleError(res, error, 'Update ticket');
    }
  };

  /**
   * PATCH /tickets/:id/status - Update ticket status
   */
  updateStatus = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const userId = this.getUserId(req);

      const result = this.service.updateStatus(id, status, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update ticket status');
    }
  };

  /**
   * POST /tickets/:id/comments - Add comment
   */
  addComment = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const ticketId = parseInt(req.params.id);
      const userId = this.getUserId(req);

      if (!userId) {
        this.error(res, 'User not authenticated', 401);
        return;
      }

      const result = this.service.addComment(ticketId, { content: req.body.content }, userId);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Add comment');
    }
  };

  /**
   * POST /tickets/quick-maintenance - Quick maintenance ticket + WO
   */
  quickMaintenance = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);

      if (!userId) {
        this.error(res, 'User not authenticated', 401);
        return;
      }

      const data = {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        asset_id: req.body.asset_id,
        assignee_ids: req.body.assignee_ids,
        wo_type: req.body.wo_type,
      };

      const result = this.service.quickMaintenance(data, userId);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Quick maintenance');
    }
  };

  /**
   * GET /tickets/statistics - Get ticket statistics
   */
  getStatistics = (req: Request, res: Response): void => {
    try {
      const result = this.service.getStatistics();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get ticket statistics');
    }
  };

  /**
   * POST /tickets/:id/assignees - Add assignee
   */
  addAssignee = (req: Request, res: Response): void => {
    try {
      const ticketId = parseInt(req.params.id);
      const { user_id } = req.body;
      const userId = this.getUserId(req);

      if (!user_id) {
        this.error(res, 'User ID is required', 400);
        return;
      }

      const result = this.service.addAssignee(ticketId, user_id, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Add assignee');
    }
  };

  /**
   * DELETE /tickets/:id/assignees/:userId - Remove assignee
   */
  removeAssignee = (req: Request, res: Response): void => {
    try {
      const ticketId = parseInt(req.params.id);
      const assigneeId = parseInt(req.params.userId);
      const userId = this.getUserId(req);

      const result = this.service.removeAssignee(ticketId, assigneeId, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Remove assignee');
    }
  };
}

// Export singleton instance
export const ticketController = new TicketController();
export default ticketController;
