import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest, Sprint, Ticket } from '../types';

const router = express.Router();

interface SprintWithStats extends Sprint {
  total_tickets: number;
  completed_tickets: number;
  total_points: number;
  completed_points: number;
  progress?: number;
}

interface CountResult {
  count: number;
}

interface TicketId {
  id: number;
}

// Get all sprints with statistics
router.get('/', auth, (_req: Request, res: Response): void => {
  try {
    const sprints = db
      .prepare(
        `
      SELECT s.*,
             (SELECT COUNT(*) FROM tickets WHERE sprint_id = s.id) as total_tickets,
             (SELECT COUNT(*) FROM tickets WHERE sprint_id = s.id AND status = 'done') as completed_tickets,
             (SELECT COALESCE(SUM(story_points), 0) FROM tickets WHERE sprint_id = s.id) as total_points,
             (SELECT COALESCE(SUM(story_points), 0) FROM tickets WHERE sprint_id = s.id AND status = 'done') as completed_points
      FROM sprints s
      ORDER BY 
        CASE s.status
          WHEN 'active' THEN 1
          WHEN 'planning' THEN 2
          WHEN 'completed' THEN 3
        END,
        s.start_date DESC
    `
      )
      .all() as SprintWithStats[];

    // Calculate progress for each sprint
    const sprintsWithProgress = sprints.map(sprint => ({
      ...sprint,
      progress:
        sprint.total_points > 0
          ? Math.round((sprint.completed_points / sprint.total_points) * 100)
          : 0,
    }));

    res.json(sprintsWithProgress);
  } catch (error) {
    console.error('Get sprints error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get sprint by ID with tickets
router.get('/:id', auth, (req: Request, res: Response): void => {
  try {
    const sprint = db
      .prepare(
        `
      SELECT s.*,
             (SELECT COUNT(*) FROM tickets WHERE sprint_id = s.id) as total_tickets,
             (SELECT COUNT(*) FROM tickets WHERE sprint_id = s.id AND status = 'done') as completed_tickets,
             (SELECT COALESCE(SUM(story_points), 0) FROM tickets WHERE sprint_id = s.id) as total_points,
             (SELECT COALESCE(SUM(story_points), 0) FROM tickets WHERE sprint_id = s.id AND status = 'done') as completed_points
      FROM sprints s
      WHERE s.id = ?
    `
      )
      .get(req.params.id) as SprintWithStats | undefined;

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    // Get tickets in this sprint
    const tickets = db
      .prepare(
        `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color,
             epic.ticket_key as epic_key, epic.title as epic_title
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN tickets epic ON t.epic_id = epic.id
      WHERE t.sprint_id = ?
      ORDER BY 
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'review' THEN 3
          WHEN 'done' THEN 4
        END,
        t.priority DESC,
        t.created_at DESC
    `
      )
      .all(req.params.id) as Ticket[];

    // Get status breakdown
    const statusBreakdown = {
      todo: tickets.filter(t => t.status === 'todo'),
      in_progress: tickets.filter(t => t.status === 'in_progress'),
      review: tickets.filter(t => t.status === 'review'),
      done: tickets.filter(t => t.status === 'done'),
    };

    // Calculate points by status
    const pointsByStatus = {
      todo: statusBreakdown.todo.reduce((sum, t) => sum + (t.story_points || 0), 0),
      in_progress: statusBreakdown.in_progress.reduce((sum, t) => sum + (t.story_points || 0), 0),
      review: statusBreakdown.review.reduce((sum, t) => sum + (t.story_points || 0), 0),
      done: statusBreakdown.done.reduce((sum, t) => sum + (t.story_points || 0), 0),
    };

    res.json({
      ...sprint,
      progress:
        sprint.total_points > 0
          ? Math.round((sprint.completed_points / sprint.total_points) * 100)
          : 0,
      tickets,
      statusBreakdown,
      pointsByStatus,
    });
  } catch (error) {
    console.error('Get sprint error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create sprint
router.post(
  '/',
  auth,
  [
    body('name').trim().isLength({ min: 2 }),
    body('goal').optional().trim(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Only admin/manager can create sprints
      if (req.user.role === 'member') {
        res.status(403).json({ error: 'Access denied. Only managers can create sprints.' });
        return;
      }

      const { name, goal, start_date, end_date } = req.body;

      const result = db
        .prepare(
          `
      INSERT INTO sprints (name, goal, start_date, end_date)
      VALUES (?, ?, ?, ?)
    `
        )
        .run(name, goal || null, start_date || null, end_date || null);

      // Log activity
      db.prepare(
        `
      INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
      ).run('created', 'sprint', result.lastInsertRowid, req.user.id, JSON.stringify({ name }));

      const sprint = db
        .prepare('SELECT * FROM sprints WHERE id = ?')
        .get(result.lastInsertRowid) as Sprint;
      res.status(201).json(sprint);
    } catch (error) {
      console.error('Create sprint error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update sprint
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('goal').optional().trim(),
    body('start_date').optional(),
    body('end_date').optional(),
    body('status').optional().isIn(['planning', 'active', 'completed']),
  ],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Only admin/manager can update sprints
      if (req.user.role === 'member') {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      const sprintId = parseInt(req.params.id);
      const { name, goal, start_date, end_date, status } = req.body;

      // Check if sprint exists
      const existing = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as
        | Sprint
        | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Sprint not found.' });
        return;
      }

      // If setting to active, check there's no other active sprint
      if (status === 'active' && existing.status !== 'active') {
        const activeSprint = db
          .prepare('SELECT id FROM sprints WHERE status = ? AND id != ?')
          .get('active', sprintId);
        if (activeSprint) {
          res.status(400).json({ error: 'There is already an active sprint. Complete it first.' });
          return;
        }
      }

      // Build update query
      const updates: string[] = [];
      const values: unknown[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (goal !== undefined) {
        updates.push('goal = ?');
        values.push(goal);
      }
      if (start_date !== undefined) {
        updates.push('start_date = ?');
        values.push(start_date || null);
      }
      if (end_date !== undefined) {
        updates.push('end_date = ?');
        values.push(end_date || null);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update.' });
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(sprintId);

      db.prepare(`UPDATE sprints SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as Sprint;
      res.json(sprint);
    } catch (error) {
      console.error('Update sprint error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Start sprint - with auto-migration of incomplete tickets from last completed sprint
router.post('/:id/start', auth, (req: Request, res: Response): void => {
  try {
    if (req.user.role === 'member') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const sprintId = parseInt(req.params.id);
    const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as
      | Sprint
      | undefined;

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    if (sprint.status !== 'planning') {
      res.status(400).json({ error: 'Sprint is not in planning status.' });
      return;
    }

    // Check for existing active sprint
    const activeSprint = db.prepare('SELECT id FROM sprints WHERE status = ?').get('active');
    if (activeSprint) {
      res.status(400).json({ error: 'There is already an active sprint.' });
      return;
    }

    // Find the most recently completed sprint
    const lastCompletedSprint = db
      .prepare(
        `
      SELECT id FROM sprints 
      WHERE status = 'completed' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `
      )
      .get() as { id: number } | undefined;

    let migratedTicketsCount = 0;

    // Auto-migrate incomplete tickets from last completed sprint
    if (lastCompletedSprint) {
      // Get incomplete tickets from last completed sprint
      const incompleteTickets = db
        .prepare(
          `
        SELECT id FROM tickets 
        WHERE sprint_id = ? AND status != 'done'
      `
        )
        .all(lastCompletedSprint.id) as TicketId[];

      if (incompleteTickets.length > 0) {
        // Move incomplete tickets to new sprint
        const ticketIds = incompleteTickets.map(t => t.id);
        db.prepare(
          `
          UPDATE tickets 
          SET sprint_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id IN (${ticketIds.join(',')})
        `
        ).run(sprintId);

        migratedTicketsCount = incompleteTickets.length;

        // Log migration activity
        db.prepare(
          `
          INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
          VALUES (?, ?, ?, ?, ?)
        `
        ).run(
          'tickets_migrated',
          'sprint',
          sprintId,
          req.user.id,
          JSON.stringify({
            from_sprint_id: lastCompletedSprint.id,
            ticket_count: migratedTicketsCount,
            ticket_ids: ticketIds,
          })
        );
      }
    }

    // Start the sprint
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      `
      UPDATE sprints 
      SET status = 'active', start_date = COALESCE(start_date, ?), updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
    ).run(today, sprintId);

    // Log sprint start
    db.prepare(
      `
      INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run('sprint_started', 'sprint', sprintId, req.user.id, JSON.stringify({ name: sprint.name }));

    const updatedSprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as Sprint;

    // Get updated ticket count
    const ticketCount = db
      .prepare('SELECT COUNT(*) as count FROM tickets WHERE sprint_id = ?')
      .get(sprintId) as CountResult;

    res.json({
      ...updatedSprint,
      migrated_tickets: migratedTicketsCount,
      total_tickets: ticketCount.count,
      message:
        migratedTicketsCount > 0
          ? `Sprint dimulai! ${migratedTicketsCount} tiket dari sprint sebelumnya dipindahkan.`
          : 'Sprint dimulai!',
    });
  } catch (error) {
    console.error('Start sprint error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Complete sprint
router.post('/:id/complete', auth, (req: Request, res: Response): void => {
  try {
    if (req.user.role === 'member') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const sprintId = parseInt(req.params.id);
    const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as
      | Sprint
      | undefined;

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    if (sprint.status !== 'active') {
      res.status(400).json({ error: 'Sprint is not active.' });
      return;
    }

    // Get incomplete tickets count before completing
    const incompleteTickets = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets 
      WHERE sprint_id = ? AND status != 'done'
    `
      )
      .get(sprintId) as CountResult;

    // Complete the sprint
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      `
      UPDATE sprints 
      SET status = 'completed', end_date = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
    ).run(today, sprintId);

    // Option to move incomplete tickets to backlog immediately
    const { moveToBacklog } = req.body;
    let movedToBacklog = 0;

    if (moveToBacklog === true) {
      const result = db
        .prepare(
          `
        UPDATE tickets 
        SET sprint_id = NULL, updated_at = CURRENT_TIMESTAMP 
        WHERE sprint_id = ? AND status != 'done'
      `
        )
        .run(sprintId);
      movedToBacklog = result.changes;
    }

    // Log activity
    db.prepare(
      `
      INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(
      'sprint_completed',
      'sprint',
      sprintId,
      req.user.id,
      JSON.stringify({
        name: sprint.name,
        incomplete_tickets: incompleteTickets.count,
        moved_to_backlog: movedToBacklog,
      })
    );

    const updatedSprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as Sprint;

    res.json({
      ...updatedSprint,
      incomplete_tickets: incompleteTickets.count,
      moved_to_backlog: movedToBacklog,
      message:
        incompleteTickets.count > 0 && !moveToBacklog
          ? `Sprint selesai! ${incompleteTickets.count} tiket belum selesai akan otomatis dipindahkan ke sprint berikutnya.`
          : 'Sprint selesai!',
    });
  } catch (error) {
    console.error('Complete sprint error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete sprint
router.delete('/:id', auth, (req: Request, res: Response): void => {
  try {
    if (req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Only admins can delete sprints.' });
      return;
    }

    const sprintId = parseInt(req.params.id);
    const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId) as
      | Sprint
      | undefined;

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found.' });
      return;
    }

    if (sprint.status === 'active') {
      res.status(400).json({ error: 'Cannot delete an active sprint. Complete it first.' });
      return;
    }

    // Remove sprint reference from tickets
    db.prepare('UPDATE tickets SET sprint_id = NULL WHERE sprint_id = ?').run(sprintId);

    // Delete sprint
    db.prepare('DELETE FROM sprints WHERE id = ?').run(sprintId);

    res.json({ message: 'Sprint deleted successfully.' });
  } catch (error) {
    console.error('Delete sprint error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Add ticket to sprint
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

      const sprintId = parseInt(req.params.id);
      const { ticket_id } = req.body;

      // Check sprint exists
      const sprint = db.prepare('SELECT * FROM sprints WHERE id = ?').get(sprintId);
      if (!sprint) {
        res.status(404).json({ error: 'Sprint not found.' });
        return;
      }

      // Check ticket exists and is not an epic
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket_id) as
        | Ticket
        | undefined;
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      if (ticket.type === 'epic') {
        res.status(400).json({ error: 'Cannot add epic to sprint.' });
        return;
      }

      // Add to sprint
      db.prepare(
        'UPDATE tickets SET sprint_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(sprintId, ticket_id);

      res.json({ message: 'Ticket added to sprint.' });
    } catch (error) {
      console.error('Add ticket to sprint error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Remove ticket from sprint
router.delete('/:id/tickets/:ticketId', auth, (req: Request, res: Response): void => {
  try {
    const sprintId = parseInt(req.params.id);
    const ticketId = parseInt(req.params.ticketId);

    // Check ticket is in sprint
    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ? AND sprint_id = ?')
      .get(ticketId, sprintId);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found in this sprint.' });
      return;
    }

    // Remove from sprint
    db.prepare(
      'UPDATE tickets SET sprint_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(ticketId);

    res.json({ message: 'Ticket removed from sprint.' });
  } catch (error) {
    console.error('Remove ticket from sprint error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get backlog tickets (not in any sprint)
router.get('/backlog/tickets', auth, (_req: Request, res: Response): void => {
  try {
    const tickets = db
      .prepare(
        `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             assignee.name as assignee_name, assignee.avatar as assignee_avatar,
             d.name as department_name, d.color as department_color,
             epic.ticket_key as epic_key, epic.title as epic_title
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN users assignee ON t.assignee_id = assignee.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN tickets epic ON t.epic_id = epic.id
      WHERE t.sprint_id IS NULL AND t.type != 'epic'
      ORDER BY t.priority DESC, t.created_at DESC
    `
      )
      .all() as Ticket[];

    res.json(tickets);
  } catch (error) {
    console.error('Get backlog error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
