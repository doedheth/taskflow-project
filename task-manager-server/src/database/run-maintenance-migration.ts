/**
 * Run Maintenance Management System Migration
 */
import { initDb, exec, prepare, saveDb } from './db';

export async function migrateMaintenanceTables(): Promise<void> {
  console.log('🔧 Adding Maintenance Management System tables...');

  try {
    // Asset Categories
    exec(`
      CREATE TABLE IF NOT EXISTS asset_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created asset_categories table');

    // Assets/Equipment Registry
    exec(`
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
    exec(`
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
    exec(`
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
    exec(`
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
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);
    console.log('✅ Created production_schedule table');

    // Downtime Classifications
    exec(`
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
    exec(`
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
    exec(`
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
    exec(`
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

    // Asset Runtime
    exec(`
      CREATE TABLE IF NOT EXISTS asset_runtime (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        date DATE NOT NULL,
        operating_hours DECIMAL(5,2),
        idle_hours DECIMAL(5,2),
        downtime_hours DECIMAL(5,2),
        shifts_worked INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id)
      );
    `);
    console.log('✅ Created asset_runtime table');

    // Work Order Counter
    exec(`
      CREATE TABLE IF NOT EXISTS work_order_counter (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        counter INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Created work_order_counter table');

    // Insert default data
    insertDefaultData();

    // Create indexes
    exec(`
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

    saveDb();
    console.log('🎉 Maintenance Management System migration complete!');
  } catch (error) {
    console.error('❌ Error during maintenance tables migration:', error);
    throw error;
  }
}

function insertDefaultData(): void {
  // Default Asset Categories
  const categories = [
    ['Thermoforming Machine', 'Mesin thermoforming utama untuk produksi'],
    ['Mold/Die', 'Cetakan/mold untuk thermoforming'],
    ['Conveyor', 'Conveyor belt dan sistem transportasi'],
    ['Chiller', 'Sistem pendingin'],
    ['Compressor', 'Kompresor udara dan sistem pneumatik'],
    ['Auxiliary Equipment', 'Peralatan pendukung lainnya'],
  ];

  const insertCategory = prepare(
    'INSERT OR IGNORE INTO asset_categories (name, description) VALUES (?, ?)'
  );
  categories.forEach(([name, desc]) => insertCategory.run(name, desc));
  console.log('✅ Inserted default asset categories');

  // Default Failure Codes
  const failureCodes = [
    ['EL-001', 'Electrical', 'Motor failure/overload'],
    ['EL-002', 'Electrical', 'Sensor malfunction'],
    ['EL-003', 'Electrical', 'Control panel issue'],
    ['EL-004', 'Electrical', 'Wiring/connection problem'],
    ['MC-001', 'Mechanical', 'Bearing failure'],
    ['MC-002', 'Mechanical', 'Belt/chain wear'],
    ['MC-003', 'Mechanical', 'Gear/gearbox issue'],
    ['MC-004', 'Mechanical', 'Structural damage'],
    ['PN-001', 'Pneumatic', 'Air leak'],
    ['PN-002', 'Pneumatic', 'Valve malfunction'],
    ['PN-003', 'Pneumatic', 'Pressure issue'],
    ['HY-001', 'Hydraulic', 'Oil leak'],
    ['HY-002', 'Hydraulic', 'Pump failure'],
    ['HY-003', 'Hydraulic', 'Cylinder issue'],
    ['TF-001', 'Thermoforming', 'Heater failure'],
    ['TF-002', 'Thermoforming', 'Vacuum leak'],
    ['TF-003', 'Thermoforming', 'Forming issue'],
    ['TF-004', 'Thermoforming', 'Material feeding problem'],
    ['MD-001', 'Mold', 'Surface damage'],
    ['MD-002', 'Mold', 'Alignment issue'],
    ['MD-003', 'Mold', 'Wear/erosion'],
    ['OT-001', 'Other', 'Operator error'],
    ['OT-002', 'Other', 'External factor'],
    ['OT-003', 'Other', 'Unknown cause'],
  ];

  const insertFailure = prepare(
    'INSERT OR IGNORE INTO failure_codes (code, category, description) VALUES (?, ?, ?)'
  );
  failureCodes.forEach(([code, cat, desc]) => insertFailure.run(code, cat, desc));
  console.log('✅ Inserted default failure codes');

  // Default Shift Patterns
  const shifts = [
    ['Shift 1', '06:00', '14:00', 60],
    ['Shift 2', '14:00', '22:00', 60],
    ['Shift 3', '22:00', '06:00', 60],
  ];

  const insertShift = prepare(
    'INSERT OR IGNORE INTO shift_patterns (name, start_time, end_time, break_minutes) VALUES (?, ?, ?, ?)'
  );
  shifts.forEach(([name, start, end, breakMin]) => insertShift.run(name, start, end, breakMin));
  console.log('✅ Inserted default shift patterns');

  // Default Downtime Classifications
  const classifications = [
    [
      'BD-PROD',
      'Breakdown during Production',
      'Kerusakan saat jadwal produksi aktif',
      1,
      'breakdown',
    ],
    ['BD-IDLE', 'Breakdown during Idle', 'Kerusakan saat tidak ada order', 0, 'breakdown'],
    [
      'PM-PROD',
      'Planned Maintenance during Production',
      'PM saat jadwal produksi',
      1,
      'planned_maintenance',
    ],
    [
      'PM-IDLE',
      'Planned Maintenance during Idle',
      'PM saat tidak ada order',
      0,
      'planned_maintenance',
    ],
    [
      'PM-WINDOW',
      'Planned Maintenance in Window',
      'PM di jadwal maintenance window',
      0,
      'planned_maintenance',
    ],
    ['CO-PROD', 'Changeover during Production', 'Setup/changeover saat produksi', 1, 'changeover'],
    ['IDLE-NO-ORDER', 'Idle - No Production Order', 'Idle karena tidak ada order', 0, 'idle'],
    ['IDLE-MATERIAL', 'Idle - Waiting Material', 'Idle menunggu material', 1, 'idle'],
    ['IDLE-OPERATOR', 'Idle - No Operator', 'Idle karena tidak ada operator', 1, 'idle'],
  ];

  const insertClassification = prepare(
    'INSERT OR IGNORE INTO downtime_classifications (code, name, description, counts_as_downtime, category) VALUES (?, ?, ?, ?, ?)'
  );
  classifications.forEach(([code, name, desc, counts, cat]) =>
    insertClassification.run(code, name, desc, counts, cat)
  );
  console.log('✅ Inserted default downtime classifications');

  // Initialize work order counter for current year
  const currentYear = new Date().getFullYear();
  prepare('INSERT OR IGNORE INTO work_order_counter (id, year, counter) VALUES (1, ?, 0)').run(
    currentYear
  );
  console.log('✅ Initialized work order counter');
}

// Check if this file is being run directly
if (require.main === module) {
  (async () => {
    console.log('🚀 Starting Maintenance Management System migration...');

    try {
      await initDb();
      console.log('✅ Database connection established');

      await migrateMaintenanceTables();

      console.log('🎉 Migration completed successfully!');
      // process.exit(0); // Don't exit here if imported, but this block only runs if main.
      // Actually, if run directly, we probably want to exit.
      // But if we are importing, this block is skipped.
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}
