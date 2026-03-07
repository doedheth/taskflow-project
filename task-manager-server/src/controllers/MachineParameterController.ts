import { Request, Response } from 'express';
import { prepare } from '../database/db';

export class MachineParameterController {
  
  // Get parameters for a specific asset
  getParameters = async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.assetId);
      if (isNaN(assetId)) {
        res.status(400).json({ error: 'Invalid asset ID' });
        return;
      }

      // Using .all() which returns unknown[]
      const params = prepare(`
        SELECT * FROM machine_parameters 
        WHERE asset_id = ?
        ORDER BY sort_order ASC, id ASC
      `).all(assetId) as any[];

      // Group by section while preserving sort order
      const sections: string[] = [];
      const grouped = params.reduce((acc: any, curr: any) => {
        const section = curr.section;
        if (!acc[section]) {
          acc[section] = [];
          sections.push(section);
        }
        acc[section].push(curr);
        return acc;
      }, {});

      res.json({ data: grouped, raw: params, sections });
    } catch (error) {
      console.error('Error fetching machine parameters:', error);
      res.status(500).json({ error: 'Failed to fetch parameters' });
    }
  }

  // Submit a log
  submitLog = async (req: Request, res: Response) => {
    try {
      const { 
        asset_id, 
        production_date, 
        shift, 
        product_name, 
        operator_name, 
        values // Array of { parameter_id, value }
      } = req.body;

      if (!asset_id || !production_date || !values || !Array.isArray(values)) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const userId = (req as any).user?.id || null;

      // Create Set
      const result = prepare(`
        INSERT INTO machine_parameter_sets (
          asset_id, production_date, shift, product_name, operator_name, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        asset_id, 
        production_date, 
        shift, 
        product_name, 
        operator_name, 
        userId
      );
      
      const setId = result.lastInsertRowid;

      // Insert values
      const insertValue = prepare(`
        INSERT INTO machine_parameter_values (set_id, parameter_id, value)
        VALUES (?, ?, ?)
      `);

      for (const val of values) {
        insertValue.run(setId, val.parameter_id, val.value);
      }

      res.status(201).json({ 
        message: 'Log submitted successfully', 
        id: setId 
      });

    } catch (error) {
      console.error('Error submitting machine parameter log:', error);
      res.status(500).json({ error: 'Failed to submit log' });
    }
  }

  // Get logs for an asset
  async getLogs(req: Request, res: Response) {
    try {
      const assetId = parseInt(req.params.assetId);
      const limit = parseInt(req.query.limit as string) || 10;
      const dateFrom = req.query.date_from as string;
      const dateTo = req.query.date_to as string;
      const shift = req.query.shift as string;
      const productName = req.query.product_name as string;

      let query = `
        SELECT s.*, u.name as created_by_name
        FROM machine_parameter_sets s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.asset_id = ?
      `;
      const params: any[] = [assetId];

      if (dateFrom) {
        query += ` AND s.production_date >= ?`;
        params.push(dateFrom);
      }
      if (dateTo) {
        query += ` AND s.production_date <= ?`;
        params.push(dateTo);
      }

      if (shift) {
        query += ` AND s.shift = ?`;
        params.push(shift);
      }
      if (productName) {
        query += ` AND s.product_name LIKE ?`;
        params.push(`%${productName}%`);
      }

      query += ` ORDER BY s.production_date DESC, s.created_at DESC LIMIT ?`;
      params.push(limit);

      const logs = prepare(query).all(...params);

      res.json({ data: logs });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }

  getLogDetail = async (req: Request, res: Response) => {
    try {
      const logId = parseInt(req.params.id);
      
      const log = prepare(`
        SELECT s.*, u.name as created_by_name, a.name as asset_name
        FROM machine_parameter_sets s
        LEFT JOIN users u ON s.created_by = u.id
        LEFT JOIN assets a ON s.asset_id = a.id
        WHERE s.id = ?
      `).get(logId);

      if (!log) {
        res.status(404).json({ error: 'Log not found' });
        return;
      }

      // Join with machine_parameters to get the config (min/max/unit/section)
      // We must select these fields explicitly so the frontend can display the "Setting" columns
      const values = prepare(`
        SELECT 
          v.id, v.set_id, v.parameter_id, v.value,
          p.name as parameter_name, 
          p.section, 
          p.unit,
          p.setting_a_min, p.setting_a_max,
          p.setting_b_min, p.setting_b_max,
          p.setting_c_min, p.setting_c_max,
          p.sort_order
        FROM machine_parameter_values v
        JOIN machine_parameters p ON v.parameter_id = p.id
        WHERE v.set_id = ?
        ORDER BY p.sort_order ASC
      `).all(logId);

      // Fetch production report if exists
      const report = prepare('SELECT * FROM machine_production_reports WHERE parameter_set_id = ?').get(logId);
      
      let productionReport = null;
      if (report && typeof report === 'object') {
        // Helper to safe parse JSON
        const parse = (str: string) => {
          try { return str ? JSON.parse(str) : [] } catch (e) { return [] }
        };
        const parseObj = (str: string) => {
          try { return str ? JSON.parse(str) : {} } catch (e) { return {} }
        };

        productionReport = {
          ...report,
          material_usage: parse((report as any).material_usage),
          material_aux_usage: parse((report as any).material_aux_usage),
          waste_data: parse((report as any).waste_data),
          downtime_data: parseObj((report as any).downtime_data), // downtime_data is usually object { total_minutes: ... }
          production_result: parse((report as any).production_result),
        };
      }

      // Combine log + values + report
      const resultData = {
        ...(log as object),
        values,
        production_report: productionReport 
      };

      res.json({ data: resultData });
    } catch (error) {
      console.error('Error fetching log detail:', error);
      res.status(500).json({ error: 'Failed to fetch log detail' });
    }
  };

  // Create parameter for an asset
  createParameter = async (req: Request, res: Response) => {
    try {
      const { asset_id, section, name, unit, setting_a_min, setting_a_max, setting_b_min, setting_b_max, setting_c_min, setting_c_max, sort_order } = req.body;
      
      if (!asset_id || !section) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // If sort_order not provided, get the max sort_order for this asset and add 1
      let finalSortOrder = sort_order;
      if (finalSortOrder === undefined || finalSortOrder === null) {
        const maxOrder = prepare(`
          SELECT MAX(sort_order) as max_order 
          FROM machine_parameters 
          WHERE asset_id = ?
        `).get(asset_id) as { max_order: number | null };
        finalSortOrder = (maxOrder?.max_order || 0) + 1;
      }

      const result = prepare(`
        INSERT INTO machine_parameters (
          asset_id, section, name, unit,
          setting_a_min, setting_a_max,
          setting_b_min, setting_b_max,
          setting_c_min, setting_c_max,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        asset_id,
        section,
        name || '', // Default to empty string if missing
        unit || null,
        setting_a_min !== undefined ? setting_a_min : null,
        setting_a_max !== undefined ? setting_a_max : null,
        setting_b_min !== undefined ? setting_b_min : null,
        setting_b_max !== undefined ? setting_b_max : null,
        setting_c_min !== undefined ? setting_c_min : null,
        setting_c_max !== undefined ? setting_c_max : null,
        finalSortOrder
      );

      res.status(201).json({ message: 'Parameter created', id: result.lastInsertRowid });
    } catch (error) {
      console.error('Error creating parameter:', error);
      res.status(500).json({ error: 'Failed to create parameter' });
    }
  }

  // Update parameter
  updateParameter = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { section, name, unit, setting_a_min, setting_a_max, setting_b_min, setting_b_max, setting_c_min, setting_c_max, sort_order } = req.body;

      prepare(`
        UPDATE machine_parameters 
        SET section = ?, name = ?, unit = ?,
          setting_a_min = ?, setting_a_max = ?,
          setting_b_min = ?, setting_b_max = ?,
          setting_c_min = ?, setting_c_max = ?,
          sort_order = COALESCE(?, sort_order)
        WHERE id = ?
      `).run(
        section,
        name || '', // Default to empty string
        unit || null,
        setting_a_min !== undefined ? setting_a_min : null,
        setting_a_max !== undefined ? setting_a_max : null,
        setting_b_min !== undefined ? setting_b_min : null,
        setting_b_max !== undefined ? setting_b_max : null,
        setting_c_min !== undefined ? setting_c_min : null,
        setting_c_max !== undefined ? setting_c_max : null,
        sort_order !== undefined ? sort_order : null,
        id
      );

      res.json({ message: 'Parameter updated' });
    } catch (error) {
      console.error('Error updating parameter:', error);
      res.status(500).json({ error: 'Failed to update parameter' });
    }
  }

  // Update parameters order in bulk
  updateParametersOrder = async (req: Request, res: Response) => {
    try {
      const { orders } = req.body; // Array of { id, sort_order, section }

      if (!orders || !Array.isArray(orders)) {
        res.status(400).json({ error: 'Invalid orders data' });
        return;
      }

      const stmt = prepare(`
        UPDATE machine_parameters 
        SET sort_order = ?, section = ?
        WHERE id = ?
      `);

      for (const item of orders) {
        stmt.run(item.sort_order, item.section, item.id);
      }

      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      console.error('Error updating parameter order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  }

  // Delete parameter
  deleteParameter = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      prepare('DELETE FROM machine_parameters WHERE id = ?').run(id);
      res.json({ message: 'Parameter deleted' });
    } catch (error) {
      console.error('Error deleting parameter:', error);
      res.status(500).json({ error: 'Failed to delete parameter' });
    }
  }

  // Get downtime logs filtered by asset + shift time range
  getDowntimeByShift = async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.query.asset_id as string);
      const date = req.query.date as string;
      const shiftName = req.query.shift as string;

      if (!assetId || isNaN(assetId) || !date || !shiftName) {
        res.status(400).json({ error: 'Missing required parameters: asset_id, date, shift' });
        return;
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
        return;
      }

      interface ShiftPattern {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
      }

      const shift = prepare('SELECT * FROM shift_patterns WHERE name = ?').get(shiftName) as ShiftPattern | undefined;
      if (!shift) {
        res.status(404).json({ error: 'Shift pattern not found' });
        return;
      }

      const normalizeTime = (time: string): string => {
        const parts = time.split(':');
        return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
      };

      const startTime = normalizeTime(shift.start_time);
      const endTime = normalizeTime(shift.end_time);
      const startDateTime = `${date} ${startTime}:00`;
      let endDateTime: string;

      const toMinutes = (t: string): number => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      if (toMinutes(endTime) <= toMinutes(startTime)) {
        const nextDay = new Date(date + 'T12:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        endDateTime = `${nextDay.toISOString().split('T')[0]} ${endTime}:00`;
      } else {
        endDateTime = `${date} ${endTime}:00`;
      }

      const downtimeLogs = prepare(`
        SELECT dl.id, dl.asset_id, dl.downtime_type, dl.start_time, dl.end_time,
               dl.reason, dl.created_at,
               dc.name as classification_name,
               dc.category as classification_category,
               CASE 
                 WHEN dl.end_time IS NOT NULL THEN 
                   CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
                 ELSE 
                   CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
               END as duration_minutes
        FROM downtime_logs dl
        LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
        WHERE dl.asset_id = ?
        AND datetime(dl.start_time) >= datetime(?)
        AND datetime(dl.start_time) < datetime(?)
        ORDER BY dl.start_time ASC
      `).all(assetId, startDateTime, endDateTime) as any[];

      const totalMinutes = downtimeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      res.json({
        data: downtimeLogs,
        total_minutes: totalMinutes,
        shift: { name: shift.name, start_time: startTime, end_time: endTime }
      });
    } catch (error) {
      console.error('Error fetching downtime by shift:', error);
      res.status(500).json({ error: 'Failed to fetch downtime data' });
    }
  }
}
