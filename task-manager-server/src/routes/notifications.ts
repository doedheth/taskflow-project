import express, { Request, Response } from 'express';
import db from '../database/db';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest, Notification } from '../types';

const router = express.Router();

interface CountResult {
  count: number;
}

interface NotificationWithActor extends Notification {
  actor_avatar: string | null;
}

// Get notifications for current user
router.get('/', auth, (req: Request, res: Response): void => {
  try {
    const { limit = '20', unread_only } = req.query;

    let sql = `
      SELECT n.*, 
             actor.avatar as actor_avatar
      FROM notifications n
      LEFT JOIN users actor ON n.actor_id = actor.id
      WHERE n.user_id = ?
    `;
    const params: unknown[] = [req.user.id];

    if (unread_only === 'true') {
      sql += ' AND n.is_read = 0';
    }

    sql += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const notifications = db.prepare(sql).all(...params) as NotificationWithActor[];

    // Get unread count
    const unreadCount = db
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(req.user.id) as CountResult;

    res.json({
      notifications,
      unreadCount: unreadCount.count,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get unread count only
router.get('/unread-count', auth, (req: Request, res: Response): void => {
  try {
    const result = db
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(req.user.id) as CountResult;

    res.json({ count: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, (req: Request, res: Response): void => {
  try {
    const notificationId = parseInt(req.params.id);

    // Verify ownership
    const notification = db
      .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
      .get(notificationId, req.user.id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Mark all notifications as read
router.patch('/read-all', auth, (req: Request, res: Response): void => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete a notification
router.delete('/:id', auth, (req: Request, res: Response): void => {
  try {
    const notificationId = parseInt(req.params.id);

    // Verify ownership
    const notification = db
      .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
      .get(notificationId, req.user.id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);

    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Clear all notifications
router.delete('/', auth, (req: Request, res: Response): void => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);

    res.json({ message: 'All notifications cleared.' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Helper function to create notification (used by other routes)
export const createNotification = (
  userId: number,
  type: string,
  title: string,
  message: string,
  ticketId: number | null,
  ticketKey: string | null,
  actorId: number,
  actorName: string
): void => {
  try {
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

export default router;
