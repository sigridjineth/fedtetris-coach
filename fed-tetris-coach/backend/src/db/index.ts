import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

let db: Database | null = null;

export async function initDb() {
  if (db) return db;

  const dbPath = path.resolve(__dirname, '../../agentfs.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const schemaPath = path.resolve(__dirname, './schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  await db.exec(schema);
  console.log('Database initialized at', dbPath);
  
  return db;
}

export async function getDb() {
  if (!db) await initDb();
  return db!;
}
