import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../database/db';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest, Comment } from '../types';

const router = express.Router();

interface TicketInfo {
  id: number;
  ticket_key: string;
  title: string;
  reporter_id: number;
}

interface AssigneeInfo {
  user_id: number;
}

// Helper to create notification
const createNotification = (
  userId: number,
  type: string,
  title: string,
  message: string,
  ticketId: number,
  ticketKey: string,
  actorId: number,
  actorName: string
): void => {
  try {
    // Don't notify yourself
    if (userId === actorId) return;

    db.prepare(
      `
      INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(userId, type, title, message, ticketId, ticketKey, actorId, actorName);
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Add comment to ticket
router.post(
  '/:ticketId',
  auth,
  [body('content').trim().isLength({ min: 1 })],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const ticketId = parseInt(req.params.ticketId);
      const { content } = req.body;

      // Check if ticket exists and get details for notification
      const ticket = db
        .prepare('SELECT id, ticket_key, title, reporter_id FROM tickets WHERE id = ?')
        .get(ticketId) as TicketInfo | undefined;
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }

      const result = db
        .prepare(
          `
      INSERT INTO comments (content, ticket_id, user_id)
      VALUES (?, ?, ?)
    `
        )
        .run(content, ticketId, req.user.id);

      // Log activity
      db.prepare(
        `
      INSERT INTO activity_log (action, entity_type, entity_id, user_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
      ).run(
        'commented',
        'ticket',
        ticketId,
        req.user.id,
        JSON.stringify({ comment_id: result.lastInsertRowid })
      );

      // Notify reporter
      createNotification(
        ticket.reporter_id,
        'comment',
        'New Comment',
        `${req.user.name} commented on ${ticket.ticket_key}: ${ticket.title}`,
        ticketId,
        ticket.ticket_key,
        req.user.id,
        req.user.name
      );

      // Notify all assignees
      const assignees = db
        .prepare(
          `
      SELECT user_id FROM ticket_assignees WHERE ticket_id = ?
    `
        )
        .all(ticketId) as AssigneeInfo[];

      assignees.forEach(assignee => {
        createNotification(
          assignee.user_id,
          'comment',
          'New Comment',
          `${req.user.name} commented on ${ticket.ticket_key}: ${ticket.title}`,
          ticketId,
          ticket.ticket_key,
          req.user.id,
          req.user.name
        );
      });

      // Get created comment
      const comment = db
        .prepare(
          `
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `
        )
        .get(result.lastInsertRowid) as Comment;

      res.status(201).json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Update comment
router.put(
  '/:id',
  auth,
  [body('content').trim().isLength({ min: 1 })],
  (req: Request, res: Response): void => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const commentId = parseInt(req.params.id);
      const { content } = req.body;

      // Check if comment exists and user owns it
      const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as
        | Comment
        | undefined;
      if (!comment) {
        res.status(404).json({ error: 'Comment not found.' });
        return;
      }

      if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      db.prepare(
        'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(content, commentId);

      // Get updated comment
      const updatedComment = db
        .prepare(
          `
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `
        )
        .get(commentId) as Comment;

      res.json(updatedComment);
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

// Delete comment
router.delete('/:id', auth, (req: Request, res: Response): void => {
  try {
    const commentId = parseInt(req.params.id);

    // Check if comment exists and user owns it
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as
      | Comment
      | undefined;
    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
