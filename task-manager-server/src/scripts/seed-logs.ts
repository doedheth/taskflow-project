
import { initDb, prepare } from '../database/db';

async function seedProductionLogs() {
  try {
    await initDb();
    console.log('Seeding Production Logs...');

    const targetAssetIds = [20, 84, 85, 86]; // S 1, S 2, S 3, S 4

    for (const assetId of targetAssetIds) {
      console.log(`Seeding logs for Asset ID ${assetId}...`);

      // 1. Create a parameter set (Header)
      const setResult = prepare(`
        INSERT INTO machine_parameter_sets (
          asset_id, production_date, shift, 
          product_name, operator_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        assetId, 
        new Date().toISOString().split('T')[0], // Today
        'Shift 1',
        'CAP 3025',
        'BUDI SANTOSO',
        new Date().toISOString()
      );

      const setId = setResult.lastInsertRowid;
      console.log(`Created parameter set ID: ${setId} for Asset ${assetId}`);

      // 2. Get parameters for this asset
      const params = prepare('SELECT * FROM machine_parameters WHERE asset_id = ?').all(assetId) as any[];

      if (params.length === 0) {
        console.log(`No parameters found for asset ${assetId}. Skipping.`);
        continue;
      }

      // 3. Insert values for each parameter
      const insertValue = prepare(`
        INSERT INTO machine_parameter_values (
          set_id, parameter_id, value
        ) VALUES (?, ?, ?)
      `);

      for (const p of params) {
        // Generate a random value within range A if possible, else just a number
        let val = 0;
        if (p.setting_a_min !== null && p.setting_a_max !== null) {
          val = p.setting_a_min + Math.random() * (p.setting_a_max - p.setting_a_min);
        } else {
          val = 10 + Math.random() * 5;
        }
        
        insertValue.run(setId, p.id, parseFloat(val.toFixed(2)));
      }

      // 4. Insert Production Report Data
      prepare(`
        INSERT INTO machine_production_reports (
          parameter_set_id, material_usage, material_aux_usage,
          waste_data, downtime_data, production_result, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        setId,
        JSON.stringify([
          { name: 'HDPE', percentage: 98, qty: 500 },
          { name: 'Masterbatch', percentage: 2, qty: 10 }
        ]),
        JSON.stringify([
          { name: 'Mold Release', unit: 'Can', qty: 2 }
        ]),
        JSON.stringify([
          { type: 'Start up', qty: 5 },
          { type: 'Setting', qty: 2 }
        ]),
        JSON.stringify({ total_minutes: 30 }),
        JSON.stringify([
          { name: 'CAP 3025', pcs: 250000, kg: 510 }
        ]),
        'Mesin berjalan normal.'
      );
    }

    console.log('✅ Seeded dummy production log successfully');

  } catch (error) {
    console.error('Error:', error);
  }
}

seedProductionLogs();
