
import { Request, Response } from 'express';
import { prepare } from '../database/db';

export class ProductionReportController {
  // Get report by parameter_set_id
  getReport = async (req: Request, res: Response) => {
    try {
      const { parameter_set_id } = req.params;
      const report = prepare('SELECT * FROM machine_production_reports WHERE parameter_set_id = ?').get(parameter_set_id);
      
      if (report && typeof report === 'object') {
        const reportData = report as any;
        // Parse JSON fields
        const parsedReport = {
          ...reportData,
          material_usage: reportData.material_usage ? JSON.parse(reportData.material_usage) : [],
          material_aux_usage: reportData.material_aux_usage ? JSON.parse(reportData.material_aux_usage) : [],
          waste_data: reportData.waste_data ? JSON.parse(reportData.waste_data) : [],
          downtime_data: reportData.downtime_data ? JSON.parse(reportData.downtime_data) : {},
          production_result: reportData.production_result ? JSON.parse(reportData.production_result) : [],
        };
        res.json(parsedReport);
      } else {
        res.status(404).json({ message: 'Report not found' });
      }
    } catch (error) {
      console.error('Error fetching production report:', error);
      res.status(500).json({ error: 'Failed to fetch production report' });
    }
  }

  // Create or Update report
  saveReport = async (req: Request, res: Response) => {
    try {
      const { 
        parameter_set_id, 
        material_usage, 
        material_aux_usage, 
        waste_data, 
        downtime_data, 
        production_result, 
        notes 
      } = req.body;

      if (!parameter_set_id) {
        res.status(400).json({ error: 'Missing parameter_set_id' });
        return;
      }

      // Check if exists
      const existing = prepare('SELECT id FROM machine_production_reports WHERE parameter_set_id = ?').get(parameter_set_id);

      if (existing && typeof existing === 'object') {
        const existingObj = existing as any;
        // Update
        prepare(`
          UPDATE machine_production_reports 
          SET material_usage = ?, 
              material_aux_usage = ?, 
              waste_data = ?, 
              downtime_data = ?, 
              production_result = ?, 
              notes = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE parameter_set_id = ?
        `).run(
          JSON.stringify(material_usage || []),
          JSON.stringify(material_aux_usage || []),
          JSON.stringify(waste_data || []),
          JSON.stringify(downtime_data || {}),
          JSON.stringify(production_result || []),
          notes || '',
          parameter_set_id
        );
        res.json({ message: 'Report updated', id: existingObj.id });
      } else {
        // Create
        const result = prepare(`
          INSERT INTO machine_production_reports (
            parameter_set_id,
            material_usage,
            material_aux_usage,
            waste_data,
            downtime_data,
            production_result,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          parameter_set_id,
          JSON.stringify(material_usage || []),
          JSON.stringify(material_aux_usage || []),
          JSON.stringify(waste_data || []),
          JSON.stringify(downtime_data || {}),
          JSON.stringify(production_result || []),
          notes || ''
        );
        res.status(201).json({ message: 'Report created', id: result.lastInsertRowid });
      }
    } catch (error) {
      console.error('Error saving production report:', error);
      res.status(500).json({ error: 'Failed to save production report' });
    }
  }
}

export default new ProductionReportController();

