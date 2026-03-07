import { Request, Response } from 'express';
import { ComplaintService, complaintService } from '../services/ComplaintService';

export class ComplaintController {
  private service: ComplaintService;

  constructor(service: ComplaintService = complaintService) {
    this.service = service;
  }

  create = (req: Request, res: Response): void => {
    try {
      const data = req.body;
      const saved = this.service.create(data);
      res.status(201).json(saved);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  };

  update = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const saved = this.service.update(id, req.body);
      if (saved) res.json(saved);
      else res.status(404).json({ error: 'Not found' });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  };

  getByInspection = (req: Request, res: Response): void => {
    try {
      const inspectionIdRaw = req.query.inspection_id;
      if (!inspectionIdRaw || isNaN(Number(inspectionIdRaw))) {
        res.status(400).json({ error: 'inspection_id is required and must be a number' });
        return;
      }
      const inspectionId = parseInt(String(inspectionIdRaw));
      const results = this.service.findByInspection(inspectionId);
      res.json(results);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  };
  
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const found = this.service.findById(id);
      if (found) res.json(found);
      else res.status(404).json({ error: 'Not found' });
    } catch(e) {
      res.status(400).json({ error: String(e) });
    }
  }

  delete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      if (this.service.delete(id)) res.status(204).end();
      else res.status(404).json({ error: 'Not found' });
    } catch(e) {
      res.status(400).json({ error: String(e) });
    }
  }
}

export const complaintController = new ComplaintController();
