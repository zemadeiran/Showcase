# SQLite Extensions for Node.js

Guide to SQLite extensions available and how to use them with Node.js.

---

## Built-in Extensions Status

### ✅ Enabled in Node.js SQLite

| Extension | Status | Description |
|-----------|--------|-------------|
| **Math Functions** | ✅ Enabled | 27+ math functions (sin, cos, sqrt, etc.) |
| **Sessions API** | ✅ Enabled | Change tracking (changeset/patchset) |
| **Preupdate Hook** | ✅ Enabled | Track changes before they happen |
| **WAL Mode** | ✅ Enabled | Write-Ahead Logging |
| **Threads** | ✅ Enabled | Thread-safe operations |

### ❌ NOT Enabled by Default

| Extension | Status | Workaround |
|-----------|--------|------------|
| **JSON1** | ❌ Not enabled | Use JavaScript JSON methods |
| **FTS5** | ❌ Not enabled | Use LIKE or external search |
| **FTS3/4** | ❌ Not enabled | Use LIKE or external search |
| **R-Tree** | ❌ Not enabled | Use manual spatial queries |
| **REGEXP** | ❌ Not enabled | Use JavaScript regex |
| **Geopoly** | ❌ Not enabled | Use external library |
| **ICU** | ❌ Not enabled | Use JavaScript Intl API |

### ⚠️ Extension Loading

```javascript
db.enableLoadExtension(true);
// Error: Cannot enable extension loading because 
// it was disabled at database creation
```

**Extension loading is DISABLED in Node.js SQLite** for security reasons.

---

## Available Math Functions

Node.js SQLite includes 27+ math functions:

```javascript
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(':memory:');

// Trigonometric
db.prepare('SELECT sin(1.5708) as result').get();    // ~1.0
db.prepare('SELECT cos(0) as result').get();         // 1.0
db.prepare('SELECT tan(0.7854) as result').get();    // ~1.0

// Inverse trig
db.prepare('SELECT asin(1) as result').get();        // 1.5708
db.prepare('SELECT acos(0) as result').get();        // 1.5708
db.prepare('SELECT atan(1) as result').get();        // 0.7854
db.prepare('SELECT atan2(1, 1) as result').get();    // 0.7854

// Hyperbolic
db.prepare('SELECT sinh(1) as result').get();        // 1.1752
db.prepare('SELECT cosh(1) as result').get();        // 1.5431
db.prepare('SELECT tanh(1) as result').get();        // 0.7616

// Exponential/Logarithmic
db.prepare('SELECT exp(1) as result').get();         // 2.7183 (e)
db.prepare('SELECT ln(2.7183) as result').get();     // 1.0
db.prepare('SELECT log(100) as result').get();       // 2.0 (log10)
db.prepare('SELECT log2(8) as result').get();        // 3.0

// Power/Root
db.prepare('SELECT pow(2, 3) as result').get();      // 8.0
db.prepare('SELECT sqrt(16) as result').get();       // 4.0

// Rounding
db.prepare('SELECT ceil(1.1) as result').get();      // 2.0
db.prepare('SELECT floor(1.9) as result').get();     // 1.0
db.prepare('SELECT trunc(1.9) as result').get();     // 1.0

// Other
db.prepare('SELECT pi() as result').get();           // 3.1416
db.prepare('SELECT degrees(1.5708) as result').get(); // 90.0
db.prepare('SELECT radians(90) as result').get();    // 1.5708
db.prepare('SELECT mod(10, 3) as result').get();     // 1
```

---

## Workarounds for Missing Extensions

### 1. JSON1 Alternative

**Instead of JSON1 extension:**
```sql
-- ❌ Not available
SELECT json_extract(data, '$.name') FROM table;
```

**Use JavaScript:**
```javascript
const rows = db.prepare('SELECT data FROM table').all();
const results = rows.map(row => {
  const json = JSON.parse(row.data);
  return json.name;
});
```

**Or store as separate columns:**
```sql
-- ✅ Better approach
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT,
  metadata TEXT  -- JSON as text, parse in JS
);
```

---

### 2. FTS5 (Full-Text Search) Alternative

**Instead of FTS5:**
```sql
-- ❌ Not available
CREATE VIRTUAL TABLE docs USING fts5(title, body);
SELECT * FROM docs WHERE docs MATCH 'search term';
```

