const Database = require('better-sqlite3');
const db = new Database('./task-manager-server/data/database.sqlite');

console.log('\n=== INCOMING_INSPECTIONS TABLE SCHEMA ===\n');
const schema = db.prepare("PRAGMA table_info(incoming_inspections)").all();
schema.forEach(col => {
  console.log(`${col.cid}: ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
});

// Check if nama_produsen column exists
const hasNamaProdusen = schema.find(col => col.name === 'nama_produsen');
console.log('\n=== RESULT ===');
console.log(`nama_produsen column exists: ${hasNamaProdusen ? 'YES ✅' : 'NO ❌'}`);

db.close();
