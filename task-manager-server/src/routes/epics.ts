import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest, Ticket, Comment } from '../types';

const router = express.Router();

interface EpicWithProgress extends Ticket {
  total_children: number;
  done_children: number;
  progress: number;
}

interface TicketCounter {
  counter: number;
}

// Get all epics with progress
router.get('/', auth, (_req: Request, res: Response): void => {
  try {
    const epics = db
      .prepare(
        `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color,
             (SELECT COUNT(*) FROM tickets WHERE epic_id = t.id) as total_children,
             (SELECT COUNT(*) FROM tickets WHERE epic_id = t.id AND status = 'done') as done_children
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.type = 'epic'
      ORDER BY t.created_at DESC
    `
      )
      .all() as EpicWithProgress[];

    // Calculate progress for each epic
    const epicsWithProgress = epics.map(epic => ({
      ...epic,
      progress:
        epic.total_children > 0 ? Math.round((epic.done_children / epic.total_children) * 100) : 0,
    }));

    res.json(epicsWithProgress);
  } catch (error) {
    console.error('Get epics error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get epic by ID with children
router.get('/:id', auth, (req: Request, res: Response): void => {
  try {
    const epic = db
      .prepare(
        `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.email as reporter_email, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.email as assignee_email, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = ? AND t.type = 'epic'
    `
      )
      .get(req.params.id) as Ticket | undefined;

    if (!epic) {
      res.status(404).json({ error: 'Epic not found.' });
      return;
    }

    // Get child tickets
    const children = db
      .prepare(
        `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.epic_id = ?
      ORDER BY 
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'review' THEN 3
          WHEN 'done' THEN 4
        END,
        t.created_at DESC
    `
      )
      .all(req.params.id) as Ticket[];

    // Calculate progress
    const totalChildren = children.length;
    const doneChildren = children.filter(c => c.status === 'done').length;
    const progress = totalChildren > 0 ? Math.round((doneChildren / totalChildren) * 100) : 0;

    // Get status breakdown
    const statusBreakdown = {
      todo: children.filter(c => c.status === 'todo').length,
      in_progress: children.filter(c => c.status === 'in_progress').length,
      review: children.filter(c => c.status === 'review').length,
      done: doneChildren,
    };

    // Get comments
    const comments = db
      .prepare(
        `
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `
      )
      .all(req.params.id) as Comment[];

    res.json({
      ...epic,
      children,
      totalChildren,
      doneChildren,
      progress,
      statusBreakdown,
      comments,
    });
  } catch (error) {
    console.error('Get epic error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create epic
router.post(
  '/',
  auth,
  [
    body('title').trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('assignee_id').optional().isInt(),
    body('department_id').optional().isInt(),
    body('due_date').optional().isISO8601(),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, description, priority, assignee_id, department_id, due_date } = req.body;

      // Generate ticket key
      db.prepare('UPDATE ticket_counter SET counter = counter + 1 WHERE id = 1').run();
      const counter = db
        .prepare('SELECT counter FROM ticket_counter WHERE id = 1')
        .get() as TicketCounter;
      const ticket_key = `TM-${counter.counter}`;

      const result = db
        .prepare(
          `
      INSERT INTO tickets (ticket_key, title, description, type, priority, reporter_id, assignee_id, department_id, due_date)
      VALUES (?, ?, ?, 'epic', ?, ?, ?, ?, ?)
    `
        )
        .run(
          ticket_key,
          title,
          description || null,
          priority || 'medium',
          req.user.id,
          assignee_id || null,
          department_id || null,
          due_date || null
        );

      // Log activity
      db.prepare(
        `
      INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
      ).run('created', 'epic', result.lastInsertRowid, req.user.id, JSON.stringify({ title }));

      // Get created epic
      const epic = db
        .prepare(
          `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = ?
    `
        )
        .get(result.lastInsertRowid) as Ticket;

      res.status(201).json({ ...epic, progress: 0, totalChildren: 0, doneChildren: 0 });
    } catch (error) {
      console.error('Create epic error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Add ticket to epic
router.post(
  '/:id/tickets',
  auth,
  [body('ticket_id').isInt()],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const epicId = parseInt(req.params.id);
      const { ticket_id } = req.body;

      // Check if epic exists
      const epic = db
        .prepare('SELECT id FROM tickets WHERE id = ? AND type = ?')
        .get(epicId, 'epic');
      if (!epic) {
        res.status(404).json({ error: 'Epic not found.' });
        return;
      }

      // Check if ticket exists and is not an epic
      const ticket = db.prepare('SELECT id, type FROM tickets WHERE id = ?').get(ticket_id) as
        | { id: number; type: string }
        | undefined;
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      if (ticket.type === 'epic') {
        res.status(400).json({ error: 'Cannot add an epic to another epic.' });
        return;
      }

      // Update ticket's epic_id
      db.prepare('UPDATE tickets SET epic_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        epicId,
        ticket_id
      );

      res.json({ message: 'Ticket added to epic successfully.' });
    } catch (error) {
      console.error('Add ticket to epic error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Remove ticket from epic
router.delete('/:id/tickets/:ticketId', auth, (req: Request, res: Response): void => {
  try {
    const epicId = parseInt(req.params.id);
    const ticketId = parseInt(req.params.ticketId);

    // Check if ticket is in this epic
    const ticket = db
      .prepare('SELECT id FROM tickets WHERE id = ? AND epic_id = ?')
      .get(ticketId, epicId);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found in this epic.' });
      return;
    }

    // Remove from epic
    db.prepare(
      'UPDATE tickets SET epic_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(ticketId);

    res.json({ message: 'Ticket removed from epic successfully.' });
  } catch (error) {
    console.error('Remove ticket from epic error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get available tickets to add to epic (not in any epic and not epics themselves)
router.get('/:id/available-tickets', auth, (req: Request, res: Response): void => {
  try {
    const epicId = parseInt(req.params.id);

    const tickets = db
      .prepare(
        `
      SELECT t.id, t.ticket_key, t.title, t.type, t.status, t.priority,
             assignee.name as assignee_name
      FROM tickets t
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      WHERE t.type != 'epic' AND (t.epic_id IS NULL OR t.epic_id != ?)
      ORDER BY t.created_at DESC
    `
      )
      .all(epicId);

    res.json(tickets);
  } catch (error) {
    console.error('Get available tickets error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
