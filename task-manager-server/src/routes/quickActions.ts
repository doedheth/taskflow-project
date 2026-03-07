import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth, managerOrAdmin } from '../middleware/auth';

const router = express.Router();

interface QuickAction {
  id: number;
  label: string;
  icon: string;
  color: string;
  classification_code: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Get all quick actions (active only by default)
router.get('/', auth, (req: Request, res: Response): void => {
  try {
    const { include_inactive } = req.query;

    let sql = `
      SELECT qa.*, dc.name as classification_name, dc.description as classification_description
      FROM production_quick_actions qa
      LEFT JOIN downtime_classifications dc ON qa.classification_code = dc.code
    `;

    if (include_inactive !== 'true') {
      sql += ' WHERE qa.is_active = 1';
    }

    sql += ' ORDER BY qa.sort_order ASC, qa.id ASC';

    const quickActions = db.prepare(sql).all();
    res.json(quickActions);
  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get single quick action
router.get('/:id', auth, (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id);

    const quickAction = db
      .prepare(
        `
      SELECT qa.*, dc.name as classification_name
      FROM production_quick_actions qa
      LEFT JOIN downtime_classifications dc ON qa.classification_code = dc.code
      WHERE qa.id = ?
    `
      )
      .get(id);

    if (!quickAction) {
      res.status(404).json({ error: 'Quick action not found.' });
      return;
    }

    res.json(quickAction);
  } catch (error) {
    console.error('Get quick action error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create quick action (manager/admin only)
router.post(
  '/',
  auth,
  managerOrAdmin,
  [
    body('label').notEmpty().withMessage('Label is required'),
    body('classification_code').notEmpty().withMessage('Classification code is required'),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { label, icon, color, classification_code, sort_order } = req.body;

      // Verify classification exists
      const classification = db
        .prepare('SELECT code FROM downtime_classifications WHERE code = ?')
        .get(classification_code);

      if (!classification) {
        res.status(400).json({ error: 'Invalid classification code.' });
        return;
      }

      // Get max sort order if not provided
      let finalSortOrder = sort_order;
      if (finalSortOrder === undefined) {
        const maxOrder = db
          .prepare('SELECT MAX(sort_order) as max_order FROM production_quick_actions')
          .get() as { max_order: number | null };
        finalSortOrder = (maxOrder?.max_order || 0) + 1;
      }

      const result = db
        .prepare(
          `
      INSERT INTO production_quick_actions (label, icon, color, classification_code, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `
        )
        .run(
          label,
          icon || '⚡',
          color || 'bg-blue-500 hover:bg-blue-600',
          classification_code,
          finalSortOrder
        );

      const newAction = db
        .prepare(
          `
      SELECT qa.*, dc.name as classification_name
      FROM production_quick_actions qa
      LEFT JOIN downtime_classifications dc ON qa.classification_code = dc.code
      WHERE qa.id = ?
    `
        )
        .get(result.lastInsertRowid);

      res.status(201).json(newAction);
    } catch (error) {
      console.error('Create quick action error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update quick action (manager/admin only)
router.put('/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { label, icon, color, classification_code, sort_order, is_active } = req.body;

    const existingAction = db
      .prepare('SELECT id FROM production_quick_actions WHERE id = ?')
      .get(id);

    if (!existingAction) {
      res.status(404).json({ error: 'Quick action not found.' });
      return;
    }

    // Verify classification if provided
    if (classification_code) {
      const classification = db
        .prepare('SELECT code FROM downtime_classifications WHERE code = ?')
        .get(classification_code);

      if (!classification) {
        res.status(400).json({ error: 'Invalid classification code.' });
        return;
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (label !== undefined) {
      updates.push('label = ?');
      values.push(label);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (classification_code !== undefined) {
      updates.push('classification_code = ?');
      values.push(classification_code);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(sort_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE production_quick_actions SET ${updates.join(', ')} WHERE id = ?`).run(
      ...values
    );

    const updatedAction = db
      .prepare(
        `
      SELECT qa.*, dc.name as classification_name
      FROM production_quick_actions qa
      LEFT JOIN downtime_classifications dc ON qa.classification_code = dc.code
      WHERE qa.id = ?
    `
      )
      .get(id);

    res.json(updatedAction);
  } catch (error) {
    console.error('Update quick action error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete quick action (manager/admin only)
router.delete('/:id', auth, managerOrAdmin, (req: Request, res: Response): void => {
  try {
    const id = parseInt(req.params.id);

    const existingAction = db
      .prepare('SELECT id FROM production_quick_actions WHERE id = ?')
      .get(id);

    if (!existingAction) {
      res.status(404).json({ error: 'Quick action not found.' });
      return;
    }

    db.prepare('DELETE FROM production_quick_actions WHERE id = ?').run(id);

    res.json({ message: 'Quick action deleted successfully.' });
  } catch (error) {
    console.error('Delete quick action error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Reorder quick actions (manager/admin only)
router.post(
  '/reorder',
  auth,
  managerOrAdmin,
  [body('order').isArray().withMessage('Order must be an array')],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { order } = req.body as { order: { id: number; sort_order: number }[] };

      order.forEach(({ id, sort_order }) => {
        db.prepare(
          'UPDATE production_quick_actions SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(sort_order, id);
      });

      const quickActions = db
        .prepare(
          `
      SELECT qa.*, dc.name as classification_name
      FROM production_quick_actions qa
      LEFT JOIN downtime_classifications dc ON qa.classification_code = dc.code
      ORDER BY qa.sort_order ASC
    `
        )
        .all();

      res.json(quickActions);
    } catch (error) {
      console.error('Reorder quick actions error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

export default router;
