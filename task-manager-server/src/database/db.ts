import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { DBRunResult, DBStatement } from '../types';

const DB_ENV_PATH = process.env.DATABASE_PATH || 'data/taskmanager.db';
const dbPath = path.isAbsolute(DB_ENV_PATH)
  ? DB_ENV_PATH
  : path.join(__dirname, '../../', DB_ENV_PATH);

const dataDir = path.dirname(dbPath);

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function initDb(): Promise<Database> {
  console.log('🔄 initDb called');
  if (db) return db;

  try {
    SQL = await initSqlJs();
    console.log('✅ SQL.js initialized');
  } catch (e) {
    console.error('❌ SQL.js failed:', e);
    throw e;
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  return db;
}

export function saveDb(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

export function prepare(sql: string): DBStatement {
  return {
    run: (...params: unknown[]): DBRunResult => {
      if (!db) throw new Error('Database not initialized.');
      db.run(sql, params as (string | number | null | Uint8Array)[]);
      const changes = db.getRowsModified();
      const lastIdResult = db.exec('SELECT last_insert_rowid()');
      const lastInsertRowid = (lastIdResult[0]?.values[0]?.[0] as number) || 0;
      saveDb();
      return {
        changes,
        lastInsertRowid,
      };
    },
    get: (...params: unknown[]): unknown | undefined => {
      if (!db) throw new Error('Database not initialized.');
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params: unknown[]): unknown[] => {
      if (!db) throw new Error('Database not initialized.');
      const results: unknown[] = [];
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
  };
}

export function exec(sql: string): void {
  if (!db) throw new Error('Database not initialized.');
  db.exec(sql);
  saveDb();
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized.');
  return db;
}

// Run a SQL statement with parameters (shortcut for prepare().run())
export function run(sql: string, params: unknown[] = []): DBRunResult {
  return prepare(sql).run(...params);
}

// Default export for simpler imports
const dbModule = {
  initDb,
  saveDb,
  prepare,
  exec,
  getDb,
  run,
};

export default dbModule;
