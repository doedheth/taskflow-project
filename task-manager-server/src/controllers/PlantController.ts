import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { PlantService, plantService } from '../services/PlantService';
import { Plant, CreatePlantDTO } from '../types/inspection';

export class PlantController extends BaseController<Plant, CreatePlantDTO, Partial<CreatePlantDTO>> {
  protected service: PlantService;
  constructor(service: PlantService = plantService) {
    super(service);
    this.service = service;
  }

  search = (req: Request, res: Response): void => {
    try {
      const query = req.query.q as string;
      const result = this.service.search(query);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Search plants');
    }
  };
}

export const plantController = new PlantController();
export default plantController;
