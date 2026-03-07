
import { prepare, exec, saveDb } from '../db';

export function migrateDowntimeDepartment() {
  console.log('🔄 Running migration: add_downtime_department...');

  try {
    // 1. Check if column exists
    const tableInfo = prepare('PRAGMA table_info(downtime_logs)').all() as { name: string }[];
    const hasDepartmentColumn = tableInfo.some(col => col.name === 'department_id');

    if (!hasDepartmentColumn) {
      // 2. Add department_id column
      exec('ALTER TABLE downtime_logs ADD COLUMN department_id INTEGER REFERENCES departments(id)');
      console.log('✅ Added department_id column to downtime_logs');
    }

    // 3. Backfill department_id based on user who logged it
    // If logged_by is NULL or user has no department, default to Production (assuming most are prod) or leave NULL
    prepare(`
      UPDATE downtime_logs 
      SET department_id = (
        SELECT department_id FROM users WHERE users.id = downtime_logs.logged_by
      )
      WHERE department_id IS NULL AND logged_by IS NOT NULL
    `).run();
    console.log('✅ Backfilled department_id from users table');

    saveDb();
    console.log('✅ Migration add_downtime_department completed');
  } catch (error) {
    console.error('❌ Migration add_downtime_department failed:', error);
  }
}
