
import { prepare, exec, saveDb, initDb } from '../db';

export function migrateMachineParameterOrder(): void {
  console.log('Running machine parameter order migration...');

  try {
    const columns = prepare('PRAGMA table_info(machine_parameters)').all() as { name: string }[];
    if (columns.length === 0) {
      console.log('machine_parameters table not found, skipping migration');
      return;
    }

    if (!columns.some(col => col.name === 'sort_order')) {
      exec(`ALTER TABLE machine_parameters ADD COLUMN sort_order INTEGER DEFAULT 0`);
      console.log(`Added column sort_order`);
      
      // Initialize sort_order based on current ID or existing order
      exec(`
        UPDATE machine_parameters 
        SET sort_order = id
      `);
    }

    saveDb();
    console.log('Machine parameter order migration completed');
  } catch (error) {
    console.error('Machine parameter order migration error:', error);
    throw error;
  }
}

if (require.main === module) {
  (async () => {
    await initDb();
    migrateMachineParameterOrder();
  })();
}
