/**
 * Base Repository - Abstract class for all data repositories
 * Implements common CRUD operations using Repository Pattern
 */

import db from '../database/db';
import { PaginationParams, PaginatedResponse, DatabaseResult } from '../types/common';

export abstract class BaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected tableName: string;
  protected primaryKey: string = 'id';

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get database instance
   */
  protected get db() {
    return db;
  }

  /**
   * Execute SELECT query and return all results
   */
  protected query<R = T>(sql: string, params: any[] = []): R[] {
    return db.prepare(sql).all(...params) as R[];
  }

  /**
   * Execute SELECT query and return single result
   */
  protected queryOne<R = T>(sql: string, params: any[] = []): R | undefined {
    return db.prepare(sql).get(...params) as R | undefined;
  }

  /**
   * Execute INSERT/UPDATE/DELETE query
   */
  protected execute(sql: string, params: any[] = []): DatabaseResult {
    return db.prepare(sql).run(...params);
  }

  /**
   * Find all records with optional pagination
   */
  findAll(pagination?: PaginationParams): T[] | PaginatedResponse<T> {
    if (pagination) {
      const { limit, offset } = pagination;
      const data = this.query<T>(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const total = this.count();
      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }
    return this.query<T>(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
  }

  /**
   * Find single record by ID
   */
  findById(id: number): T | undefined {
    return this.queryOne<T>(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`, [id]);
  }

  /**
   * Find records by field value
   */
  findBy(field: string, value: any): T[] {
    return this.query<T>(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`, [value]);
  }

  /**
   * Find single record by field value
   */
  findOneBy(field: string, value: any): T | undefined {
    return this.queryOne<T>(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`, [value]);
  }

  /**
   * Count all records
   */
  count(where?: string, params: any[] = []): number {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const result = this.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  /**
   * Check if record exists
   */
  exists(id: number): boolean {
    const result = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Create new record - to be implemented by subclasses
   */
  abstract create(data: CreateDTO, userId?: number): T;

  /**
   * Update existing record - to be implemented by subclasses
   */
  abstract update(id: number, data: UpdateDTO, userId?: number): T | null;

  /**
   * Delete record
   */
  delete(id: number): boolean {
    const result = this.execute(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`, [id]);
    return result.changes > 0;
  }

  /**
   * Soft delete record (if table has is_deleted column)
   */
  softDelete(id: number): boolean {
    const result = this.execute(
      `UPDATE ${this.tableName} SET is_deleted = 1, deleted_at = datetime('now') WHERE ${this.primaryKey} = ?`,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Begin transaction
   */
  beginTransaction(): void {
    this.execute('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  commit(): void {
    this.execute('COMMIT');
  }

  /**
   * Rollback transaction
   */
  rollback(): void {
    this.execute('ROLLBACK');
  }

  /**
   * Execute within transaction
   */
  async transaction<R>(callback: () => R): Promise<R> {
    this.beginTransaction();
    try {
      const result = callback();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }
}

export default BaseRepository;
