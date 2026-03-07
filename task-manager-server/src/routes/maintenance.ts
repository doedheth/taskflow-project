import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth, managerOrAdmin } from '../middleware/auth';

const router = express.Router();

interface MaintenanceSchedule {
  id: number;
  asset_id: number;
  title: string;
  description?: string;
  frequency_type: string;
  frequency_value: number;
  runtime_hours_trigger?: number;
  last_performed?: string;
  next_due?: string;
  estimated_duration_minutes?: number;
  assigned_to?: number;
  is_active: number;
  checklist?: string;
  created_at: string;
  updated_at: string;
}

interface ShiftPattern {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_active: number;
}

// ============================================
// Maintenance Schedules (Preventive Maintenance)
// ============================================

// Get all maintenance schedules
router.get('/schedules', auth, (req: Request, res: Response): void => {
  try {
    const { asset_id, is_active, overdue_only } = req.query;

    let sql = `
      SELECT ms.*, 
             a.asset_code, a.name as asset_name, a.location as asset_location,
             u.name as assigned_to_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN users u ON ms.assigned_to = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (asset_id) {
      sql += ' AND ms.asset_id = ?';
      params.push(asset_id);
    }

    if (is_active !== undefined) {
      sql += ' AND ms.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    if (overdue_only === 'true') {
      sql += ' AND ms.next_due < date("now") AND ms.is_active = 1';
    }

    sql += ' ORDER BY ms.next_due ASC';

    const schedules = db.prepare(sql).all(...params);
    res.json(schedules);
  } catch (error) {
    console.error('Get maintenance schedules error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get upcoming maintenance (due within X days)
router.get('/schedules/upcoming', auth, (req: Request, res: Response): void => {
  try {
    const { days = '7' } = req.query;

    const schedules = db
      .prepare(
        `
      SELECT ms.*, 
             a.asset_code, a.name as asset_name, a.location as asset_location, a.criticality,
             u.name as assigned_to_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN users u ON ms.assigned_to = u.id
      WHERE ms.is_active = 1 
      AND ms.next_due <= date('now', '+' || ? || ' days')
      ORDER BY ms.next_due ASC, a.criticality DESC
    `
      )
      .all(days);

    res.json(schedules);
  } catch (error) {
    console.error('Get upcoming maintenance error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get maintenance schedule by ID
router.get('/schedules/:id', auth, (req: Request, res: Response): void => {
  try {
    const scheduleId = parseInt(req.params.id);

    const schedule = db
      .prepare(
        `
      SELECT ms.*, 
             a.asset_code, a.name as asset_name, a.location as asset_location,
             u.name as assigned_to_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN users u ON ms.assigned_to = u.id
      WHERE ms.id = ?
    `
      )
      .get(scheduleId);

    if (!schedule) {
      res.status(404).json({ error: 'Maintenance schedule not found.' });
      return;
    }

    // Get related work orders
    const relatedWorkOrders = db
      .prepare(
        `
      SELECT wo.wo_number, wo.status, wo.actual_start, wo.actual_end, wo.labor_hours
      FROM work_orders wo
      WHERE wo.maintenance_schedule_id = ?
      ORDER BY wo.created_at DESC
      LIMIT 10
    `
      )
      .all(scheduleId);

    res.json({
      ...(schedule as unknown as Record<string, unknown>),
      relatedWorkOrders,
    });
  } catch (error) {
    console.error('Get maintenance schedule error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create maintenance schedule
router.post(
  '/schedules',
  auth,
  managerOrAdmin,
  [
    body('asset_id').isInt(),
    body('title').trim().isLength({ min: 3 }),
    body('frequency_type').isIn([
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
      'runtime_hours',
    ]),
    body('frequency_value').isInt({ min: 1 }),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        asset_id,
        title,
        description,
        frequency_type,
        frequency_value,
        runtime_hours_trigger,
        next_due,
        estimated_duration_minutes,
        assigned_to,
        checklist,
      } = req.body;

      // Verify asset exists
      const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(asset_id);
      if (!asset) {
        res.status(404).json({ error: 'Asset not found.' });
        return;
      }

      // Calculate initial next_due if not provided
      let nextDueDate = next_due;
      if (!nextDueDate && frequency_type !== 'runtime_hours') {
        const today = new Date();
        switch (frequency_type) {
          case 'daily':
            today.setDate(today.getDate() + frequency_value);
            break;
          case 'weekly':
            today.setDate(today.getDate() + frequency_value * 7);
            break;
          case 'monthly':
            today.setMonth(today.getMonth() + frequency_value);
            break;
          case 'quarterly':
            today.setMonth(today.getMonth() + frequency_value * 3);
            break;
          case 'yearly':
            today.setFullYear(today.getFullYear() + frequency_value);
            break;
        }
        nextDueDate = today.toISOString().split('T')[0];
      }

      const result = db
        .prepare(
          `
      INSERT INTO maintenance_schedules (
        asset_id, title, description, frequency_type, frequency_value,
        runtime_hours_trigger, next_due, estimated_duration_minutes,
        assigned_to, checklist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
        )
        .run(
          asset_id,
          title,
          description || null,
          frequency_type,
          frequency_value,
          runtime_hours_trigger || null,
          nextDueDate || null,
          estimated_duration_minutes || null,
          assigned_to || null,
          checklist ? JSON.stringify(checklist) : null
        );

      const newSchedule = db
        .prepare(
          `
      SELECT ms.*, a.asset_code, a.name as asset_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      WHERE ms.id = ?
    `
        )
        .get(result.lastInsertRowid);

      res.status(201).json(newSchedule);
    } catch (error) {
      console.error('Create maintenance schedule error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Generate looped/recurring schedules until end of year
router.post(
  '/schedules/generate-loop',
  auth,
  managerOrAdmin,
  [
    body('asset_id').isInt(),
    body('title').trim().isLength({ min: 3 }),
    body('frequency_type').isIn([
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
    ]),
    body('frequency_value').isInt({ min: 1 }),
    body('start_date').isISO8601(),
    body('end_date').optional().isISO8601(),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        asset_id,
        title,
        description,
        frequency_type,
        frequency_value,
        start_date,
        end_date,
        estimated_duration_minutes,
        assigned_to,
        checklist,
      } = req.body;

      // Verify asset exists
      const asset = db.prepare('SELECT id, asset_code FROM assets WHERE id = ?').get(asset_id) as { id: number; asset_code: string } | undefined;
      if (!asset) {
        res.status(404).json({ error: 'Asset not found.' });
        return;
      }

      // Calculate end date (default: end of current year)
      const endDateObj = end_date 
        ? new Date(end_date) 
        : new Date(new Date().getFullYear(), 11, 31); // December 31 of current year

      // Generate all dates based on frequency
      const dates: string[] = [];
      let currentDate = new Date(start_date);

      while (currentDate <= endDateObj) {
        dates.push(currentDate.toISOString().split('T')[0]);
        
        // Calculate next date based on frequency
        switch (frequency_type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + frequency_value);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + frequency_value * 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + frequency_value);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + frequency_value * 3);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + frequency_value);
            break;
        }
      }

      if (dates.length === 0) {
        res.status(400).json({ error: 'No schedules to generate. Check start and end dates.' });
        return;
      }

      // Limit to prevent too many schedules
      if (dates.length > 365) {
        res.status(400).json({ error: 'Too many schedules to generate. Maximum 365 schedules allowed.' });
        return;
      }

      // Check for existing schedules on same dates to avoid duplicates
      const existingSchedules = db
        .prepare(
          `SELECT next_due FROM maintenance_schedules 
           WHERE asset_id = ? AND next_due IN (${dates.map(() => '?').join(',')}) AND is_active = 1`
        )
        .all(asset_id, ...dates) as { next_due: string }[];

      const existingDates = new Set(existingSchedules.map(s => s.next_due));
      const newDates = dates.filter(d => !existingDates.has(d));

      if (newDates.length === 0) {
        res.status(400).json({ error: 'All schedules already exist for the specified dates.' });
        return;
      }

      // Insert all schedules
      const insertStmt = db.prepare(`
        INSERT INTO maintenance_schedules (
          asset_id, title, description, frequency_type, frequency_value,
          next_due, estimated_duration_minutes, assigned_to, checklist, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      const checklistJson = checklist ? JSON.stringify(checklist) : null;
      const createdIds: number[] = [];

      for (const dueDate of newDates) {
        const result = insertStmt.run(
          asset_id,
          title,
          description || null,
          frequency_type,
          frequency_value,
          dueDate,
          estimated_duration_minutes || null,
          assigned_to || null,
          checklistJson
        );
        createdIds.push(Number(result.lastInsertRowid));
      }

      // Return summary
      res.status(201).json({
        message: `Successfully created ${createdIds.length} schedules`,
        total_created: createdIds.length,
        skipped_duplicates: dates.length - newDates.length,
        dates_created: newDates,
        schedule_ids: createdIds,
        asset_code: asset.asset_code,
        frequency: `${frequency_type} (every ${frequency_value})`,
        date_range: {
          start: newDates[0],
          end: newDates[newDates.length - 1]
        }
      });
    } catch (error) {
      console.error('Generate loop schedules error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update maintenance schedule
router.put('/schedules/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const scheduleId = parseInt(req.params.id);
    const existingSchedule = db
      .prepare('SELECT id FROM maintenance_schedules WHERE id = ?')
      .get(scheduleId);

    if (!existingSchedule) {
      res.status(404).json({ error: 'Maintenance schedule not found.' });
      return;
    }

    const {
      title,
      description,
      frequency_type,
      frequency_value,
      runtime_hours_trigger,
      next_due,
      estimated_duration_minutes,
      assigned_to,
      is_active,
      checklist,
    } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (frequency_type !== undefined) {
      updates.push('frequency_type = ?');
      values.push(frequency_type);
    }
    if (frequency_value !== undefined) {
      updates.push('frequency_value = ?');
      values.push(frequency_value);
    }
    if (runtime_hours_trigger !== undefined) {
      updates.push('runtime_hours_trigger = ?');
      values.push(runtime_hours_trigger || null);
    }
    if (next_due !== undefined) {
      updates.push('next_due = ?');
      values.push(next_due || null);
    }
    if (estimated_duration_minutes !== undefined) {
      updates.push('estimated_duration_minutes = ?');
      values.push(estimated_duration_minutes || null);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to || null);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (checklist !== undefined) {
      updates.push('checklist = ?');
      values.push(checklist ? JSON.stringify(checklist) : null);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(scheduleId);

    db.prepare(`UPDATE maintenance_schedules SET ${updates.join(', ')} WHERE id = ?`).run(
      ...values
    );

    const updatedSchedule = db
      .prepare(
        `
      SELECT ms.*, a.asset_code, a.name as asset_name, u.name as assigned_to_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN users u ON ms.assigned_to = u.id
      WHERE ms.id = ?
    `
      )
      .get(scheduleId);

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Update maintenance schedule error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Generate work order from maintenance schedule
router.post('/schedules/:id/generate-wo', auth, (req: Request, res: Response): void => {
  try {
    const scheduleId = parseInt(req.params.id);
    const schedule = db
      .prepare(
        `
      SELECT ms.*, a.asset_code, a.name as asset_name
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      WHERE ms.id = ?
    `
      )
      .get(scheduleId) as
      | (MaintenanceSchedule & { asset_code: string; asset_name: string })
      | undefined;

    if (!schedule) {
      res.status(404).json({ error: 'Maintenance schedule not found.' });
      return;
    }

    // Generate work order number
    const currentYear = new Date().getFullYear();
    let counter = db
      .prepare('SELECT counter FROM work_order_counter WHERE year = ?')
      .get(currentYear) as { counter: number } | undefined;
    if (!counter) {
      db.prepare('INSERT INTO work_order_counter (year, counter) VALUES (?, 0)').run(currentYear);
      counter = { counter: 0 };
    }
    const newCounter = counter.counter + 1;
    db.prepare('UPDATE work_order_counter SET counter = ? WHERE year = ?').run(
      newCounter,
      currentYear
    );
    const wo_number = `WO-${currentYear}-${String(newCounter).padStart(4, '0')}`;

    // Create work order
    const result = db
      .prepare(
        `
      INSERT INTO work_orders (
        wo_number, asset_id, type, priority, title, description,
        maintenance_schedule_id, assigned_to, scheduled_start
      ) VALUES (?, ?, 'preventive', 'medium', ?, ?, ?, ?, datetime('now'))
    `
      )
      .run(
        wo_number,
        schedule.asset_id,
        `PM: ${schedule.title}`,
        schedule.description || `Preventive maintenance untuk ${schedule.asset_name}`,
        scheduleId,
        schedule.assigned_to || null
      );

    const newWorkOrder = db
      .prepare(
        `
      SELECT wo.*, a.asset_code, a.name as asset_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      WHERE wo.id = ?
    `
      )
      .get(result.lastInsertRowid);

    res.status(201).json(newWorkOrder);
  } catch (error) {
    console.error('Generate work order error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete maintenance schedule
router.delete('/schedules/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const scheduleId = parseInt(req.params.id);

    const existingSchedule = db
      .prepare('SELECT id FROM maintenance_schedules WHERE id = ?')
      .get(scheduleId);
    if (!existingSchedule) {
      res.status(404).json({ error: 'Maintenance schedule not found.' });
      return;
    }

    db.prepare('DELETE FROM maintenance_schedules WHERE id = ?').run(scheduleId);
    res.json({ message: 'Maintenance schedule deleted successfully.' });
  } catch (error) {
    console.error('Delete maintenance schedule error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// Production Schedule
// ============================================

// Get production schedule (calendar view)
router.get('/production-schedule', auth, (req: Request, res: Response): void => {
  try {
    const { asset_id, start_date, end_date } = req.query;

    if (!asset_id) {
      res.status(400).json({ error: 'Asset ID is required.' });
      return;
    }

    const startDateValue = start_date || new Date().toISOString().split('T')[0];
    const endDateValue =
      end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const schedules = db
      .prepare(
        `
      SELECT ps.*, sp.name as shift_name, sp.start_time as shift_start, sp.end_time as shift_end
      FROM production_schedule ps
      LEFT JOIN shift_patterns sp ON ps.shift_pattern_id = sp.id
      WHERE ps.asset_id = ?
      AND ps.date >= ?
      AND ps.date <= ?
      ORDER BY ps.date, sp.start_time
    `
      )
      .all(asset_id, startDateValue, endDateValue);

    res.json(schedules);
  } catch (error) {
    console.error('Get production schedule error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create/Update production schedule entry
router.post(
  '/production-schedule',
  auth,
  managerOrAdmin,
  [
    body('asset_id').isInt(),
    body('date').isISO8601(),
    body('status').isIn(['scheduled', 'no_order', 'holiday', 'maintenance_window']),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        asset_id,
        date,
        shift_pattern_id,
        status,
        planned_start,
        planned_end,
        planned_production_minutes,
        notes,
        product_name,
      } = req.body;

      // Check if entry already exists
      const existing = db
        .prepare(
          `
      SELECT id FROM production_schedule 
      WHERE asset_id = ? AND date = ? AND (shift_pattern_id = ? OR (shift_pattern_id IS NULL AND ? IS NULL))
    `
        )
        .get(asset_id, date, shift_pattern_id || null, shift_pattern_id || null) as
        | { id: number }
        | undefined;

      if (existing) {
        // Update existing entry
        db.prepare(
          `
        UPDATE production_schedule 
        SET status = ?, planned_start = ?, planned_end = ?, 
            planned_production_minutes = ?, notes = ?, product_name = ?
        WHERE id = ?
      `
        ).run(
          status,
          planned_start || null,
          planned_end || null,
          planned_production_minutes || null,
          notes || null,
          product_name || null,
          existing.id
        );

        const updated = db
          .prepare('SELECT * FROM production_schedule WHERE id = ?')
          .get(existing.id);
        res.json(updated);
      } else {
        // Create new entry
        const result = db
          .prepare(
            `
        INSERT INTO production_schedule (
          asset_id, date, shift_pattern_id, status,
          planned_start, planned_end, planned_production_minutes, notes, product_name, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
          )
          .run(
            asset_id,
            date,
            shift_pattern_id || null,
            status,
            planned_start || null,
            planned_end || null,
            planned_production_minutes || null,
            notes || null,
            product_name || null,
            req.user?.id || null
          );

        const newEntry = db
          .prepare('SELECT * FROM production_schedule WHERE id = ?')
          .get(result.lastInsertRowid);
        res.status(201).json(newEntry);
      }
    } catch (error) {
      console.error('Create/Update production schedule error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Bulk create production schedule (for a week/month)
router.post(
  '/production-schedule/bulk',
  auth,
  managerOrAdmin,
  (req: Request, res: Response): void => {
    try {
      const { asset_id, start_date, end_date, pattern } = req.body;

      if (!asset_id || !start_date || !end_date || !pattern) {
        res
          .status(400)
          .json({ error: 'Missing required fields: asset_id, start_date, end_date, pattern' });
        return;
      }

      // pattern is an array of { day_of_week (0-6), shift_pattern_id, status, product_name }
      const startD = new Date(start_date);
      const endD = new Date(end_date);
      let createdCount = 0;

      const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO production_schedule (asset_id, date, shift_pattern_id, status, product_name, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

      for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = d.toISOString().split('T')[0];

        const dayPattern = pattern.find(
          (p: { day_of_week: number }) => p.day_of_week === dayOfWeek
        );
        if (dayPattern) {
          insertStmt.run(
            asset_id,
            dateStr,
            dayPattern.shift_pattern_id || null,
            dayPattern.status || 'scheduled',
            dayPattern.product_name || null,
            req.user?.id || null
          );
          createdCount++;
        }
      }

      res.json({ message: `Created ${createdCount} schedule entries.`, count: createdCount });
    } catch (error) {
      console.error('Bulk create production schedule error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update production schedule entry
router.put(
  '/production-schedule/:id',
  auth,
  managerOrAdmin,
  (req: Request, res: Response): void => {
    try {
      const scheduleId = parseInt(req.params.id);
      const {
        date,
        shift_pattern_id,
        status,
        planned_start,
        planned_end,
        planned_production_minutes,
        product_name,
        notes,
      } = req.body;

      const existing = db
        .prepare('SELECT * FROM production_schedule WHERE id = ?')
        .get(scheduleId);
      if (!existing) {
        res.status(404).json({ error: 'Production schedule entry not found.' });
        return;
      }

      db.prepare(`
        UPDATE production_schedule 
        SET date = ?, shift_pattern_id = ?, status = ?, 
            planned_start = ?, planned_end = ?, planned_production_minutes = ?,
            product_name = ?, notes = ?
        WHERE id = ?
      `).run(
        date,
        shift_pattern_id || null,
        status,
        planned_start || null,
        planned_end || null,
        planned_production_minutes || null,
        product_name || null,
        notes || null,
        scheduleId
      );

      const updated = db
        .prepare('SELECT * FROM production_schedule WHERE id = ?')
        .get(scheduleId);
      res.json(updated);
    } catch (error) {
      console.error('Update production schedule error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Delete production schedule entry
router.delete(
  '/production-schedule/:id',
  auth,
  managerOrAdmin,
  (req: Request, res: Response): void => {
    try {
      const scheduleId = parseInt(req.params.id);

      const existing = db
        .prepare('SELECT id FROM production_schedule WHERE id = ?')
        .get(scheduleId);
      if (!existing) {
        res.status(404).json({ error: 'Production schedule entry not found.' });
        return;
      }

      db.prepare('DELETE FROM production_schedule WHERE id = ?').run(scheduleId);
      res.json({ message: 'Production schedule entry deleted.' });
    } catch (error) {
      console.error('Delete production schedule error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// ============================================
// Shift Patterns
// ============================================

// Get all shift patterns
router.get('/shifts', auth, (_req: Request, res: Response): void => {
  try {
    const shifts = db.prepare('SELECT * FROM shift_patterns ORDER BY start_time').all();
    res.json(shifts);
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create shift pattern
router.post(
  '/shifts',
  auth,
  managerOrAdmin,
  [
    body('name').trim().isLength({ min: 2 }),
    body('start_time').matches(/^\d{2}:\d{2}$/),
    body('end_time').matches(/^\d{2}:\d{2}$/),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, start_time, end_time, break_minutes } = req.body;

      const result = db
        .prepare(
          `
      INSERT INTO shift_patterns (name, start_time, end_time, break_minutes)
      VALUES (?, ?, ?, ?)
    `
        )
        .run(name, start_time, end_time, break_minutes || 60);

      const newShift = db
        .prepare('SELECT * FROM shift_patterns WHERE id = ?')
        .get(result.lastInsertRowid);
      res.status(201).json(newShift);
    } catch (error) {
      console.error('Create shift error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update shift pattern
router.put('/shifts/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const shiftId = parseInt(req.params.id);
    const { name, start_time, end_time, break_minutes, is_active } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (break_minutes !== undefined) {
      updates.push('break_minutes = ?');
      values.push(break_minutes);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    values.push(shiftId);
    db.prepare(`UPDATE shift_patterns SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedShift = db.prepare('SELECT * FROM shift_patterns WHERE id = ?').get(shiftId);
    res.json(updatedShift);
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete shift pattern
router.delete('/shifts/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const shiftId = parseInt(req.params.id);

    // Check if shift is used in production schedules
    const usedInSchedule = db
      .prepare('SELECT COUNT(*) as count FROM production_schedule WHERE shift_pattern_id = ?')
      .get(shiftId) as { count: number };

    if (usedInSchedule.count > 0) {
      res.status(400).json({
        error:
          'Shift ini digunakan di jadwal produksi. Nonaktifkan saja jika tidak ingin digunakan lagi.',
      });
      return;
    }

    db.prepare('DELETE FROM shift_patterns WHERE id = ?').run(shiftId);
    res.json({ message: 'Shift deleted successfully.' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Maintenance calendar view (combines schedules, work orders, downtime)
router.get('/calendar', auth, (req: Request, res: Response): void => {
  try {
    const { start_date, end_date, asset_id } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({ error: 'Start date and end date are required.' });
      return;
    }

    let assetFilter = '';
    const params: unknown[] = [start_date, end_date];

    if (asset_id) {
      assetFilter = ' AND ms.asset_id = ?';
      params.push(asset_id);
    }

    // Get scheduled maintenance
    const scheduledMaintenance = db
      .prepare(
        `
      SELECT ms.id, ms.title, ms.next_due as date, ms.estimated_duration_minutes,
             a.asset_code, a.name as asset_name, 'maintenance' as type
      FROM maintenance_schedules ms
      JOIN assets a ON ms.asset_id = a.id
      WHERE ms.is_active = 1 
      AND ms.next_due >= ? AND ms.next_due <= ?
      ${assetFilter}
      ORDER BY ms.next_due
    `
      )
      .all(...params);

    // Get work orders
    let woAssetFilter = '';
    const woParams: unknown[] = [start_date, end_date];
    if (asset_id) {
      woAssetFilter = ' AND wo.asset_id = ?';
      woParams.push(asset_id);
    }

    const workOrders = db
      .prepare(
        `
      SELECT wo.id, wo.wo_number, wo.title, wo.scheduled_start as date, wo.type, wo.status,
             a.asset_code, a.name as asset_name, 'work_order' as event_type
      FROM work_orders wo
      JOIN assets a ON wo.asset_id = a.id
      WHERE (wo.scheduled_start >= ? AND wo.scheduled_start <= ?)
      OR (wo.actual_start >= ? AND wo.actual_start <= ?)
      ${woAssetFilter}
      ORDER BY wo.scheduled_start
    `
      )
      .all(start_date, end_date, start_date, end_date, ...(asset_id ? [asset_id] : []));

    res.json({
      scheduledMaintenance,
      workOrders,
    });
  } catch (error) {
    console.error('Get maintenance calendar error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
