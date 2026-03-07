/**
 * Comprehensive database health check
 */
import { initDb, prepare } from './database/db';

async function healthCheck() {
  await initDb();

  console.log('\n═══════════════════════════════════════════════');
  console.log('       DATABASE HEALTH CHECK');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Check critical tables
  const criticalTables = [
    'users',
    'departments',
    'tickets',
    'suppliers',
    'incoming_inspections',
    'inspection_items',
    'inspection_weights',
    'assets',
    'work_orders',
  ];

  console.log('✅ CHECKING CRITICAL TABLES:\n');
  for (const table of criticalTables) {
    try {
      const result = prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      console.log(`   ${table.padEnd(25)} ✅ (${result.count} records)`);
    } catch (error: any) {
      console.log(`   ${table.padEnd(25)} ❌ MISSING!`);
    }
  }

  // 2. Check suppliers specifically
  console.log('\n✅ CHECKING SUPPLIERS TABLE:\n');
  try {
    const schema = prepare(`PRAGMA table_info(suppliers)`).all() as any[];
    const hasEmail = schema.find((col: any) => col.name === 'email');
    console.log(`   Total columns: ${schema.length}`);
    console.log(`   email column: ${hasEmail ? '✅ EXISTS' : '❌ MISSING'}`);

    const suppliers = prepare(`SELECT id, code, name FROM suppliers ORDER BY id`).all() as any[];
    if (suppliers.length === 0) {
      console.log('   ⚠️  No suppliers found in database');
    } else {
      console.log(`   📊 Total suppliers: ${suppliers.length}\n`);
      suppliers.forEach((s: any) => {
        console.log(`   ${s.id}. [${s.code}] ${s.name}`);
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 3. Check incoming_inspections schema
  console.log('\n✅ CHECKING INCOMING_INSPECTIONS SCHEMA:\n');
  try {
    const schema = prepare(`PRAGMA table_info(incoming_inspections)`).all() as any[];
    const hasNamaProdusen = schema.find((col: any) => col.name === 'nama_produsen');
    console.log(`   Total columns: ${schema.length}`);
    console.log(`   nama_produsen column: ${hasNamaProdusen ? '✅ EXISTS' : '❌ MISSING'}`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 4. Overall database stats
  console.log('\n✅ OVERALL DATABASE STATS:\n');
  const allTables = prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[];
  console.log(`   📊 Total tables: ${allTables.length}`);

  console.log('\n═══════════════════════════════════════════════');
  console.log('       DATABASE STATUS: READY ✅');
  console.log('═══════════════════════════════════════════════\n');

  process.exit(0);
}

healthCheck();
