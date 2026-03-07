/**
 * Product Service
 *
 * Business logic layer for Product master data (SPK Production Order System)
 */

import {
  BaseService,
  ValidationError,
  ConflictError,
  NotFoundError,
} from './BaseService';
import { productRepository, ProductRepository } from '../models/ProductRepository';
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductFilter,
} from '../types/spk';
import { PaginationParams, PaginatedResponse } from '../types/common';

export class ProductService extends BaseService<Product, CreateProductDTO, UpdateProductDTO> {
  private productRepository: ProductRepository;

  constructor() {
    super(productRepository);
    this.productRepository = productRepository;
  }

  /**
   * Get all products with filters and pagination
   */
  getAllWithFilter(
    filter?: ProductFilter,
    pagination?: PaginationParams
  ): Product[] | PaginatedResponse<Product> {
    return this.productRepository.findAllWithFilter(filter, pagination);
  }

  /**
   * Search products by code or name
   */
  search(query: string, filter?: ProductFilter): Product[] {
    return this.productRepository.search(query, filter);
  }

  /**
   * Get product by code
   */
  getByCode(code: string): Product | undefined {
    return this.productRepository.findByCode(code);
  }

  /**
   * Validate create data
   */
  protected validateCreate(data: CreateProductDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.code || data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Product code is required' });
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name is required' });
    }

    if (data.weight_gram !== undefined && data.weight_gram < 0) {
      errors.push({ field: 'weight_gram', message: 'Weight must be positive' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    // Check for duplicate code
    const existingProduct = this.productRepository.findByCode(data.code);
    if (existingProduct) {
      throw new ConflictError(`Product code "${data.code}" already exists`);
    }
  }

  /**
   * Validate update data
   */
  protected validateUpdate(id: number, data: UpdateProductDTO): void {
    const existing = this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    if (data.weight_gram !== undefined && data.weight_gram < 0) {
      throw new ValidationError('Weight must be positive', [
        { field: 'weight_gram', message: 'Weight must be positive' },
      ]);
    }

    // Check for duplicate code if changing
    if (data.code && data.code !== existing.code) {
      const existingWithCode = this.productRepository.findByCode(data.code);
      if (existingWithCode) {
        throw new ConflictError(`Product code "${data.code}" already exists`);
      }
    }
  }

  /**
   * Validate delete
   */
  protected validateDelete(id: number): void {
    const existing = this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    // Check if product is in use
    if (this.productRepository.isProductInUse(id)) {
      throw new ValidationError('Cannot delete product that is used in SPK line items', [
        { field: 'id', message: 'Product is in use' },
      ]);
    }
  }

  /**
   * Soft delete (deactivate) product
   */
  deactivate(id: number): boolean {
    const existing = this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }
    return this.productRepository.deactivate(id);
  }

  /**
   * Reactivate product
   */
  reactivate(id: number): boolean {
    const existing = this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }
    return this.productRepository.reactivate(id);
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
