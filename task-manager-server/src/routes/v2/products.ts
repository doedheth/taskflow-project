/**
 * Product Routes
 *
 * API endpoints for Product master data (SPK Production Order System)
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth, managerOrAdmin } from '../../middleware/auth';
import { productService } from '../../services/ProductService';
import { ServiceError } from '../../services/BaseService';
import { AuthenticatedRequest, PaginationParams } from '../../types/common';
import { ProductFilter } from '../../types/spk';

const router = Router();

// Validation middleware
const createValidation = [
  body('code').trim().notEmpty().withMessage('Product code is required'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('material').optional().trim(),
  body('weight_gram').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('default_packaging').optional().trim(),
];

const updateValidation = [
  body('code').optional().trim().notEmpty().withMessage('Product code cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('material').optional().trim(),
  body('weight_gram').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('default_packaging').optional().trim(),
  body('is_active').optional().isInt({ min: 0, max: 1 }).withMessage('is_active must be 0 or 1'),
];

// Helper to handle errors
const handleError = (res: Response, error: unknown, context: string) => {
  console.error(`${context}:`, error);
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

// Helper to parse pagination
const getPagination = (req: Request): PaginationParams | undefined => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  if (req.query.page || req.query.limit) {
    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }
  return undefined;
};

/**
 * @route GET /api/v2/products
 * @desc Get all products with optional filters and pagination
 * @access Authenticated
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const filter: ProductFilter = {
      search: req.query.search as string,
      is_active: req.query.is_active !== undefined ? parseInt(req.query.is_active as string) : undefined,
    };
    const pagination = getPagination(req);

    const result = productService.getAllWithFilter(filter, pagination);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'Get products');
  }
});

/**
 * @route GET /api/v2/products/search
 * @desc Search products by code or name
 * @access Authenticated
 */
router.get('/search', auth, async (req: Request, res: Response) => {
  try {
    const searchQuery = (req.query.q as string) || '';
    const filter: ProductFilter = {
      is_active: req.query.is_active !== undefined ? parseInt(req.query.is_active as string) : 1,
    };

    const products = productService.search(searchQuery, filter);
    res.json({ success: true, data: products });
  } catch (error) {
    handleError(res, error, 'Search products');
  }
});

/**
 * @route GET /api/v2/products/:id
 * @desc Get product by ID
 * @access Authenticated
 */
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = productService.getById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, 'Get product by ID');
  }
});

/**
 * @route POST /api/v2/products
 * @desc Create new product
 * @access Manager or Admin
 */
router.post('/', auth, managerOrAdmin, createValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
    }

    const product = productService.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, 'Create product');
  }
});

/**
 * @route PUT /api/v2/products/:id
 * @desc Update product
 * @access Manager or Admin
 */
router.put('/:id', auth, managerOrAdmin, updateValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    const product = productService.update(id, req.body);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, 'Update product');
  }
});

/**
 * @route DELETE /api/v2/products/:id
 * @desc Delete product (hard delete if not in use, otherwise error)
 * @access Manager or Admin
 */
router.delete('/:id', auth, managerOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = productService.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Delete product');
  }
});

/**
 * @route PATCH /api/v2/products/:id/deactivate
 * @desc Deactivate product (soft delete)
 * @access Manager or Admin
 */
router.patch('/:id/deactivate', auth, managerOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deactivated = productService.deactivate(id);

    if (!deactivated) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    handleError(res, error, 'Deactivate product');
  }
});

/**
 * @route PATCH /api/v2/products/:id/reactivate
 * @desc Reactivate product
 * @access Manager or Admin
 */
router.patch('/:id/reactivate', auth, managerOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const reactivated = productService.reactivate(id);

    if (!reactivated) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({ success: true, message: 'Product reactivated' });
  } catch (error) {
    handleError(res, error, 'Reactivate product');
  }
});

export default router;
