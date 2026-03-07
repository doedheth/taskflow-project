import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth, adminOnly, managerOrAdmin } from '../middleware/auth';
import { AuthenticatedRequest, Department, User } from '../types';

const router = express.Router();

interface DepartmentWithCount extends Department {
  member_count: number;
}

// Get all departments
router.get('/', (_req: Request, res: Response): void => {
  try {
    console.log('GET /api/departments request received');
    const departments = db
      .prepare(
        `
      SELECT d.*,
             COUNT(u.id) as member_count
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `
      )
      .all() as DepartmentWithCount[];

    console.log(`Returning ${departments.length} departments`);
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get department by ID with members
router.get('/:id', auth, (req: Request, res: Response): void => {
  try {
    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id) as
      | Department
      | undefined;

    if (!department) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    // Get members
    const members = db
      .prepare(
        `
      SELECT id, email, name, avatar, role, created_at
      FROM users
      WHERE department_id = ?
      ORDER BY name ASC
    `
      )
      .all(req.params.id) as User[];

    res.json({ ...department, members });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create department (admin/manager only)
router.post(
  '/',
  auth,
  managerOrAdmin,
  [
    body('name').trim().isLength({ min: 2 }),
    body('description').optional().trim(),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, color } = req.body;

      // Check if department exists
      const existing = db.prepare('SELECT id FROM departments WHERE name = ?').get(name);
      if (existing) {
        res.status(400).json({ error: 'Department already exists.' });
        return;
      }

      const result = db
        .prepare(
          `
      INSERT INTO departments (name, description, color)
      VALUES (?, ?, ?)
    `
        )
        .run(name, description || null, color || '#3B82F6');

      const department = db
        .prepare('SELECT * FROM departments WHERE id = ?')
        .get(result.lastInsertRowid) as Department;

      res.status(201).json(department);
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update department (admin/manager only)
router.put(
  '/:id',
  auth,
  managerOrAdmin,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('description').optional().trim(),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, color } = req.body;
      const deptId = parseInt(req.params.id);

      // Check if name already exists
      if (name) {
        const existing = db
          .prepare('SELECT id FROM departments WHERE name = ? AND id != ?')
          .get(name, deptId);
        if (existing) {
          res.status(400).json({ error: 'Department name already exists.' });
          return;
        }
      }

      // Build update query
      const updates: string[] = [];
      const values: unknown[] = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (color) {
        updates.push('color = ?');
        values.push(color);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update.' });
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(deptId);

      db.prepare(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const department = db
        .prepare('SELECT * FROM departments WHERE id = ?')
        .get(deptId) as Department;

      res.json(department);
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Delete department (admin only)
router.delete('/:id', auth, adminOnly, (req: Request, res: Response): void => {
  try {
    const deptId = parseInt(req.params.id);

    const result = db.prepare('DELETE FROM departments WHERE id = ?').run(deptId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    res.json({ message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
