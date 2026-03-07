/**
 * Express type extensions
 * Extends the Express Request interface to include user property
 */

declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      email: string;
      role: 'admin' | 'manager' | 'supervisor' | 'technician' | 'operator' | 'member';
      name: string;
      department_id?: number | null;
    };
  }
}
