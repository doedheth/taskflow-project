/**
 * Migration: Add work_order_assignees table for multiple assignees
 * Similar to ticket_assignees table
 */

import db from '../db';

interface ExistingWorkOrder {
  id: number;
  assigned_to: number | null;
}

export function migrateWorkOrderAssignees(): void {
  console.log('Running work_order_assignees migration...');

  try {
    // Check if table already exists
    const tableExists = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='work_order_assignees'`)
      .get();

    if (tableExists) {
      console.log('work_order_assignees table already exists, skipping migration.');
      return;
    }

    // Create work_order_assignees table
    db.exec(`
      CREATE TABLE IF NOT EXISTS work_order_assignees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_order_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(work_order_id, user_id)
      )
    `);

    console.log('work_order_assignees table created.');

    // Migrate existing assigned_to data to new table
    const workOrders = db
      .prepare(`SELECT id, assigned_to FROM work_orders WHERE assigned_to IS NOT NULL`)
      .all() as ExistingWorkOrder[];

    if (workOrders.length > 0) {
      const insertStmt = db.prepare(
        `INSERT OR IGNORE INTO work_order_assignees (work_order_id, user_id) VALUES (?, ?)`
      );

      workOrders.forEach(wo => {
        if (wo.assigned_to) {
          insertStmt.run(wo.id, wo.assigned_to);
        }
      });

      console.log(`Migrated ${workOrders.length} existing work order assignments.`);
    }

    console.log('work_order_assignees migration completed successfully.');
  } catch (error) {
    console.error('Error in work_order_assignees migration:', error);
    throw error;
  }
}
