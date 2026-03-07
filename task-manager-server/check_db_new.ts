
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

console.log('--- Checking for logs with new failure codes ---');
db.all(`
  SELECT dl.id, dl.asset_id, dl.failure_code_id, dl.reason, fc.category, fc.code
  FROM downtime_logs dl
  JOIN failure_codes fc ON dl.failure_code_id = fc.id
  WHERE dl.failure_code_id > 20
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
  db.close();
});