**Use LIKE (simple):**
```javascript
const results = db.prepare(`
  SELECT * FROM docs 
  WHERE title LIKE ? OR body LIKE ?
`).all('%search%', '%search%');
```

**Use JavaScript search (better):**
```javascript
const rows = db.prepare('SELECT * FROM docs').all();
const searchTerm = 'search';
const results = rows.filter(row => 
  row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  row.body.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Use external library (best):**
```javascript
import Fuse from 'fuse.js';

const rows = db.prepare('SELECT * FROM docs').all();
const fuse = new Fuse(rows, {
  keys: ['title', 'body'],
  threshold: 0.3
});

const results = fuse.search('search term');
```

---

### 3. REGEXP Alternative

**Instead of REGEXP:**
```sql
-- ❌ Not available
SELECT * FROM users WHERE email REGEXP '^[a-z]+@example.com$';
```

**Use JavaScript:**
```javascript
const rows = db.prepare('SELECT * FROM users').all();
const regex = /^[a-z]+@example\.com$/;
const results = rows.filter(row => regex.test(row.email));
```

**Or use custom function:**
```javascript
db.function('regexp', { deterministic: true }, (pattern, text) => {
  const regex = new RegExp(pattern);
  return regex.test(text) ? 1 : 0;
});

// Now you can use REGEXP!
const results = db.prepare(`
  SELECT * FROM users WHERE regexp('^[a-z]+@example.com$', email)
`).all();
```

---

### 4. R-Tree (Spatial Index) Alternative

**Instead of R-Tree:**
```sql
-- ❌ Not available
CREATE VIRTUAL TABLE locations USING rtree(id, minX, maxX, minY, maxY);
```

**Use manual spatial queries:**
```javascript
// Store coordinates as regular columns
db.exec(`
  CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    x REAL,
    y REAL
  );
  CREATE INDEX idx_locations_x ON locations(x);
  CREATE INDEX idx_locations_y ON locations(y);
`);

// Query with bounding box
const results = db.prepare(`
  SELECT * FROM locations
  WHERE x BETWEEN ? AND ?
    AND y BETWEEN ? AND ?
`).all(minX, maxX, minY, maxY);
```

**Or use external library:**
```javascript
import rbush from 'rbush';

// Load all points into R-tree
const tree = rbush();
const points = db.prepare('SELECT * FROM locations').all();
tree.load(points.map(p => ({
  minX: p.x, minY: p.y,
  maxX: p.x, maxY: p.y,
  data: p
})));

// Fast spatial queries
const results = tree.search({
  minX: 0, minY: 0,
  maxX: 100, maxY: 100
});
```

---

## Custom Functions (Workaround for Missing Extensions)

You can implement missing functionality with custom functions:

### Example: REGEXP Function

```javascript
db.function('regexp', { deterministic: true }, (pattern, text) => {
  const regex = new RegExp(pattern);
  return regex.test(text) ? 1 : 0;
});

// Usage
db.prepare('SELECT * FROM users WHERE regexp(?, email)').all('^[a-z]+@');
```

### Example: JSON_EXTRACT Function

```javascript
db.function('json_extract', { deterministic: true }, (json, path) => {
  try {
    const obj = JSON.parse(json);
    const keys = path.replace('$.', '').split('.');
    let value = obj;
    for (const key of keys) {
      value = value[key];
    }
    return value;
  } catch {
    return null;
  }
});

// Usage
db.prepare('SELECT json_extract(data, ?) as name FROM users').all('$.name');
```

### Example: SOUNDEX Function

```javascript
function soundex(str) {
  const code = str.toUpperCase().charAt(0);
  const rest = str.slice(1)
    .replace(/[AEIOUYHW]/g, '0')
    .replace(/[BFPV]/g, '1')
    .replace(/[CGJKQSXZ]/g, '2')
    .replace(/[DT]/g, '3')
    .replace(/[L]/g, '4')
    .replace(/[MN]/g, '5')
    .replace(/[R]/g, '6')
    .replace(/0+/g, '')
    .replace(/(\d)\1+/g, '$1');
  return (code + rest + '000').slice(0, 4);
}

db.function('soundex', { deterministic: true }, soundex);

