import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const defaultDbPath = fs.existsSync(path.join(process.cwd(), 'database.sqlite'))
  ? path.join(process.cwd(), 'database.sqlite')
  : path.join(process.cwd(), 'data', 'database.sqlite');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const connection = new Database(dbPath);
    try {
      connection.pragma('journal_mode = WAL');
      connection.pragma('busy_timeout = 5000');
      connection.exec(`
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
      db = connection;
    } catch (error) {
      connection.close();
      throw error;
    }
  }
  return db;
}

export function initializeDatabase() {
  getDb();
}

// --- USER FUNCTIONS ---
export function getAllUsers() {
  const sqlite = getDb();
  const stmt = sqlite.prepare('SELECT id, username, app_name, created_at FROM users ORDER BY id DESC');
  return stmt.all();
}

export function getAllUsersWithSecrets() {
  const sqlite = getDb();
  const stmt = sqlite.prepare('SELECT id, username, app_name, secret, created_at FROM users ORDER BY id DESC');
  return stmt.all();
}

export function getUserByUsername(username) {
  const sqlite = getDb();
  const stmt = sqlite.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)');
  return stmt.get(username);
}

export function createUser(username, appName, secret) {
  const sqlite = getDb();
  const createdAt = new Date().toISOString();
  const stmt = sqlite.prepare('INSERT INTO users (username, app_name, secret, created_at) VALUES (?, ?, ?, ?)');
  const result = stmt.run(username, appName, secret, createdAt);
  return { id: result.lastInsertRowid, username, appName, secret, createdAt };
}

export function deleteUser(username) {
  const sqlite = getDb();
  const stmt = sqlite.prepare('DELETE FROM users WHERE LOWER(username) = LOWER(?)');
  const result = stmt.run(username);
  return result.changes > 0;
}

export function updateUserSecret(username, newSecret) {
  const sqlite = getDb();
  const stmt = sqlite.prepare('UPDATE users SET secret = ? WHERE LOWER(username) = LOWER(?)');
  const result = stmt.run(newSecret, username);
  return result.changes > 0;
}

// --- ADMIN FUNCTIONS ---
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function getAllAdmins() {
  const sqlite = getDb();
  const stmt = sqlite.prepare('SELECT id, username, created_at FROM admins ORDER BY id DESC');
  return stmt.all();
}

export function getAdminByUsername(username) {
  const sqlite = getDb();
  const stmt = sqlite.prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)');
  return stmt.get(username);
}

export function createAdmin(username, password) {
  const sqlite = getDb();
  const createdAt = new Date().toISOString();
  const stmt = sqlite.prepare('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)');
  const result = stmt.run(username, hashPassword(password), createdAt);
  return { id: result.lastInsertRowid, username, createdAt };
}

export function deleteAdmin(username) {
  const sqlite = getDb();
  const stmt = sqlite.prepare('DELETE FROM admins WHERE LOWER(username) = LOWER(?)');
  const result = stmt.run(username);
  return result.changes > 0;
}

export function verifyAdminPassword(username, password) {
  const admin = getAdminByUsername(username);
  if (!admin) return false;
  return admin.password_hash === hashPassword(password);
}
