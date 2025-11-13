# Node.js SQLite API Reference

Complete reference for `node:sqlite` module (Node.js v22.15.0+)

---

## Module Exports

```javascript
import { DatabaseSync, StatementSync, constants } from 'node:sqlite';
```

- **DatabaseSync** - Main database class
- **StatementSync** - Prepared statement class
- **constants** - SQLite constants for changesets

---

## DatabaseSync Class

### Constructor

```javascript
const db = new DatabaseSync(filename, options);
```

**Parameters:**
- `filename` (string): Database file path or `:memory:` for in-memory
- `options` (object, optional):
  - `open` (boolean): Whether to open immediately (default: true)
  - `readOnly` (boolean): Open in read-only mode
  - `enableForeignKeyConstraints` (boolean): Enable foreign keys
  - `enableDoubleQuotedStringLiterals` (boolean): Allow double-quoted strings

**Examples:**
```javascript
// In-memory database
const db = new DatabaseSync(':memory:');

// File database
const db = new DatabaseSync('./data.db');

// With options
const db = new DatabaseSync('./data.db', {
  enableForeignKeyConstraints: true
});
```

---

### Methods

#### `exec(sql)`

Execute SQL statements (no return value).

```javascript
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
db.exec('INSERT INTO users VALUES (1, "Alice")');
db.exec('PRAGMA journal_mode=WAL');
```

**Use for:**
- DDL (CREATE, ALTER, DROP)
- Multiple statements
- PRAGMA commands

---

#### `prepare(sql)`

Create a prepared statement.

```javascript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(1);
```

**Returns:** StatementSync object

---

#### `close()`

Close the database connection.

```javascript
db.close();
```

---

#### `open()`

Open a previously closed database.

```javascript
db.open();
```

---

#### `function(name, options, func)`

Register a custom SQL function.

```javascript
db.function('add', { deterministic: true }, (a, b) => a + b);

const result = db.prepare('SELECT add(2, 3) as sum').get();
// { sum: 5 }
```

**Options:**
- `deterministic` (boolean): Function always returns same result for same inputs
- `directOnly` (boolean): Function can only be called from top-level SQL
- `varargs` (boolean): Function accepts variable number of arguments

---

#### `createSession(options)` ✅ Available

Create a session for change tracking.

```javascript
const session = db.createSession({ table: 'users' });

// Make changes
db.prepare('INSERT INTO users VALUES (?, ?)').run(1, 'Alice');

// Get changeset
const changeset = session.changeset();
```

**Options:**
- `table` (string): Track changes to specific table (optional, tracks all if omitted)

**Returns:** Session object

---

#### `applyChangeset(changeset, options)` ✅ Available

Apply a changeset to the database.

```javascript
const db2 = new DatabaseSync(':memory:');
db2.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');

db2.applyChangeset(changeset);
```

**Options:**
- `filter` (function): Filter which changes to apply
- `onConflict` (function): Handle conflicts

---

#### `enableLoadExtension(enabled)`

Enable/disable loading SQLite extensions.

```javascript
db.enableLoadExtension(true);
```

---

#### `loadExtension(path)`

Load a SQLite extension.

```javascript
db.loadExtension('./my-extension.so');
```

---

## StatementSync Class

### Methods

#### `run(...params)`

Execute statement, return info about changes.

```javascript
const stmt = db.prepare('INSERT INTO users VALUES (?, ?)');
const result = stmt.run(1, 'Alice');

console.log(result);
// {
//   changes: 1,
//   lastInsertRowid: 1
// }
```

**Returns:**
- `changes` (number): Number of rows modified
- `lastInsertRowid` (number): ID of last inserted row

---

#### `get(...params)`

Execute statement, return first row.

```javascript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(1);

console.log(user);
// { id: 1, name: 'Alice' }
```

**Returns:** Object or `undefined`

---

#### `all(...params)`

Execute statement, return all rows.

