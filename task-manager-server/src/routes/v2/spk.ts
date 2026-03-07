/**
 * SPK Routes
 *
 * API endpoints for SPK (Surat Perintah Kerja) Production Order System
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth, managerOrAdmin, supervisorOrAbove } from '../../middleware/auth';
import { spkService } from '../../services/SPKService';
import { ServiceError } from '../../services/BaseService';
import { AuthenticatedRequest, PaginationParams } from '../../types/common';
import { SPKFilter, SPKStatus } from '../../types/spk';

const router = Router();

// Validation middleware
const createValidation = [
  body('asset_id').isInt({ min: 1 }).withMessage('Asset ID is required'),
  body('production_date').isISO8601().withMessage('Valid production date is required (YYYY-MM-DD)'),
  body('production_schedule_id').optional().isInt({ min: 1 }),
  body('notes').optional().trim(),
  body('line_items').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('line_items.*.product_id').isInt({ min: 1 }).withMessage('Product ID is required for each line item'),
  body('line_items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  body('line_items.*.packaging_type').optional().trim(),
  body('line_items.*.remarks').optional().trim(),
];

const updateValidation = [
  body('asset_id').optional().isInt({ min: 1 }),
  body('production_date').optional().isISO8601(),
  body('production_schedule_id').optional().isInt({ min: 1 }),
  body('notes').optional().trim(),
  body('line_items').optional().isArray(),
  body('line_items.*.product_id').optional().isInt({ min: 1 }),
  body('line_items.*.quantity').optional().isInt({ min: 1 }),
];

const rejectValidation = [
  body('rejection_reason').trim().notEmpty().withMessage('Rejection reason is required'),
];

const duplicateValidation = [
  body('new_production_date').isISO8601().withMessage('Valid new production date is required (YYYY-MM-DD)'),
  body('new_asset_id').optional().isInt({ min: 1 }),
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

// Helper to get user from request
const getUser = (req: Request) => {
  return (req as AuthenticatedRequest).user!;
};

/**
 * @route GET /api/v2/spk
 * @desc Get all SPKs with filters and pagination
 * @access Authenticated (PPIC sees own, Manager sees all)
 */
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const pagination = getPagination(req);

    const filter: SPKFilter = {
      asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
      status: req.query.status as SPKStatus,
      production_date: req.query.production_date as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    // PPIC (supervisor) can only see their own SPKs
    if (user.role === 'supervisor') {
      filter.created_by = user.id;
    }

    const result = spkService.getAllWithFilter(filter, pagination);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'Get SPK list');
  }
});

/**
 * @route GET /api/v2/spk/dashboard
 * @desc Get SPK dashboard summary for a specific date
 * @access Authenticated
 */
router.get('/dashboard', auth, async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const dashboard = spkService.getDashboard(date);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    handleError(res, error, 'Get SPK dashboard');
  }
});

/**
 * @route GET /api/v2/spk/:id
 * @desc Get SPK by ID with line items
 * @access Authenticated
 */
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const spk = spkService.getWithItems(id);

    if (!spk) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    // Check access for supervisor
    const user = getUser(req);
    if (user.role === 'supervisor' && spk.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own SPKs.',
      });
    }

    res.json({ success: true, data: spk });
  } catch (error) {
    handleError(res, error, 'Get SPK by ID');
  }
});

/**
 * @route POST /api/v2/spk
 * @desc Create new SPK
 * @access Supervisor or above
 */
router.post('/', auth, supervisorOrAbove, createValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
      });
    }

    const user = getUser(req);
    const spk = spkService.create(req.body, user.id);
    res.status(201).json({ success: true, data: spk });
  } catch (error) {
    handleError(res, error, 'Create SPK');
  }
});

/**
 * @route PUT /api/v2/spk/:id
 * @desc Update SPK (only draft status)
 * @access Supervisor or above (own SPK only for supervisor)
 */
router.put('/:id', auth, supervisorOrAbove, updateValidation, async (req: Request, res: Response) => {
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
    const user = getUser(req);

    // Check ownership for supervisor
    const existing = spkService.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    if (user.role === 'supervisor' && existing.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only edit your own SPKs.',
      });
    }

    const spk = spkService.update(id, req.body, user.id);
    res.json({ success: true, data: spk });
  } catch (error) {
    handleError(res, error, 'Update SPK');
  }
});

