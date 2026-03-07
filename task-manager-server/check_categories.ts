
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = 'd:\\SAP\\task-manager-server\\data\\taskmanager.db';
const db = new sqlite3.Database(dbPath);

console.log('--- Checking for failure codes with category "maintenance" or "production" ---');
db.all(`
  SELECT * FROM failure_codes 
  WHERE category IN ('maintenance', 'production', 'Maintenance', 'Production')
`, (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.table(rows);
  }
  
  console.log('--- Checking all unique failure categories ---');
  db.all(`SELECT DISTINCT category FROM failure_codes`, (err, rows) => {
    console.table(rows);
    db.close();
  });
});
