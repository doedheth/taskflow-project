import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/db';
import { User, AuthenticatedRequest } from '../types';

interface DecodedToken {
  userId: number;
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as DecodedToken;

    const user = db
      .prepare('SELECT id, email, name, role, department_id FROM users WHERE id = ?')
      .get(decoded.userId) as User | undefined;

    if (!user) {
      res.status(401).json({ error: 'Invalid token. User not found.' });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'TokenExpiredError'
    ) {
      res.status(401).json({ error: 'Token expired.' });
      return;
    }
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!(req as AuthenticatedRequest).user || (req as AuthenticatedRequest).user?.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Admin only.' });
    return;
  }
  next();
};

export const managerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || !['admin', 'manager'].includes(user.role)) {
    res.status(403).json({ error: 'Access denied. Manager or Admin only.' });
    return;
  }
  next();
};

export const supervisorOrAbove = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || !['admin', 'manager', 'supervisor'].includes(user.role)) {
    res.status(403).json({ error: 'Access denied. Supervisor or above only.' });
    return;
  }
  next();
};

export default { auth, adminOnly, managerOrAdmin, supervisorOrAbove };
