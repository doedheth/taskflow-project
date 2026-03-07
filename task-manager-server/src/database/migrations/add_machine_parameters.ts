import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate(): Promise<void> {
  console.log('🔧 Running migration: Add Machine Parameters tables...');
  console.log('📂 Database Path:', dbPath);

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // 1. Create machine_parameters table
    db.exec(`
      CREATE TABLE IF NOT EXISTS machine_parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        section TEXT NOT NULL, -- e.g. 'Temp Extruder', 'Speed'
        unit TEXT,
        setting_a_min REAL,
        setting_a_max REAL,
        setting_b_min REAL,
        setting_b_max REAL,
        setting_c_min REAL,
        setting_c_max REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created machine_parameters table');

    // 2. Create machine_parameter_sets table (The log header)
    db.exec(`
      CREATE TABLE IF NOT EXISTS machine_parameter_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        production_date DATE NOT NULL,
        shift TEXT, -- e.g. 'Shift 1', 'Shift 2'
        product_name TEXT,
        operator_name TEXT,
        created_by INTEGER, -- User ID
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created machine_parameter_sets table');

    // 3. Create machine_parameter_values table (The actual values)
    db.exec(`
      CREATE TABLE IF NOT EXISTS machine_parameter_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        set_id INTEGER NOT NULL,
        parameter_id INTEGER NOT NULL,
        value REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (set_id) REFERENCES machine_parameter_sets(id) ON DELETE CASCADE,
        FOREIGN KEY (parameter_id) REFERENCES machine_parameters(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created machine_parameter_values table');
    
    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_machine_parameters_asset ON machine_parameters(asset_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_machine_parameter_sets_asset_date ON machine_parameter_sets(asset_id, production_date)');
    db.run('CREATE INDEX IF NOT EXISTS idx_machine_parameter_values_set ON machine_parameter_values(set_id)');

    // Verify tables created
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'machine_%'");
    console.log('📋 Verified tables:', JSON.stringify(tables[0]?.values));

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
