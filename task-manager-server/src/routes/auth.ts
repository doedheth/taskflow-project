import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db, { prepare } from '../database/db';
import { auth } from '../middleware/auth';
import { User, AuthenticatedRequest } from '../types';

const router = express.Router();

// Public Departments List (Moved here to ensure availability without auth middleware issues)
router.get('/departments', (_req: express.Request, res: Response): void => {
  try {
    console.log('GET /api/auth/departments request received');
    const departments = prepare(
      `
      SELECT id, name, description, color
      FROM departments
      ORDER BY name ASC
    `
    ).all();

    console.log(`Returning ${departments.length} departments (via Auth route)`);
    res.json(departments);
  } catch (error: any) { // Type assertion
    console.error('Get public departments error:', error);
    res.status(500).json({ error: 'Server error.', details: error.message || String(error) });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               department_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or email already registered
 *       500:
 *         description: Server error
 */
// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
    body('department_id').isInt().withMessage('Department is required'),
  ],
  async (req: express.Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name, department_id } = req.body;

      // Verify department exists
      const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(department_id);
      if (!department) {
        res.status(400).json({ error: 'Invalid department selected.' });
        return;
      }

      // Check if user exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        res.status(400).json({ error: 'Email already registered.' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = db
        .prepare(
          `
      INSERT INTO users (email, password, name, department_id)
      VALUES (?, ?, ?, ?)
    `
        )
        .run(email, hashedPassword, name, department_id || null);

      // Generate token
      const token = jwt.sign(
        { userId: result.lastInsertRowid },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Get user data
      const user = db
        .prepare('SELECT id, email, name, avatar, role, department_id FROM users WHERE id = ?')
        .get(result.lastInsertRowid) as User;

      res.status(201).json({ token, user });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  async (req: express.Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;
      console.log(`Login attempt for email: ${email}`);

      // Find user with department info
      const user = db
        .prepare(
          `
        SELECT u.*, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE LOWER(u.email) = LOWER(?)
      `
        )
        .get(email) as User | undefined;

      if (!user) {
        console.log(`User not found in database for email: ${email}`);
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }

      console.log(`User found: ${user.email}. Comparing password...`);
      // Check password
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        console.log(`Password mismatch for user: ${user.email}`);
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }
      console.log(`Login successful for user: ${user.email}`);

      // Generate token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret', {
        expiresIn: '7d',
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Get current user
router.get('/me', auth, (req: express.Request, res: Response): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = db
      .prepare(
        `
      SELECT u.id, u.email, u.name, u.avatar, u.whatsapp, u.role, u.department_id, u.created_at,
             d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `
      )
      .get(authReq.user.id) as User;

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Change password
router.put(
  '/change-password',
  auth,
  [body('currentPassword').exists(), body('newPassword').isLength({ min: 6 })],
  async (req: express.Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(authReq.user.id) as
        | { password: string }
        | undefined;
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        hashedPassword,
        authReq.user.id
      );

      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Server error.' });
    }
  }
);

export default router;
