/**
 * User Type Definitions
 */

import { TimestampFields } from './common';

// ============================================
// Enums
// ============================================

export type UserRole = 'admin' | 'manager' | 'supervisor' | 'technician' | 'operator';

// ============================================
// Main Entity
// ============================================

export interface User extends TimestampFields {
  id: number;
  email: string;
  name: string;
  password?: string; // Excluded in responses
  avatar?: string | null;
  whatsapp?: string | null;
  role: UserRole;
  department_id?: number | null;
}

// ============================================
// With Details
// ============================================

export interface UserWithDetails extends Omit<User, 'password'> {
  department_name?: string;
  department_color?: string;
}

export interface UserWithStats extends UserWithDetails {
  stats: {
    totalAssigned: number;
    totalCompleted: number;
    completedPoints: number;
    recentCompleted: number;
    recentPoints: number;
    currentWorkload: number;
    todayLoad: number;
    completionRate: number;
  };
}

// ============================================
// DTOs
// ============================================

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  whatsapp?: string;
  role?: UserRole;
  department_id?: number;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  name?: string;
  avatar?: string | null;
  whatsapp?: string | null;
  role?: UserRole;
  department_id?: number | null;
}

export interface UpdateProfileDTO {
  name?: string;
  avatar?: string | null;
  whatsapp?: string | null;
}

// ============================================
// Filter Types
// ============================================

export interface UserFilter {
  role?: UserRole;
  department_id?: number;
  search?: string;
}

// ============================================
// Performance Types
// ============================================

export interface UserPerformance {
  user_id: number;
  user_name: string;
  tickets_assigned: number;
  tickets_completed: number;
  story_points: number;
  completion_rate: number;
  avg_completion_days: number;
}

export interface TeamPerformance {
  users: UserWithStats[];
  summary: {
    totalAssigned: number;
    totalCompleted: number;
    avgCompletionRate: number;
  };
}
