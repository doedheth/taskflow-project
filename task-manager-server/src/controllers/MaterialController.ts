/**
 * Material Controller
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { MaterialService, materialService } from '../services/MaterialService';
import { Material, CreateMaterialDTO, UpdateMaterialDTO } from '../types/inspection';

export class MaterialController extends BaseController<Material, CreateMaterialDTO, UpdateMaterialDTO> {
  protected service: MaterialService;

  constructor(service: MaterialService = materialService) {
    super(service);
    this.service = service;
  }

  search = (req: Request, res: Response): void => {
    try {
      const query = req.query.q as string;
      const result = this.service.search(query);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Search materials');
    }
  };
}

export const materialController = new MaterialController();
export default materialController;
