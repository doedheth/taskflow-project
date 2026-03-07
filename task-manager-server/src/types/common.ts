/**
 * Common TypeScript interfaces and types
 */

import { Request, Response, NextFunction } from 'express';

// ============================================
// Request Types
// ============================================

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'admin' | 'manager' | 'supervisor' | 'technician' | 'operator' | 'member';
  name: string;
  department_id?: number | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Filter Types
// ============================================

export interface BaseFilter {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ msg: string; path: string }>;
}

// ============================================
// Controller Types
// ============================================

export type ControllerMethod = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

// ============================================
// Database Types
// ============================================

export interface DatabaseResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DBRunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DBStatement {
  run: (...params: unknown[]) => DBRunResult;
  get: (...params: unknown[]) => unknown | undefined;
  all: (...params: unknown[]) => unknown[];
}

// ============================================
// Timestamp Fields
// ============================================

export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

export interface AuditFields extends TimestampFields {
  created_by: number;
  updated_by?: number;
}

// ============================================
// Entity Types (for legacy routes)
// ============================================

export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Note: User type is defined in user.ts

export interface UserBasic {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  ticket_id?: number;
  ticket_key?: string;
  actor_id?: number;
  actor_name?: string;
  is_read: boolean;
  created_at: string;
}