/**
 * @route POST /api/v2/spk/:id/submit
 * @desc Submit SPK for approval (draft → pending)
 * @access Supervisor or above (own SPK only for supervisor)
 */
router.post('/:id/submit', auth, supervisorOrAbove, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);

    // Check ownership for supervisor
    const existing = spkService.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    if (user.role === 'supervisor' && existing.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only submit your own SPKs.',
      });
    }

    const spk = spkService.submit(id, user.id);
    res.json({ success: true, data: spk, message: 'SPK submitted for approval' });
  } catch (error) {
    handleError(res, error, 'Submit SPK');
  }
});

/**
 * @route POST /api/v2/spk/:id/approve
 * @desc Approve SPK (pending → approved)
 * @access Manager or Admin
 */
router.post('/:id/approve', auth, managerOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);

    const spk = spkService.approve(id, user);
    res.json({ success: true, data: spk, message: 'SPK approved' });
  } catch (error) {
    handleError(res, error, 'Approve SPK');
  }
});

/**
 * @route POST /api/v2/spk/:id/reject
 * @desc Reject SPK (pending → rejected)
 * @access Manager or Admin
 */
router.post('/:id/reject', auth, managerOrAdmin, rejectValidation, async (req: Request, res: Response) => {
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
    const user = getUser(req);
    const { rejection_reason } = req.body;

    const spk = spkService.reject(id, user, rejection_reason);
    res.json({ success: true, data: spk, message: 'SPK rejected' });
  } catch (error) {
    handleError(res, error, 'Reject SPK');
  }
});

/**
 * @route POST /api/v2/spk/:id/cancel
 * @desc Cancel SPK
 * @access Supervisor or above (own SPK only for supervisor)
 */
router.post('/:id/cancel', auth, supervisorOrAbove, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);

    // Check ownership for supervisor
    const existing = spkService.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    if (user.role === 'supervisor' && existing.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only cancel your own SPKs.',
      });
    }

    const spk = spkService.cancel(id, user.id);
    res.json({ success: true, data: spk, message: 'SPK cancelled' });
  } catch (error) {
    handleError(res, error, 'Cancel SPK');
  }
});

/**
 * @route POST /api/v2/spk/:id/revert-to-draft
 * @desc Revert rejected SPK to draft for editing
 * @access Supervisor or above (own SPK only for supervisor)
 */
router.post('/:id/revert-to-draft', auth, supervisorOrAbove, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);

    // Check ownership for supervisor
    const existing = spkService.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    if (user.role === 'supervisor' && existing.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only edit your own SPKs.',
      });
    }

    const spk = spkService.revertToDraft(id, user.id);
    res.json({ success: true, data: spk, message: 'SPK reverted to draft' });
  } catch (error) {
    handleError(res, error, 'Revert SPK to draft');
  }
});

/**
 * @route POST /api/v2/spk/:id/duplicate
 * @desc Duplicate SPK to new date
 * @access Supervisor or above
 */
router.post('/:id/duplicate', auth, supervisorOrAbove, duplicateValidation, async (req: Request, res: Response) => {
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
    const user = getUser(req);

    const spk = spkService.duplicate(id, req.body, user.id);
    res.status(201).json({ success: true, data: spk, message: 'SPK duplicated successfully' });
  } catch (error) {
    handleError(res, error, 'Duplicate SPK');
  }
});

/**
 * @route DELETE /api/v2/spk/:id
 * @desc Delete SPK (only draft status)
 * @access Supervisor or above (own SPK only for supervisor)
 */
router.delete('/:id', auth, supervisorOrAbove, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = getUser(req);

    // Check ownership and status
    const existing = spkService.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'SPK not found',
      });
    }

    if (user.role === 'supervisor' && existing.created_by !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own SPKs.',
      });
    }

    if (existing.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete SPK that is not in draft status',
      });
    }

    // TODO: Implement delete in service
    res.status(204).send();
  } catch (error) {
    handleError(res, error, 'Delete SPK');
  }
});

export default router;
