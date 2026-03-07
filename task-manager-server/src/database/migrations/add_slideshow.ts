import { prepare, exec, saveDb } from '../db';

export function migrateSlideshow() {
  try {
    exec(`
      CREATE TABLE IF NOT EXISTS slideshow_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slide_type TEXT NOT NULL,           -- 'kpi-summary', 'production', 'maintenance', 'downtime', 'solar'
        slide_order INTEGER NOT NULL,       -- Display order
        duration_seconds INTEGER DEFAULT 30, -- Per-slide duration
        enabled BOOLEAN DEFAULT 1,           -- Toggle visibility
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if table is empty, if so seed it
    const existing = prepare(`SELECT COUNT(*) as count FROM slideshow_configs`).get() as { count: number };

    if (existing.count === 0) {
      console.log('ℹ️ Slideshow table is empty');
    }

    saveDb();
    console.log('✅ Slideshow table migration completed');
  } catch (error) {
    console.error('Slideshow migration failed:', error);
  }
}
