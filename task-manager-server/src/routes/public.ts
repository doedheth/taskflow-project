
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import db from '../database/db';

const router = express.Router();

// Get all departments (Public Access)
router.get('/departments', (_req: Request, res: Response): void => {
  try {
    console.log('GET /api/public/departments request received');
    const departments = db
      .prepare(
        `
      SELECT id, name, description, color
      FROM departments
      ORDER BY name ASC
    `
      )
      .all();

    console.log(`Returning ${departments.length} departments (Public)`);
    res.json(departments);
  } catch (error) {
    console.error('Get public departments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/version', (_req: Request, res: Response): void => {
  try {
    const serverPath = path.resolve(__dirname, '../../version.json');
    const clientPath = path.resolve(__dirname, '../../../task-manager-client/version.json');
    let serverCommit = 'unknown';
    let clientCommit = 'unknown';
    let branch = process.env.DEPLOY_BRANCH || process.env.BRANCH || 'unknown';
    let buildTime = '';
    if (fs.existsSync(serverPath)) {
      const v = JSON.parse(fs.readFileSync(serverPath, 'utf-8'));
      serverCommit = v.commit || serverCommit;
      branch = v.branch || branch;
      buildTime = v.build_time || '';
    }
    if (fs.existsSync(clientPath)) {
      const v = JSON.parse(fs.readFileSync(clientPath, 'utf-8'));
      clientCommit = v.commit || clientCommit;
    }
    res.json({ server_commit: serverCommit, client_commit: clientCommit, branch, build_time: buildTime });
  } catch (e) {
    res.json({ server_commit: 'unknown', client_commit: 'unknown', branch: 'unknown' });
  }
});

export default router;
