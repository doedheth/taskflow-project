/**
 * Product Repository
 *
 * Data access layer for Product master data (SPK Production Order System)
 */

import { BaseRepository } from './BaseRepository';
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilter,
} from '../types/spk';
import { PaginationParams, PaginatedResponse } from '../types/common';

export class ProductRepository extends BaseRepository<Product, CreateProductDTO, UpdateProductDTO> {
  constructor() {
    super('products');
  }

  /**
   * Create a new product
   */
  create(data: CreateProductDTO): Product {
    const result = this.execute(
      `INSERT INTO products (code, name, material, weight_gram, default_packaging)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.code,
        data.name,
        data.material || null,
        data.weight_gram || null,
        data.default_packaging || null,
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Update an existing product
   */
  update(id: number, data: UpdateProductDTO): Product | null {
    const fields: (keyof UpdateProductDTO)[] = [
      'code',
      'name',
      'material',
      'weight_gram',
      'default_packaging',
      'is_active',
    ];

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    if (updates.length === 1) {
      // Only updated_at, no changes
      return this.findById(id) || null;
    }

    params.push(id);
    this.execute(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.findById(id) || null;
  }

  /**
   * Find product by code
   */
  findByCode(code: string): Product | undefined {
    return this.queryOne<Product>(
      `SELECT * FROM products WHERE code = ?`,
      [code]
    );
  }

  /**
   * Search products by code or name
   */
  search(query: string, filter?: ProductFilter): Product[] {
    let sql = `SELECT * FROM products WHERE 1=1`;
    const params: any[] = [];

    if (query) {
      sql += ` AND (code LIKE ? OR name LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filter?.is_active !== undefined) {
      sql += ` AND is_active = ?`;
      params.push(filter.is_active);
    } else {
      // Default to only active products
      sql += ` AND is_active = 1`;
    }

    sql += ` ORDER BY code ASC LIMIT 50`;

    return this.query<Product>(sql, params);
  }

  /**
   * Find all products with optional filters and pagination
   */
  findAllWithFilter(
    filter?: ProductFilter,
    pagination?: PaginationParams
  ): Product[] | PaginatedResponse<Product> {
    let sql = `SELECT * FROM products WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as count FROM products WHERE 1=1`;
    const params: any[] = [];

    if (filter?.search) {
      const searchCondition = ` AND (code LIKE ? OR name LIKE ?)`;
      sql += searchCondition;
      countSql += searchCondition;
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filter?.is_active !== undefined) {
      sql += ` AND is_active = ?`;
      countSql += ` AND is_active = ?`;
      params.push(filter.is_active);
    }

    sql += ` ORDER BY code ASC`;

    if (pagination) {
      const countResult = this.queryOne<{ count: number }>(countSql, params);
      const total = countResult?.count || 0;

      sql += ` LIMIT ? OFFSET ?`;
      const data = this.query<Product>(sql, [...params, pagination.limit, pagination.offset]);

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

    return this.query<Product>(sql, params);
  }

  /**
   * Check if product is used in any SPK line items
   */
  isProductInUse(productId: number): boolean {
    const result = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM spk_line_items WHERE product_id = ?`,
      [productId]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Soft delete product (set is_active = 0)
   */
  deactivate(id: number): boolean {
    const result = this.execute(
      `UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Reactivate product (set is_active = 1)
   */
  reactivate(id: number): boolean {
    const result = this.execute(
      `UPDATE products SET is_active = 1, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
export default productRepository;
