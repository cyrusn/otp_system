#!/bin/bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-otp-system}"

data_mount="$(docker inspect \
  --format '{{range .Mounts}}{{if eq .Destination "/app/data"}}{{.Source}}{{end}}{{end}}' \
  "$CONTAINER_NAME")"

if [[ -z "$data_mount" || ! -d "$data_mount" ]]; then
  echo "Error: $CONTAINER_NAME does not have a valid host directory mounted at /app/data." >&2
  exit 1
fi

if [[ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")" != "true" ]]; then
  echo "Error: container $CONTAINER_NAME is not running." >&2
  exit 1
fi

docker exec -i "$CONTAINER_NAME" node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const rawConfiguredPath = process.env.DATABASE_PATH || '/app/data/database.sqlite';
const configuredPath = rawConfiguredPath.replace(/^(['"])(.*)\1$/, '$2');
const dbPath = path.resolve('/app', configuredPath);
const dataDir = path.resolve('/app/data');
const relativePath = path.relative(dataDir, dbPath);

if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
  throw new Error('DATABASE_PATH must be inside the persistent /app/data mount.');
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const existed = fs.existsSync(dbPath);
const db = new Database(dbPath);

try {
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      app_name TEXT NOT NULL,
      secret TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const integrity = db.pragma('quick_check', { simple: true });
  if (integrity !== 'ok') {
    throw new Error(`SQLite quick_check failed: ${integrity}`);
  }

  console.log(`${existed ? 'Verified' : 'Created'} database at ${dbPath}; SQLite quick_check: ${integrity}.`);
} finally {
  db.close();
}
NODE

echo "Database initialization finished; existing records were not modified."
