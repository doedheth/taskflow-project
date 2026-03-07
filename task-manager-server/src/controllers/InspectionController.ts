/**
 * Inspection Controller
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { InspectionService, inspectionService } from '../services/InspectionService';
import {
  Inspection,
  CreateInspectionDTO,
  InspectionFilter
} from '../types/inspection';

export class InspectionController extends BaseController<Inspection, CreateInspectionDTO, any> {
  protected service: InspectionService;

  constructor(service: InspectionService = inspectionService) {
    super(service);
    this.service = service;
  }

  getAll = (req: Request, res: Response): void => {
    try {
      const filter: InspectionFilter = {
        supplier_id: req.query.supplier_id ? parseInt(req.query.supplier_id as string) : undefined,
        status: req.query.status as any,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        search: req.query.search as string,
      };

      const usePagination = req.query.page !== undefined;

      if (usePagination) {
        const pagination = this.getPagination(req);
        const result = this.service.getAllWithFilter(filter, pagination);
        this.success(res, result);
      } else {
        const result = this.service.getAllWithFilter(filter);
        this.success(res, result);
      }
    } catch (error) {
      this.handleError(res, error, 'Get inspections');
    }
  };

  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getWithDetails(id);

      if (!result) {
        this.error(res, 'Inspection not found', 404);
        return;
      }

      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get inspection detail');
    }
  };

  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const data: CreateInspectionDTO = {
        ...req.body,
        checker_id: userId // Use current user as checker
      };

      const result = this.service.create(data);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create inspection');
    }
  };

  update = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      if (!this.validate(req, res)) return;

      const result = this.service.update(id, req.body);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update inspection');
    }
  };

  delete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      this.service.delete(id);
      this.noContent(res);
    } catch (error) {
      this.handleError(res, error, 'Delete inspection');
    }
  };
}

export const inspectionController = new InspectionController();
export default inspectionController;
