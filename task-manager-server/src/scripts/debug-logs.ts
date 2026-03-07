
import { initDb, prepare } from '../database/db';

async function debugLogDetails() {
  try {
    await initDb();
    console.log('Debugging Log Details...');

    const assetId = 20; 
    
    // Get the latest log ID
    const log = prepare('SELECT id FROM machine_parameter_sets WHERE asset_id = ? ORDER BY created_at DESC LIMIT 1').get(assetId) as any;
    
    if (!log) {
      console.log('No logs found.');
      return;
    }

    console.log(`Checking Log ID: ${log.id}`);

    // Run the query exactly as in the controller
    const values = prepare(`
      SELECT 
        v.id, v.parameter_id, v.value,
        p.name as parameter_name, 
        p.section, 
        p.unit,
        p.setting_a_min, p.setting_a_max,
        p.setting_b_min, p.setting_b_max,
        p.setting_c_min, p.setting_c_max,
        p.sort_order
      FROM machine_parameter_values v
      JOIN machine_parameters p ON v.parameter_id = p.id
      WHERE v.set_id = ?
      ORDER BY p.sort_order ASC
    `).all(log.id);

    console.log(`Found ${values.length} values.`);
    if (values.length > 0) {
      console.log('Sample value:', values[0]);
    } else {
      console.log('Values is empty! Check for orphaned records.');
      // Check raw values without join
      const rawValues = prepare('SELECT * FROM machine_parameter_values WHERE set_id = ?').all(log.id);
      console.log(`Raw values count: ${rawValues.length}`);
      if (rawValues.length > 0) {
        console.log('Sample raw value:', rawValues[0]);
        // Check if the parameter exists
        const paramId = (rawValues[0] as any).parameter_id;
        const param = prepare('SELECT * FROM machine_parameters WHERE id = ?').get(paramId);
        console.log(`Parameter ${paramId} exists?`, !!param);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugLogDetails();
