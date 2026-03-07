import db from '../db';

export function migrateDigitalSignageV2() {
  try {
    // 1. Templates Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        layout_type TEXT DEFAULT 'single',
        layout_config TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Orientation Settings
    db.exec(`
      CREATE TABLE IF NOT EXISTS orientation_settings (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        orientation_type TEXT DEFAULT 'landscape', -- 'portrait', 'landscape'
        width INTEGER,
        height INTEGER,
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // 3. Playlists
    db.exec(`
      CREATE TABLE IF NOT EXISTS slideshow_playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        priority INTEGER DEFAULT 0,
        FOREIGN KEY (template_id) REFERENCES templates(id)
      )
    `);

    // 4. Slides
    db.exec(`
      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        title TEXT,
        type TEXT NOT NULL, -- 'image', 'video', 'text'
        content TEXT NOT NULL,
        duration INTEGER DEFAULT 10,
        order_index INTEGER DEFAULT 0,
        metadata TEXT, -- JSON metadata for text slides
        FOREIGN KEY (playlist_id) REFERENCES slideshow_playlists(id) ON DELETE CASCADE
      )
    `);

    // 5. Schedules
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        playlist_id TEXT NOT NULL,
        start_time TEXT, -- HH:mm
        end_time TEXT,
        days_of_week TEXT, -- '1,2,3,4,5'
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (playlist_id) REFERENCES slideshow_playlists(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Digital Signage V2 tables migrated');
  } catch (error) {
    console.error('❌ Digital Signage migration failed:', error);
  }
}
