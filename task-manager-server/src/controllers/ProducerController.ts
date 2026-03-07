/**
 * Producer Controller
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ProducerService, producerService } from '../services/ProducerService';
import { Producer, CreateProducerDTO, UpdateProducerDTO } from '../types/inspection';

export class ProducerController extends BaseController<Producer, CreateProducerDTO, UpdateProducerDTO> {
  protected service: ProducerService;

  constructor(service: ProducerService = producerService) {
    super(service);
    this.service = service;
  }

  search = (req: Request, res: Response): void => {
    try {
      const query = req.query.q as string;
      const result = this.service.search(query);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Search producers');
    }
  };
}

export const producerController = new ProducerController();
export default producerController;
