
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

console.log('--- Checking failure codes 1, 2, 3, 6 ---');
db.all('SELECT * FROM failure_codes WHERE id IN (1, 2, 3, 6)', (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
  db.close();
});
