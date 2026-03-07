import { Request, Response } from 'express';
import { SparepartService } from '../services/SparepartService';

export class SparepartController {
  /**
   * Get sparepart stock comparison between BC and CMMS
   */
  public static async getComparison(req: Request, res: Response): Promise<void> {
    try {
      const data = await SparepartService.getComparisonData();
      res.json({
        success: true,
        count: data.length,
        data: data
      });
    } catch (error: any) {
      console.error('Controller Error - getComparison:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during sparepart comparison'
      });
    }
  }
}