// Find similar names
db.prepare('SELECT * FROM users WHERE soundex(name) = soundex(?)').all('John');
```

---

## External Extension Options

### Option 1: Compile SQLite with Extensions

You can compile SQLite yourself with extensions enabled:

```bash
# Download SQLite source
wget https://www.sqlite.org/2024/sqlite-autoconf-3490100.tar.gz
tar xzf sqlite-autoconf-3490100.tar.gz
cd sqlite-autoconf-3490100

# Configure with extensions
./configure \
  --enable-fts5 \
  --enable-json1 \
  --enable-rtree \
  CFLAGS="-DSQLITE_ENABLE_FTS5 -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_RTREE"

# Build
make

# Use the compiled library
```

**Note:** Node.js uses its own bundled SQLite, so this won't help unless you rebuild Node.js.

---

### Option 2: Use better-sqlite3 Package

The `better-sqlite3` npm package has more extensions enabled:

```bash
npm install better-sqlite3
```

```javascript
import Database from 'better-sqlite3';

const db = new Database(':memory:');

// FTS5 available!
db.exec('CREATE VIRTUAL TABLE docs USING fts5(title, body)');

// JSON1 available!
db.prepare('SELECT json_extract(?, ?)').get('{"name":"Alice"}', '$.name');

// R-Tree available!
db.exec('CREATE VIRTUAL TABLE rtree_test USING rtree(id, minX, maxX, minY, maxY)');
```

**Pros:**
- ✅ More extensions enabled
- ✅ Faster than node:sqlite
- ✅ More mature

**Cons:**
- ❌ Requires compilation (native module)
- ❌ Not built into Node.js
- ❌ Synchronous only

---

### Option 3: Use sql.js (WASM)

SQLite compiled to WebAssembly:

```bash
npm install sql.js
```

```javascript
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();

// Works in browser and Node.js
db.run('CREATE TABLE users (id INTEGER, name TEXT)');
```

**Pros:**
- ✅ Works in browser
- ✅ No compilation needed
- ✅ Some extensions available

**Cons:**
- ❌ Slower than native
- ❌ Different API
- ❌ Memory limitations

---

## Recommendations

### For Node.js Server Applications

**Use built-in `node:sqlite` with workarounds:**

```javascript
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./data.db');

// ✅ Use what's available
db.exec('PRAGMA journal_mode=WAL');
const session = db.createSession();

// ✅ Implement missing features in JavaScript
db.function('regexp', { deterministic: true }, (pattern, text) => {
  return new RegExp(pattern).test(text) ? 1 : 0;
});

// ✅ Use external libraries for complex features
import Fuse from 'fuse.js'; // Full-text search
import rbush from 'rbush';  // Spatial index
```

**Benefits:**
- No dependencies
- Built into Node.js
- Fast enough for most use cases
- Sessions API for replication

---

### For Applications Needing Extensions

**Use `better-sqlite3`:**

```javascript
import Database from 'better-sqlite3';

const db = new Database('./data.db');

// All extensions available
db.exec('CREATE VIRTUAL TABLE docs USING fts5(content)');
db.prepare('SELECT json_extract(?, ?)').get('{}', '$.key');
```

**When to use:**
- Need FTS5 for search
- Need JSON1 for JSON queries
- Need R-Tree for spatial data
- Performance is critical

---

## Summary

### ✅ Available in Node.js SQLite

| Feature | Available | Notes |
|---------|-----------|-------|
| **Math Functions** | ✅ | 27+ functions |
| **Sessions API** | ✅ | Changeset/patchset |
| **WAL Mode** | ✅ | Better concurrency |
| **Custom Functions** | ✅ | Implement your own |
| **Prepared Statements** | ✅ | Fast queries |
| **Transactions** | ✅ | ACID compliance |

### ❌ NOT Available

| Feature | Available | Workaround |
|---------|-----------|------------|
| **JSON1** | ❌ | Use JavaScript JSON |
| **FTS5** | ❌ | Use LIKE or Fuse.js |
| **R-Tree** | ❌ | Use rbush library |
| **REGEXP** | ❌ | Custom function |
| **Extension Loading** | ❌ | Use better-sqlite3 |

### 📦 Alternatives

- **better-sqlite3**: More extensions, faster, native
- **sql.js**: WASM, works in browser
- **Custom functions**: Implement in JavaScript

**For most apps, built-in `node:sqlite` with JavaScript workarounds is sufficient!** 🚀
