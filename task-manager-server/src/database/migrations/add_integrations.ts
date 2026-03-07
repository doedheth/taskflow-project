/**
 * Migration: Add integrations between Task Manager and Maintenance Management System
 *
 * Changes:
 * 1. Add asset_id to tickets (for asset-linked tickets)
 * 2. Add related_ticket_id to work_orders (link WO to ticket)
 * 3. Add related_wo_id to tickets (link ticket to WO)
 * 4. Add sprint_id to work_orders (for maintenance sprints)
 */

import db from '../db';

interface ColumnInfo {
  name: string;
}

export function migrateIntegrations(): void {
  console.log('Running integrations migration...');

  try {
    // 1. Add asset_id to tickets
    const ticketColumns = db.prepare('PRAGMA table_info(tickets)').all() as ColumnInfo[];

    if (!ticketColumns.some(col => col.name === 'asset_id')) {
      db.exec('ALTER TABLE tickets ADD COLUMN asset_id INTEGER REFERENCES assets(id)');
      console.log('✅ Added asset_id to tickets table');
    }

    if (!ticketColumns.some(col => col.name === 'related_wo_id')) {
      db.exec('ALTER TABLE tickets ADD COLUMN related_wo_id INTEGER REFERENCES work_orders(id)');
      console.log('✅ Added related_wo_id to tickets table');
    }

    // 2. Add related_ticket_id and sprint_id to work_orders
    const woColumns = db.prepare('PRAGMA table_info(work_orders)').all() as ColumnInfo[];

    if (!woColumns.some(col => col.name === 'related_ticket_id')) {
      db.exec(
        'ALTER TABLE work_orders ADD COLUMN related_ticket_id INTEGER REFERENCES tickets(id)'
      );
      console.log('✅ Added related_ticket_id to work_orders table');
    }

    if (!woColumns.some(col => col.name === 'sprint_id')) {
      db.exec('ALTER TABLE work_orders ADD COLUMN sprint_id INTEGER REFERENCES sprints(id)');
      console.log('✅ Added sprint_id to work_orders table');
    }

    // Create indexes for better query performance
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_tickets_asset_id ON tickets(asset_id)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_tickets_related_wo_id ON tickets(related_wo_id)');
      db.exec(
        'CREATE INDEX IF NOT EXISTS idx_work_orders_related_ticket_id ON work_orders(related_ticket_id)'
      );
      db.exec('CREATE INDEX IF NOT EXISTS idx_work_orders_sprint_id ON work_orders(sprint_id)');
      console.log('✅ Created indexes for integration columns');
    } catch (indexError) {
      // Indexes might already exist
      console.log('ℹ️ Indexes may already exist');
    }

    console.log('Integrations migration completed successfully.');
  } catch (error) {
    console.error('Error in integrations migration:', error);
    throw error;
  }
}
