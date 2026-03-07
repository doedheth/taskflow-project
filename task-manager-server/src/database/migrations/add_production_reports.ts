
import { prepare, exec, saveDb, initDb } from '../db';

export function migrateProductionReports(): void {
  console.log('Running production reports migration...');

  try {
    const tableInfo = prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='machine_production_reports'").get();
    
    if (!tableInfo) {
      exec(`
        CREATE TABLE machine_production_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parameter_set_id INTEGER NOT NULL,
          material_usage TEXT, -- JSON
          material_aux_usage TEXT, -- JSON
          waste_data TEXT, -- JSON
          downtime_data TEXT, -- JSON
          production_result TEXT, -- JSON
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parameter_set_id) REFERENCES machine_parameter_sets (id) ON DELETE CASCADE
        )
      `);
      console.log('Created machine_production_reports table');
      saveDb();
    } else {
      console.log('machine_production_reports table already exists');
    }
  } catch (error) {
    console.error('Error creating production reports table:', error);
    throw error;
  }
}

if (require.main === module) {
  (async () => {
    await initDb();
    migrateProductionReports();
  })();
}
