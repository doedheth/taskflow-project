import { prepare, saveDb } from '../db';

export function seedSlideshowData() {
  try {
    // 1. Check if we have assets, if not seed some
    const assetCount = prepare(`SELECT COUNT(*) as count FROM assets`).get() as { count: number };
    if (assetCount.count === 0) {
      const assets = [
        ['MCH-001', 'Injection Molding A1', 'operational', 'high', 'Lantai 1'],
        ['MCH-002', 'Injection Molding A2', 'maintenance', 'medium', 'Lantai 1'],
        ['MCH-003', 'CNC Milling Machine', 'down', 'critical', 'Lantai 2'],
        ['MCH-004', 'Packaging Unit B1', 'operational', 'medium', 'Lantai 1'],
      ];

      for (const [code, name, status, criticality, location] of assets) {
        prepare(`
          INSERT INTO assets (asset_code, name, status, criticality, location)
          VALUES (?, ?, ?, ?, ?)
        `).run(code, name, status, criticality, location);
      }
      console.log('✅ Seeded sample assets');
    }

    // 2. Seed some Work Orders if empty
    const woCount = prepare(`SELECT COUNT(*) as count FROM work_orders`).get() as { count: number };
    if (woCount.count === 0) {
      const today = new Date().toISOString().split('T')[0];
      const workOrders = [
        ['WO-2026-001', 'Perbaikan Sensor Molding A2', 'corrective', 'in_progress', 'high', 1],
        ['WO-2026-002', 'Pengecekan Rutin Mingguan', 'preventive', 'open', 'medium', 1],
        ['WO-2026-003', 'Ganti Oli Hidrolik CNC', 'preventive', 'completed', 'low', 3],
      ];

      for (const [num, title, type, status, priority, assetId] of workOrders) {
        prepare(`
          INSERT INTO work_orders (wo_number, title, type, status, priority, asset_id, created_at, actual_end)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(num, title, type, status, priority, assetId);
      }
      console.log('✅ Seeded sample work orders');
    }

    // 3. Seed Production Schedule
    const prodCount = prepare(`SELECT COUNT(*) as count FROM production_schedule`).get() as { count: number };
    if (prodCount.count === 0) {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = Math.floor(Math.random() * 10) + 5;

        for (let j = 0; j < count; j++) {
          prepare(`
            INSERT INTO production_schedule (date, planned_production_minutes, status, asset_id)
            VALUES (?, ?, 'scheduled', 1)
          `).run(dateStr, 480);
        }
      }
      console.log('✅ Seeded production schedule');
    }

    // 4. Seed Downtime Logs
    const downCount = prepare(`SELECT COUNT(*) as count FROM downtime_logs`).get() as { count: number };
    if (downCount.count === 0) {
      const logs = [
        [1, 'Sensor Overheat', 45, 'unplanned', 1],
        [3, 'Mechanical Failure', 120, 'unplanned', 2],
      ];

      for (const [assetId, reason, duration, type, classId] of logs) {
        prepare(`
          INSERT INTO downtime_logs (asset_id, reason, duration_minutes, downtime_type, classification_id, start_time)
          VALUES (?, ?, ?, ?, ?, datetime('now', '-2 hours'))
        `).run(assetId, reason, duration, type, classId);
      }
      console.log('✅ Seeded downtime logs');
    }

    // 5. Seed Solar Data (14 days trend)
    const solarCount = prepare(`SELECT COUNT(*) as count FROM solar_energy_data`).get() as { count: number };
    if (solarCount.count === 0) {
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const huawei = 40 + Math.random() * 20;
        const manual = huawei - (Math.random() * 5);

        prepare(`
          INSERT INTO solar_energy_data (date, product_power, manual_kwh)
          VALUES (?, ?, ?)
        `).run(dateStr, huawei, manual);
      }
      console.log('✅ Seeded solar data (14 days trend)');
    }

    saveDb();
  } catch (error) {
    console.error('Seeding slideshow data failed:', error);
  }
}
