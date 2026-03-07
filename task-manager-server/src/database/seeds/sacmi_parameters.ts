
import { initDb, prepare, exec } from '../db';

async function seedSacmiParameters() {
  try {
    await initDb();
    console.log('Seeding Sacmi parameters...');

    const targetAssetIds = [20, 84, 85, 86]; // S 1, S 2, S 3, S 4

    // Delete existing parameters for these assets to avoid duplicates
    for (const id of targetAssetIds) {
      prepare('DELETE FROM machine_parameters WHERE asset_id = ?').run(id);
    }

    const parameters = [
      // 1. Temp Cooling
      { section: 'Temp Cooling', name: 'Chiller', unit: '°C', a_min: 6, a_max: 11, b_min: 6, b_max: 17 },
      { section: 'Temp Cooling', name: 'Upper Punch Temp', unit: '°C', a_min: 26, a_max: 31, b_min: 26, b_max: 37 },
      { section: 'Temp Cooling', name: 'Lower Punch Temp', unit: '°C', a_min: 16, a_max: 21, b_min: 16, b_max: 27 },

      // 2. Std Pressure Cooling
      { section: 'Std Pressure Cooling', name: 'Up P, Low P, Aux', unit: 'Bar', a_min: 5, a_max: 7, b_min: 4, b_max: 8 },

      // 3. Std Pressure Chiller
      { section: 'Std Pressure Chiller', name: 'Pressure', unit: 'Bar', a_min: 2.5, a_max: 3.7, b_min: 2.0, b_max: 3.7 },

      // 4. Std Pressure Angin
      { section: 'Std Pressure Angin', name: 'Pressure', unit: 'Bar', a_min: 7, a_max: 9, b_min: 6, b_max: 9 },

      // 5. Temp Extruder
      { section: 'Temp Extruder', name: 'Temp Extruder 1', unit: '°C', a_min: 150, a_max: 175, b_min: 150, b_max: 188 },
      { section: 'Temp Extruder', name: 'Temp Extruder 2-5', unit: '°C', a_min: 160, a_max: 185, b_min: 160, b_max: 196 },
      { section: 'Temp Extruder', name: 'Temp Flange Mixer', unit: '°C', a_min: 180, a_max: 190, b_min: 180, b_max: 200 },
      { section: 'Temp Extruder', name: 'Temp Melt Pump', unit: '°C', a_min: 180, a_max: 190, b_min: 180, b_max: 200 },
      { section: 'Temp Extruder', name: 'Temp Body Nozzle', unit: '°C', a_min: 180, a_max: 190, b_min: 180, b_max: 200 },

      // 6. Extruder M2
      { section: 'Extruder M2', name: 'Auto', unit: 'Bar', a_min: 40, a_max: 50, b_min: 40, b_max: 61 },

      // 7. Volumetric Pump M8 / Extruder Speed
      { section: 'Volumetric Pump M8 / Extruder Speed', name: 'Auto', unit: 'Bar', a_min: 60, a_max: 70, b_min: 60, b_max: 81 },

      // 8. Set Point BQ21
      { section: 'Set Point BQ21', name: 'Spindle Position', unit: 'MM', a_min: 45, a_max: 48, b_min: 45, b_max: 52 },
      { section: 'Set Point BQ21', name: 'Exchange Point', unit: 'MM', a_min: 7, a_max: 10, b_min: 7, b_max: 12 },

      // 9. High Pressure
      { section: 'High Pressure', name: 'Pressure', unit: 'Bar', a_min: 150, a_max: 195, b_min: 150, b_max: 206 },

      // 10. Cutting
      { section: 'Cutting', name: 'Temperature', unit: '°C', a_min: 90, a_max: 120, b_min: 90, b_max: 120 },
      { section: 'Cutting', name: 'Spacer', unit: null, a_min: null, a_max: null, b_min: null, b_max: null },
      { section: 'Cutting', name: 'Bridge', unit: null, a_min: null, a_max: null, b_min: null, b_max: null },

      // 11. Temp Clean Room
      { section: 'Temp Clean Room', name: 'Temperature', unit: '°C', a_min: 19, a_max: 23, b_min: 19, b_max: 24 },

      // 12. Pressure Clean Room
      { section: 'Pressure Clean Room', name: 'Pressure', unit: 'Pascal', a_min: 7.1, a_max: null, b_min: 7, b_max: null },
    ];

    const insertStmt = prepare(`
      INSERT INTO machine_parameters (
        asset_id, section, name, unit, 
        setting_a_min, setting_a_max, 
        setting_b_min, setting_b_max,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalSeeded = 0;
    for (const assetId of targetAssetIds) {
      let sortOrder = 1;
      for (const p of parameters) {
        insertStmt.run(
          assetId,
          p.section,
          p.name,
          p.unit,
          p.a_min,
          p.a_max,
          p.b_min,
          p.b_max,
          sortOrder++
        );
        totalSeeded++;
      }
    }

    console.log(`✅ Seeded total ${totalSeeded} parameters for ${targetAssetIds.length} assets (IDs: ${targetAssetIds.join(', ')})`);
  } catch (error) {
    console.error('Error seeding parameters:', error);
  }
}

seedSacmiParameters();