```javascript
const stmt = db.prepare('SELECT * FROM users');
const users = stmt.all();

console.log(users);
// [
//   { id: 1, name: 'Alice' },
//   { id: 2, name: 'Bob' }
// ]
```

**Returns:** Array of objects

---

#### `iterate(...params)`

Execute statement, return iterator.

```javascript
const stmt = db.prepare('SELECT * FROM users');

for (const user of stmt.iterate()) {
  console.log(user);
}
```

**Returns:** Iterator

---

#### `setReadBigInts(enabled)`

Return BigInt for INTEGER columns.

```javascript
stmt.setReadBigInts(true);
const result = stmt.get();
// { id: 1n, count: 1000000n }
```

---

#### `setAllowBareNamedParameters(enabled)`

Allow named parameters without prefix.

```javascript
stmt.setAllowBareNamedParameters(true);
stmt.run({ name: 'Alice' }); // Instead of { $name: 'Alice' }
```

---

#### `setAllowUnknownNamedParameters(enabled)`

Allow unknown named parameters.

```javascript
stmt.setAllowUnknownNamedParameters(true);
```

---

## Session Class

Created by `db.createSession()`.

### Methods

#### `changeset()`

Get binary changeset of all changes since session creation.

```javascript
const changeset = session.changeset();
console.log(changeset); // Uint8Array
```

**Returns:** Uint8Array containing changeset

---

#### `patchset()`

Get binary patchset (similar to changeset, different format).

```javascript
const patchset = session.patchset();
```

**Returns:** Uint8Array containing patchset

---

#### `close()`

Close the session.

```javascript
session.close();
```

---

## Constants

```javascript
import { constants } from 'node:sqlite';
```

### Changeset Constants

```javascript
constants.SQLITE_CHANGESET_OMIT      // 0
constants.SQLITE_CHANGESET_REPLACE   // 1
constants.SQLITE_CHANGESET_ABORT     // 2
constants.SQLITE_CHANGESET_DATA      // 1
constants.SQLITE_CHANGESET_NOTFOUND  // 2
constants.SQLITE_CHANGESET_CONFLICT  // 3
constants.SQLITE_CHANGESET_CONSTRAINT // 4
constants.SQLITE_CHANGESET_FOREIGN_KEY // 5
```

---

## Complete Example

```javascript
import { DatabaseSync } from 'node:sqlite';

// Create databases
const diskDb = new DatabaseSync('./data.db');
diskDb.exec('PRAGMA journal_mode=WAL');
diskDb.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');

const ramDb = new DatabaseSync(':memory:');
ramDb.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');

// Create session for change tracking
const session = diskDb.createSession({ table: 'users' });

// Prepared statements
const insertStmt = diskDb.prepare('INSERT INTO users VALUES (?, ?)');
const selectStmt = ramDb.prepare('SELECT * FROM users');

// Make changes
insertStmt.run(1, 'Alice');
insertStmt.run(2, 'Bob');

// Get changeset
const changeset = session.changeset();
console.log(`Changeset size: ${changeset.length} bytes`);

// Apply to RAM database
ramDb.applyChangeset(changeset);

// Query from RAM
const users = selectStmt.all();
console.log('Users in RAM:', users);
// [
//   { id: 1, name: 'Alice' },
//   { id: 2, name: 'Bob' }
// ]

// Cleanup
session.close();
diskDb.close();
ramDb.close();
```

---

## What's Available vs Not Available

### ✅ Available in Node.js

| Feature | Status | Notes |
|---------|--------|-------|
| **DatabaseSync** | ✅ | Full support |
| **StatementSync** | ✅ | Full support |
| **Sessions API** | ✅ | `createSession()`, `changeset()`, `patchset()` |
| **Apply Changeset** | ✅ | `applyChangeset()` |
| **WAL Mode** | ✅ | Via `PRAGMA journal_mode=WAL` |
| **Custom Functions** | ✅ | `db.function()` |
| **Extensions** | ✅ | `enableLoadExtension()`, `loadExtension()` |
| **Prepared Statements** | ✅ | `db.prepare()` |
| **Transactions** | ✅ | Via `BEGIN/COMMIT` |
| **Named Parameters** | ✅ | `:name`, `$name`, `@name` |
| **BigInt Support** | ✅ | `setReadBigInts()` |

