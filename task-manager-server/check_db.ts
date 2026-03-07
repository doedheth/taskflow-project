
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

console.log('--- DB Path:', dbPath);

console.log('--- Recent Downtime Logs ---');
db.all(`
  SELECT dl.id, dl.asset_id, dl.failure_code_id, dl.reason, fc.category, fc.code
  FROM downtime_logs dl
  LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
  ORDER BY dl.id DESC
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }

  console.log('--- Recent Failure Codes ---');
  db.all(`
    SELECT id, code, category, description FROM failure_codes ORDER BY id DESC LIMIT 5
  `, (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.table(rows);
    }
    db.close();
  });
});
