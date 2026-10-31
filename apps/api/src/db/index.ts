import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_PATH || "data/fileupload.db";

// Ensure data folder exists
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);

// Enable WAL mode for high concurrency
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 's3',
    endpoint TEXT,
    region TEXT NOT NULL DEFAULT 'us-east-1',
    bucket TEXT NOT NULL,
    path_prefix TEXT,
    access_key_id TEXT NOT NULL,
    secret_access_key_encrypted TEXT NOT NULL,
    public_base_url TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
