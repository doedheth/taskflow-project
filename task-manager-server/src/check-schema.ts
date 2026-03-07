/**
 * Check if nama_produsen column exists in incoming_inspections table
 */
import { initDb, prepare } from './database/db';

async function checkSchema() {
  await initDb();

  console.log('\n=== INCOMING_INSPECTIONS TABLE SCHEMA ===\n');

  const schema = prepare(`PRAGMA table_info(incoming_inspections)`).all();

  schema.forEach((col: any) => {
    console.log(`${col.cid}: ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });

  // Check if nama_produsen column exists
  const hasNamaProdusen = schema.find((col: any) => col.name === 'nama_produsen');

  console.log('\n=== RESULT ===');
  console.log(`nama_produsen column exists: ${hasNamaProdusen ? 'YES ✅' : 'NO ❌'}`);

  if (!hasNamaProdusen) {
    console.log('\n⚠️  The nama_produsen column is missing from the database!');
    console.log('This means the migration did not run successfully.');
    console.log('\nTo fix this, you need to either:');
    console.log('1. Delete the database file and restart the server to recreate it');
    console.log('2. Or manually add the column using ALTER TABLE');
  } else {
    console.log('\n✅ The column exists! The database is properly configured.');
  }

  process.exit(0);
}

checkSchema();
