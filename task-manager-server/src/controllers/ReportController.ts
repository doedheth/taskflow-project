/**
 * Report Controller - HTTP request handling for reports
 */

import { Request, Response } from 'express';
import { ReportService, reportService } from '../services/ReportService';
import { DateRangeFilter } from '../types/report';

export class ReportController {
  private service: ReportService;

  constructor(service: ReportService = reportService) {
    this.service = service;
  }

  /**
   * Parse date range filter from query
   */
  private getDateFilter(req: Request): DateRangeFilter & { asset_id?: number } {
    return {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      days: req.query.days ? parseInt(req.query.days as string) : undefined,
      asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
    };
  }

  /**
   * GET /reports/kpi/dashboard - Get KPI Dashboard
   */
  getKPIDashboard = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getKPIDashboard(filter);
      res.json(result);
    } catch (error) {
      console.error('Get KPI dashboard error:', error);
      res.status(500).json({ error: 'Failed to get KPI dashboard' });
    }
  };

  /**
   * GET /reports/kpi/production - Get Production KPI
   */
  getProductionKPI = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getProductionKPI(filter);
      res.json(result);
    } catch (error) {
      console.error('Get production KPI error:', error);
      res.status(500).json({ error: 'Failed to get production KPI' });
    }
  };

  /**
   * GET /reports/production/summary - Get Production Summary
   */
  getProductionSummary = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getProductionSummary(filter);
      res.json(result);
    } catch (error) {
      console.error('Get production summary error:', error);
      res.status(500).json({ error: 'Failed to get production summary' });
    }
  };

  /**
   * GET /reports/production/daily - Get Daily Breakdown
   */
  getDailyBreakdown = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getDailyBreakdown(filter);
      res.json(result);
    } catch (error) {
      console.error('Get daily breakdown error:', error);
      res.status(500).json({ error: 'Failed to get daily breakdown' });
    }
  };

  /**
   * GET /reports/work-orders - Get Work Order Report
   */
  getWorkOrderReport = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getWorkOrderReport(filter);
      res.json(result);
    } catch (error) {
      console.error('Get work order report error:', error);
      res.status(500).json({ error: 'Failed to get work order report' });
    }
  };

  /**
   * GET /reports/tickets - Get Ticket Report
   */
  getTicketReport = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getTicketReport(filter);
      res.json(result);
    } catch (error) {
      console.error('Get ticket report error:', error);
      res.status(500).json({ error: 'Failed to get ticket report' });
    }
  };

  /**
   * GET /reports/team - Get Team Report
   */
  getTeamReport = (req: Request, res: Response): void => {
    try {
      const result = this.service.getTeamReport();
      res.json(result);
    } catch (error) {
      console.error('Get team report error:', error);
      res.status(500).json({ error: 'Failed to get team report' });
    }
  };

  /**
   * GET /reports/dashboard - Get comprehensive dashboard
   */
  getDashboard = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getDashboard(filter);
      res.json(result);
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to get dashboard' });
    }
  };

  /**
   * GET /reports/maintenance/metrics - Get maintenance metrics
   */
  getMaintenanceMetrics = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getMaintenanceMetrics(filter);
      res.json(result);
    } catch (error) {
      console.error('Get maintenance metrics error:', error);
      res.status(500).json({ error: 'Failed to get maintenance metrics' });
    }
  };

  /**
   * GET /reports/kpi/asset/:assetId - Get Asset KPI
   */
  getAssetKPI = (req: Request, res: Response): void => {
    try {
      const assetId = parseInt(req.params.assetId);
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const result = this.service.getAssetKPI(assetId, days);
      res.json(result);
    } catch (error) {
      console.error('Get asset KPI error:', error);
      res.status(500).json({ error: 'Failed to get asset KPI' });
    }
  };

  /**
   * GET /reports/downtime - Get Downtime Report
   */
  getDowntimeReport = (req: Request, res: Response): void => {
    try {
      const filter = this.getDateFilter(req);
      const result = this.service.getDowntimeReport(filter);
      res.json(result);
    } catch (error) {
      console.error('Get downtime report error:', error);
      res.status(500).json({ error: 'Failed to get downtime report' });
    }
  };

  /**
   * GET /reports/maintenance-compliance - Get Maintenance Compliance
   */
  getMaintenanceCompliance = (req: Request, res: Response): void => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const result = this.service.getMaintenanceCompliance(days);
      res.json(result);
    } catch (error) {
      console.error('Get maintenance compliance error:', error);
      res.status(500).json({ error: 'Failed to get maintenance compliance' });
    }
  };

  /**
   * GET /reports/technician-performance - Get Technician Performance
   */
  getTechnicianPerformance = (req: Request, res: Response): void => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const result = this.service.getTechnicianPerformance(days);
      res.json(result);
    } catch (error) {
      console.error('Get technician performance error:', error);
      res.status(500).json({ error: 'Failed to get technician performance' });
    }
  };
}

// Export singleton
export const reportController = new ReportController();
export default reportController;
