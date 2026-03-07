
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Update MCH-001 and MCH-002 to Thermoforming (1)
  db.run("UPDATE assets SET category_id = 1 WHERE asset_code IN ('MCH-001', 'MCH-002')");
  
  // Update MCH-003 to Auxiliary (6)
  db.run("UPDATE assets SET category_id = 6 WHERE asset_code = 'MCH-003'");
  
  // Update MCH-004 to Conveyor (3)
  db.run("UPDATE assets SET category_id = 3 WHERE asset_code = 'MCH-004'");
  
  console.log('Assets updated.');
  
  db.all('SELECT asset_code, category_id FROM assets LIMIT 4', (err, rows) => {
    console.table(rows);
    db.close();
  });
});
