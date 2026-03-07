/**
 * Migration: Add Maintenance Management System Tables
 * This adds all tables needed for asset management, work orders, and downtime tracking
 */

const db = require('../db');

function runMigration() {
  console.log('🔧 Adding Maintenance Management System tables...');

  try {
    // Asset Categories
    db.exec(`
      CREATE TABLE IF NOT EXISTS asset_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created asset_categories table');

    // Assets/Equipment Registry
    db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category_id INTEGER,
        location TEXT,
        manufacturer TEXT,
        model TEXT,
        serial_number TEXT,
        purchase_date DATE,
        warranty_expiry DATE,
        status TEXT DEFAULT 'operational',
        criticality TEXT DEFAULT 'medium',
        department_id INTEGER,
        specifications TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES asset_categories(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
      );
    `);
    console.log('✅ Created assets table');

    // Failure Codes
    db.exec(`
      CREATE TABLE IF NOT EXISTS failure_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        category TEXT,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created failure_codes table');

    // Shift Patterns
    db.exec(`
      CREATE TABLE IF NOT EXISTS shift_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_minutes INTEGER DEFAULT 60,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created shift_patterns table');

    // Production Schedule
    db.exec(`
      CREATE TABLE IF NOT EXISTS production_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        date DATE NOT NULL,
        shift_pattern_id INTEGER,
        status TEXT NOT NULL,
        planned_start TEXT,
        planned_end TEXT,
        planned_production_minutes INTEGER,
        actual_production_minutes INTEGER,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (shift_pattern_id) REFERENCES shift_patterns(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        UNIQUE(asset_id, date, shift_pattern_id)
      );
    `);
    console.log('✅ Created production_schedule table');

    // Downtime Classifications
    db.exec(`
      CREATE TABLE IF NOT EXISTS downtime_classifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        counts_as_downtime INTEGER DEFAULT 1,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created downtime_classifications table');

    // Maintenance Schedules (Preventive)
    db.exec(`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        frequency_type TEXT NOT NULL,
        frequency_value INTEGER DEFAULT 1,
        runtime_hours_trigger INTEGER,
        last_performed DATE,
        next_due DATE,
        estimated_duration_minutes INTEGER,
        assigned_to INTEGER,
        is_active INTEGER DEFAULT 1,
        checklist TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
    `);
    console.log('✅ Created maintenance_schedules table');

    // Work Orders
    db.exec(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wo_number TEXT UNIQUE NOT NULL,
        asset_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        title TEXT NOT NULL,
        description TEXT,
        failure_code_id INTEGER,
        maintenance_schedule_id INTEGER,
        reported_by INTEGER,
        assigned_to INTEGER,
        scheduled_start DATETIME,
        scheduled_end DATETIME,
        actual_start DATETIME,
        actual_end DATETIME,
        root_cause TEXT,
        solution TEXT,
        parts_used TEXT,
        labor_hours DECIMAL(5,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (failure_code_id) REFERENCES failure_codes(id),
        FOREIGN KEY (maintenance_schedule_id) REFERENCES maintenance_schedules(id),
        FOREIGN KEY (reported_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
    `);
    console.log('✅ Created work_orders table');

    // Downtime Logs
    db.exec(`
      CREATE TABLE IF NOT EXISTS downtime_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        work_order_id INTEGER,
        downtime_type TEXT NOT NULL,
        classification_id INTEGER,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration_minutes INTEGER,
        was_scheduled_production INTEGER,
        production_schedule_id INTEGER,
        reason TEXT,
        failure_code_id INTEGER,
        production_impact TEXT,
        logged_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
        FOREIGN KEY (classification_id) REFERENCES downtime_classifications(id),
        FOREIGN KEY (production_schedule_id) REFERENCES production_schedule(id),
        FOREIGN KEY (failure_code_id) REFERENCES failure_codes(id),
        FOREIGN KEY (logged_by) REFERENCES users(id)
      );
    `);
    console.log('✅ Created downtime_logs table');

    // Asset Runtime (for tracking operating hours)
    db.exec(`
      CREATE TABLE IF NOT EXISTS asset_runtime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        date DATE NOT NULL,
        operating_hours DECIMAL(5,2),
        idle_hours DECIMAL(5,2),
        downtime_hours DECIMAL(5,2),
        shifts_worked INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id),
        UNIQUE(asset_id, date)
      );
    `);
    console.log('✅ Created asset_runtime table');

    // Work Order Counter
    db.exec(`
      CREATE TABLE IF NOT EXISTS work_order_counter (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        counter INTEGER DEFAULT 0,
        UNIQUE(year)
      );
    `);
    console.log('✅ Created work_order_counter table');

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
      CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON work_orders(asset_id);
      CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
      CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);
      CREATE INDEX IF NOT EXISTS idx_downtime_logs_asset ON downtime_logs(asset_id);
      CREATE INDEX IF NOT EXISTS idx_downtime_logs_start ON downtime_logs(start_time);
      CREATE INDEX IF NOT EXISTS idx_production_schedule_asset_date ON production_schedule(asset_id, date);
      CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_asset ON maintenance_schedules(asset_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due ON maintenance_schedules(next_due);
    `);
    console.log('✅ Created indexes');

    console.log('🎉 Maintenance Management System migration complete!');
  } catch (error) {
    console.error('❌ Error during maintenance tables migration:', error);
    throw error;
  }
}

module.exports = { runMigration };