### ❌ Not Available in Node.js

| Feature | Status | Workaround |
|---------|--------|------------|
| **backup() API** | ❌ | Manual copy via SELECT/INSERT |
| **Async/Promise API** | ❌ | Only sync API available |
| **Streaming Results** | ⚠️ | Use `iterate()` for memory efficiency |
| **Connection Pooling** | ❌ | Use cluster mode with shared file |
| **Encryption** | ❌ | Use SQLCipher extension or file encryption |

---

## Performance Tips

### 1. Use Prepared Statements

```javascript
// Bad: Compiles every time
for (let i = 0; i < 1000; i++) {
  db.prepare('INSERT INTO users VALUES (?, ?)').run(i, `user${i}`);
}

// Good: Compile once
const stmt = db.prepare('INSERT INTO users VALUES (?, ?)');
for (let i = 0; i < 1000; i++) {
  stmt.run(i, `user${i}`);
}
```

### 2. Use Transactions for Bulk Operations

```javascript
db.exec('BEGIN TRANSACTION');
const stmt = db.prepare('INSERT INTO users VALUES (?, ?)');
for (let i = 0; i < 1000; i++) {
  stmt.run(i, `user${i}`);
}
db.exec('COMMIT');
// 100x faster!
```

### 3. Enable WAL Mode

```javascript
db.exec('PRAGMA journal_mode=WAL');
// Better concurrency, faster writes
```

### 4. Use Sessions API for Replication

```javascript
const session = db.createSession({ table: 'users' });

// Make changes...

// Only replicate changes (16-165x faster than full backup)
const changeset = session.changeset();
replicaDb.applyChangeset(changeset);
```

---

## Common Patterns

### Pattern 1: Disk + RAM Hybrid

```javascript
// Disk for persistence
const diskDb = new DatabaseSync('./data.db');
diskDb.exec('PRAGMA journal_mode=WAL');

// RAM for fast reads
const ramDb = new DatabaseSync(':memory:');

// Session for incremental sync
const session = diskDb.createSession();

// Writes to disk
diskDb.prepare('INSERT...').run(...);

// Periodic sync to RAM
setInterval(() => {
  const changeset = session.changeset();
  if (changeset.length > 0) {
    ramDb.applyChangeset(changeset);
  }
}, 5000);

// Reads from RAM (fast!)
ramDb.prepare('SELECT...').all();
```

### Pattern 2: Cluster with Shared Database

```javascript
import cluster from 'cluster';

if (cluster.isPrimary) {
  const db = new DatabaseSync('./data.db');
  
  cluster.on('message', (worker, msg) => {
    if (msg.type === 'query') {
      const result = db.prepare(msg.sql).all(...msg.params);
      worker.send({ id: msg.id, result });
    }
  });
} else {
  // Workers send queries to primary via IPC
}
```

### Pattern 3: Custom Aggregate Functions

```javascript
db.function('sum_squares', {
  deterministic: true,
  varargs: true
}, (...numbers) => {
  return numbers.reduce((sum, n) => sum + n * n, 0);
});

const result = db.prepare('SELECT sum_squares(1, 2, 3, 4) as result').get();
// { result: 30 }
```

---

## Summary

**Node.js SQLite module provides:**
- ✅ Full synchronous SQLite API
- ✅ Sessions API for change tracking
- ✅ Prepared statements
- ✅ Custom functions
- ✅ WAL mode support
- ✅ Extension loading

**Missing features:**
- ❌ Async/Promise API (sync only)
- ❌ Built-in backup() method
- ❌ Connection pooling

**Best for:**
- Server-side Node.js applications
- Embedded databases
- Development/testing
- Edge computing (Cloudflare Workers, etc.)

**Performance:** Excellent with proper usage (WAL mode, prepared statements, transactions)
