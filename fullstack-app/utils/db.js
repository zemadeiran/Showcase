import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../db/data.db');
const SCHEMA_FILE = path.join(__dirname, '../db/schema.sql');

// Initialize SQLite database using Node.js built-in module
const db = new DatabaseSync(DB_FILE);

// Configure WAL mode for better performance
db.exec('PRAGMA journal_mode=WAL');           // Write-Ahead Logging
db.exec('PRAGMA synchronous=NORMAL');         // Faster, still safe
db.exec('PRAGMA cache_size=-64000');          // 64MB cache
db.exec('PRAGMA temp_store=MEMORY');          // Temp tables in memory
db.exec('PRAGMA mmap_size=268435456');        // 256MB memory-mapped I/O
db.exec('PRAGMA wal_autocheckpoint=1000');    // Checkpoint every 1000 pages

console.log('Database configured with WAL mode');

// Load and execute schema
try {
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
  db.exec(schema);
  console.log('Database schema initialized successfully');
} catch (error) {
  console.error('Error initializing database schema:', error);
}

// Helper functions for database operations
export function readItems() {
  try {
    const stmt = db.prepare('SELECT * FROM items ORDER BY created_at DESC');
    return stmt.all();
  } catch (error) {
    console.error('Error reading items:', error);
    return [];
  }
}

export function createItem(title, description = '') {
  try {
    const stmt = db.prepare('INSERT INTO items (title, description) VALUES (?, ?)');
    const result = stmt.run(title, description);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating item:', error);
    return null;
  }
}

export function updateItem(id, title, description) {
  try {
    const stmt = db.prepare('UPDATE items SET title = ?, description = ? WHERE id = ?');
    stmt.run(title, description, id);
    return true;
  } catch (error) {
    console.error('Error updating item:', error);
    return false;
  }
}

export function deleteItem(id) {
  try {
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

// User functions
export function createUser(email, passwordHash, fullName = null, meta = {}) {
  try {
    const metaJson = JSON.stringify(meta);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, full_name, meta) VALUES (?, ?, ?, ?)');
    const result = stmt.run(email, passwordHash, fullName, metaJson);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export function getUserById(id) {
  try {
    const stmt = db.prepare('SELECT id, email, full_name, meta, created_at, last_login, is_active, role FROM users WHERE id = ?');
    const user = stmt.get(id);
    if (user && user.meta) {
      user.meta = JSON.parse(user.meta);
    }
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export function getUserByEmail(email) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    if (user && user.meta) {
      user.meta = JSON.parse(user.meta);
    }
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Search users by JSON field in meta
 * Example: searchUsersByMeta('phone', '555-1234')
 * Example: searchUsersByMeta('country', 'USA')
 */
export function searchUsersByMeta(key, value) {
  try {
    const stmt = db.prepare(`SELECT id, email, full_name, meta, created_at FROM users WHERE json_extract(meta, ?) = ?`);
    const users = stmt.all(`$.${key}`, value);
    return users.map(user => {
      if (user.meta) user.meta = JSON.parse(user.meta);
      return user;
    });
  } catch (error) {
    console.error('Error searching users by meta:', error);
    return [];
  }
}

export function updateUser(id, data) {
  try {
    const fields = [];
    const values = [];
    
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.meta !== undefined) {
      fields.push('meta = ?');
      values.push(JSON.stringify(data.meta));
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}

/**
 * Update a specific field in user's meta JSON
 * Example: updateUserMeta(1, 'phone', '555-1234')
 */
export function updateUserMeta(userId, key, value) {
  try {
    const stmt = db.prepare(`UPDATE users SET meta = json_set(meta, ?, ?) WHERE id = ?`);
    stmt.run(`$.${key}`, value, userId);
    return true;
  } catch (error) {
    console.error('Error updating user meta:', error);
    return false;
  }
}

export function updateLastLogin(userId) {
  try {
    const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(userId);
    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
}

export function getAllUsers() {
  try {
    const stmt = db.prepare('SELECT id, email, full_name, meta, created_at, last_login, is_active, role FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    return users.map(user => {
      if (user.meta) user.meta = JSON.parse(user.meta);
      return user;
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export default db;
