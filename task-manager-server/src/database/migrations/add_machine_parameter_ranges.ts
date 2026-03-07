import { prepare, exec, saveDb, initDb } from '../db';

export function migrateMachineParameterRanges(): void {
  console.log('Running machine parameter ranges migration...');


  try {
    const columns = prepare('PRAGMA table_info(machine_parameters)').all() as { name: string }[];
    if (columns.length === 0) {
      console.log('machine_parameters table not found, skipping migration');
      return;
    }

    const addColumn = (name: string) => {
      if (!columns.some(col => col.name === name)) {
        exec(`ALTER TABLE machine_parameters ADD COLUMN ${name} REAL`);
        console.log(`Added column ${name}`);
      }
    };

    addColumn('setting_a_min');
    addColumn('setting_a_max');
    addColumn('setting_b_min');
    addColumn('setting_b_max');
    addColumn('setting_c_min');
    addColumn('setting_c_max');

    const hasMinValue = columns.some(col => col.name === 'min_value');
    const hasMaxValue = columns.some(col => col.name === 'max_value');
    if (hasMinValue || hasMaxValue) {
      exec(`
        UPDATE machine_parameters
        SET
          setting_a_min = COALESCE(setting_a_min, min_value),
          setting_a_max = COALESCE(setting_a_max, max_value)
      `);
    }

    saveDb();
    console.log('Machine parameter ranges migration completed');
  } catch (error) {
    console.error('Machine parameter ranges migration error:', error);
    throw error;
  }
}

if (require.main === module) {
  (async () => {
    await initDb();
    migrateMachineParameterRanges();
  })();
}
