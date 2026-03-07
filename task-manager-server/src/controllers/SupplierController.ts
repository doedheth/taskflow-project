/**
 * Supplier Controller
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SupplierService, supplierService } from '../services/SupplierService';
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from '../types/inspection';

export class SupplierController extends BaseController<Supplier, CreateSupplierDTO, UpdateSupplierDTO> {
  protected service: SupplierService;

  constructor(service: SupplierService = supplierService) {
    super(service);
    this.service = service;
  }

  search = (req: Request, res: Response): void => {
    try {
      const query = req.query.q as string;
      const result = this.service.search(query);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Search suppliers');
    }
  };
}

export const supplierController = new SupplierController();
export default supplierController;
