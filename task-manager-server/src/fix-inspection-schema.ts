/**
 * Migration: Add missing columns to incoming_inspections table
 * This fixes the schema mismatch between the CREATE TABLE and the actual database
 */

import { initDb, exec, saveDb } from './database/db';

async function fixIncomingInspectionsSchema() {
  await initDb();

  console.log('🔧 Adding missing columns to incoming_inspections table...');

  try {
    // Add all missing columns from the schema
    const missingColumns = [
      'nama_produsen TEXT',
      'negara_produsen TEXT',
      'logo_halal TEXT',
      'total_items_received_text TEXT',
      'warehouse_signature TEXT',
      'packaging_notes TEXT',
      'vehicle_on_time_delivery INTEGER DEFAULT 1',
      'item_closed_tight INTEGER DEFAULT 1',
      'item_no_haram INTEGER DEFAULT 1',
      'pkg_condition TEXT',
      'pkg_name_check TEXT',
      'pkg_hazard_label TEXT',
      'material_type TEXT',
      'warna TEXT',
      'jumlah_sampling TEXT',
      'tanggal_produksi TEXT',
      'item_name TEXT',
      'supervisor_signature TEXT',
      'packaging_unit TEXT DEFAULT \'BOX\'',
      'surat_jalan_photo_url TEXT',
      'ttb_photo_url TEXT',
      'coa_photo_url TEXT',
    ];

    for (const column of missingColumns) {
      const columnName = column.split(' ')[0];
      try {
        exec(`ALTER TABLE incoming_inspections ADD COLUMN ${column}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error: any) {
        if (error.message?.includes('duplicate column')) {
          console.log(`⏭️  Column ${columnName} already exists, skipping`);
        } else {
          console.error(`❌ Failed to add column ${columnName}:`, error.message);
        }
      }
    }

    saveDb();
    console.log('🎉 Schema fix complete!');

    // Verify the fix
    console.log('\n📋 Verifying schema...');
    const { prepare } = await import('./database/db');
    const schema = prepare(`PRAGMA table_info(incoming_inspections)`).all();
    const hasNamaProdusen = schema.find((col: any) => col.name === 'nama_produsen');

    if (hasNamaProdusen) {
      console.log('✅ nama_produsen column now exists!');
      console.log(`📊 Total columns: ${schema.length}`);
    } else {
      console.log('❌ nama_produsen column still missing!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  process.exit(0);
}

fixIncomingInspectionsSchema();
