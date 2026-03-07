
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

console.log('--- Downtime Classifications ---');
db.all('SELECT * FROM downtime_classifications', (err, rows) => {
  if (err) console.error(err);
  else console.table(rows);
  db.close();
});
