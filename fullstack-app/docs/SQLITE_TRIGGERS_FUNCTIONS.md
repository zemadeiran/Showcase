# SQLite Triggers & Functions in Node.js

Complete guide to triggers and custom functions in Node.js SQLite.

---

## Summary

**✅ YES - Both triggers and custom functions are fully supported!**

| Feature | Supported | Notes |
|---------|-----------|-------|
| **Triggers** | ✅ Yes | BEFORE/AFTER INSERT/UPDATE/DELETE |
| **Custom Functions** | ✅ Yes | Scalar, aggregate, varargs |
| **Built-in Functions** | ✅ Yes | Math, string, date functions |
| **Views** | ✅ Yes | Virtual tables based on queries |
| **Indexes** | ✅ Yes | B-tree indexes |

---

## Triggers

### Types of Triggers

SQLite supports 6 types of triggers:

1. **BEFORE INSERT**
2. **AFTER INSERT**
3. **BEFORE UPDATE**
4. **AFTER UPDATE**
5. **BEFORE DELETE**
6. **AFTER DELETE**

---

### Example 1: Validation Trigger (BEFORE INSERT)

```javascript
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  );
  
  CREATE TRIGGER validate_user_before_insert
  BEFORE INSERT ON users
  BEGIN
    SELECT CASE
      WHEN NEW.email NOT LIKE '%@%' THEN
        RAISE(ABORT, 'Invalid email format')
      WHEN LENGTH(NEW.name) < 2 THEN
        RAISE(ABORT, 'Name too short')
    END;
  END;
`);

// This will fail
try {
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(1, 'A', 'invalid');
} catch (e) {
  console.log('Validation failed:', e.message);
  // "Invalid email format"
}

// This will succeed
db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(1, 'Alice', 'alice@example.com');
```

---

### Example 2: Audit Log Trigger (AFTER INSERT/UPDATE/DELETE)

```javascript
db.exec(`
  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    table_name TEXT,
    record_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
  );
  
  -- Log inserts
  CREATE TRIGGER audit_user_insert
  AFTER INSERT ON users
  BEGIN
    INSERT INTO audit_log (action, table_name, record_id, new_value)
    VALUES ('INSERT', 'users', NEW.id, json_object('name', NEW.name, 'email', NEW.email));
  END;
  
  -- Log updates
  CREATE TRIGGER audit_user_update
  AFTER UPDATE ON users
  BEGIN
    INSERT INTO audit_log (action, table_name, record_id, old_value, new_value)
    VALUES (
      'UPDATE',
      'users',
      NEW.id,
      json_object('name', OLD.name, 'email', OLD.email),
      json_object('name', NEW.name, 'email', NEW.email)
    );
  END;
  
  -- Log deletes
  CREATE TRIGGER audit_user_delete
  BEFORE DELETE ON users
  BEGIN
    INSERT INTO audit_log (action, table_name, record_id, old_value)
    VALUES ('DELETE', 'users', OLD.id, json_object('name', OLD.name, 'email', OLD.email));
  END;
`);

// Make changes
db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(1, 'Alice', 'alice@example.com');
db.prepare('UPDATE users SET email = ? WHERE id = ?').run('alice@newdomain.com', 1);
db.prepare('DELETE FROM users WHERE id = ?').run(1);

// Check audit log
const logs = db.prepare('SELECT * FROM audit_log').all();
console.log('Audit entries:', logs.length); // 3
```

---

### Example 3: Auto-Update Stats (AFTER INSERT)

```javascript
db.exec(`
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT,
    views INTEGER DEFAULT 0
  );
  
  CREATE TABLE user_stats (
    user_id INTEGER PRIMARY KEY,
    post_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0
  );
  
  -- Auto-update stats on new post
  CREATE TRIGGER update_stats_on_post_insert
  AFTER INSERT ON posts
  BEGIN
    INSERT INTO user_stats (user_id, post_count, total_views)
    VALUES (NEW.user_id, 1, NEW.views)
    ON CONFLICT(user_id) DO UPDATE SET
      post_count = post_count + 1,
      total_views = total_views + NEW.views;
  END;
  
  -- Update stats on view count change
  CREATE TRIGGER update_stats_on_post_update
  AFTER UPDATE OF views ON posts
  BEGIN
    UPDATE user_stats
    SET total_views = total_views + (NEW.views - OLD.views)
    WHERE user_id = NEW.user_id;
  END;
`);

// Insert posts
db.prepare('INSERT INTO posts VALUES (?, ?, ?, ?)').run(1, 1, 'Post 1', 100);
db.prepare('INSERT INTO posts VALUES (?, ?, ?, ?)').run(2, 1, 'Post 2', 200);

// Check stats
const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(1);
console.log(stats);
// { user_id: 1, post_count: 2, total_views: 300 }
```

---

### Example 4: Cascade Delete with Trigger

```javascript
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
  CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER);
  CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER);
  
  -- Cascade delete posts when user is deleted
  CREATE TRIGGER cascade_delete_user_posts
  BEFORE DELETE ON users
  BEGIN
    DELETE FROM posts WHERE user_id = OLD.id;
  END;
  
  -- Cascade delete comments when post is deleted
  CREATE TRIGGER cascade_delete_post_comments
  BEFORE DELETE ON posts
  BEGIN
    DELETE FROM comments WHERE post_id = OLD.id;
  END;
`);

// Insert data
db.prepare('INSERT INTO users VALUES (?, ?)').run(1, 'Alice');
db.prepare('INSERT INTO posts VALUES (?, ?)').run(1, 1);
db.prepare('INSERT INTO comments VALUES (?, ?)').run(1, 1);

// Delete user (cascades to posts and comments)
db.prepare('DELETE FROM users WHERE id = ?').run(1);

console.log('Posts:', db.prepare('SELECT COUNT(*) as count FROM posts').get().count); // 0
console.log('Comments:', db.prepare('SELECT COUNT(*) as count FROM comments').get().count); // 0
```

---

### Trigger Management

```javascript
// List all triggers
const triggers = db.prepare(`
  SELECT name, tbl_name, sql 
  FROM sqlite_master 
  WHERE type = 'trigger'
`).all();

console.log('Triggers:', triggers);

// Drop a trigger
db.exec('DROP TRIGGER IF EXISTS audit_user_insert');

// Disable triggers temporarily
db.exec('PRAGMA recursive_triggers = OFF');

// Re-enable triggers
db.exec('PRAGMA recursive_triggers = ON');
```

---

## Custom Functions

### Scalar Functions

Functions that return a single value:

```javascript
// Simple function
db.function('double', { deterministic: true }, (x) => x * 2);

db.prepare('SELECT double(5) as result').get();
// { result: 10 }

// Multiple arguments
db.function('add', { deterministic: true }, (a, b) => a + b);

db.prepare('SELECT add(3, 7) as result').get();
// { result: 10 }

// String function
db.function('reverse', { deterministic: true }, (str) => {
  return str.split('').reverse().join('');
});

db.prepare('SELECT reverse(?) as result').get('hello');
// { result: 'olleh' }
```

---

### Variable Arguments Functions

```javascript
db.function('sum_all', {
  deterministic: true,
  varargs: true
}, (...args) => {
  return args.reduce((sum, n) => sum + n, 0);
});

db.prepare('SELECT sum_all(1, 2, 3, 4, 5) as result').get();
// { result: 15 }

// Concatenate strings
db.function('concat_all', {
  deterministic: true,
  varargs: true
}, (...args) => {
  return args.filter(a => a !== null).join('');
});

db.prepare('SELECT concat_all(?, ?, ?) as result').get('Hello', ' ', 'World');
// { result: 'Hello World' }
```

---

### Useful Custom Functions

#### 1. REGEXP Function

```javascript
db.function('regexp', { deterministic: true }, (pattern, text) => {
  return new RegExp(pattern).test(text) ? 1 : 0;
});

// Usage
db.prepare('SELECT * FROM users WHERE regexp(?, email)').all('^[a-z]+@example.com$');
```

#### 2. JSON_EXTRACT Function

```javascript
db.function('json_extract', { deterministic: true }, (json, path) => {
  try {
    const obj = JSON.parse(json);
    const keys = path.replace('$.', '').split('.');
    let value = obj;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) return null;
    }
    return value;
  } catch {
    return null;
  }
});

// Usage
db.prepare('SELECT json_extract(data, ?) as name FROM users').all('$.name');
```

#### 3. SOUNDEX Function

```javascript
db.function('soundex', { deterministic: true }, (str) => {
  if (!str) return null;
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
});

// Find similar names
db.prepare('SELECT * FROM users WHERE soundex(name) = soundex(?)').all('John');
// Returns: John, Jon, Jane, Joan
```

#### 4. LEVENSHTEIN Distance

```javascript
db.function('levenshtein', { deterministic: true }, (a, b) => {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
});

// Find similar strings
db.prepare('SELECT * FROM products WHERE levenshtein(name, ?) < 3').all('iPhone');
```

#### 5. UUID Generator

```javascript
import { randomUUID } from 'crypto';

db.function('uuid', { deterministic: false }, () => {
  return randomUUID();
});

// Generate UUIDs
db.prepare('INSERT INTO users (id, name) VALUES (uuid(), ?)').run('Alice');
```

---

### Function Options

```javascript
db.function('myFunc', {
  deterministic: true,  // Same input always gives same output
  directOnly: false,    // Can be called from nested SQL
  varargs: false        // Fixed number of arguments
}, (arg1, arg2) => {
  return arg1 + arg2;
});
```

**Options:**
- `deterministic`: Set to `true` if function always returns same result for same inputs (enables optimizations)
- `directOnly`: Set to `true` if function should only be called from top-level SQL
- `varargs`: Set to `true` to accept variable number of arguments

---

## Real-World Examples

### Example 1: Automatic Timestamps

```javascript
db.exec(`
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    title TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );
  
  -- Set created_at on insert
  CREATE TRIGGER set_created_at
  BEFORE INSERT ON posts
  WHEN NEW.created_at IS NULL
  BEGIN
    UPDATE posts SET created_at = strftime('%s', 'now') WHERE rowid = NEW.rowid;
  END;
  
  -- Update updated_at on update
  CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON posts
  BEGIN
    UPDATE posts SET updated_at = strftime('%s', 'now') WHERE rowid = NEW.rowid;
  END;
`);
```

### Example 2: Soft Delete

```javascript
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    deleted_at INTEGER DEFAULT NULL
  );
  
  -- Prevent actual deletion
  CREATE TRIGGER soft_delete_user
  BEFORE DELETE ON users
  BEGIN
    SELECT RAISE(IGNORE);
  END;
  
  -- Instead, mark as deleted
  CREATE TRIGGER mark_deleted
  INSTEAD OF DELETE ON users
  BEGIN
    UPDATE users SET deleted_at = strftime('%s', 'now') WHERE id = OLD.id;
  END;
`);

// Custom function to filter deleted
db.function('is_active', { deterministic: true }, (deleted_at) => {
  return deleted_at === null ? 1 : 0;
});

// Query only active users
db.prepare('SELECT * FROM users WHERE is_active(deleted_at)').all();
```

### Example 3: Data Validation

```javascript
// Email validation function
db.function('is_valid_email', { deterministic: true }, (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? 1 : 0;
});

// Phone validation function
db.function('is_valid_phone', { deterministic: true }, (phone) => {
  const regex = /^\+?[\d\s-()]+$/;
  return regex.test(phone) ? 1 : 0;
});

// Use in constraints
db.exec(`
  CREATE TABLE contacts (
    id INTEGER PRIMARY KEY,
    email TEXT CHECK(is_valid_email(email)),
    phone TEXT CHECK(is_valid_phone(phone))
  );
`);
```

---

## Best Practices

### ✅ DO:

**1. Use triggers for automatic data maintenance:**
```javascript
// Good: Auto-update stats
CREATE TRIGGER update_stats AFTER INSERT ON posts ...
```

**2. Use deterministic functions when possible:**
```javascript
// Good: Enables optimizations
db.function('double', { deterministic: true }, x => x * 2);
```

**3. Keep triggers simple:**
```javascript
// Good: Simple, focused trigger
CREATE TRIGGER log_insert AFTER INSERT ON users
BEGIN
  INSERT INTO audit_log VALUES (NEW.id, 'INSERT');
END;
```

### ❌ DON'T:

**1. Don't use triggers for complex business logic:**
```javascript
// Bad: Complex logic in trigger
CREATE TRIGGER complex_logic AFTER INSERT ON orders
BEGIN
  -- 50 lines of complex calculations
  -- Better to do this in application code
END;
```

**2. Don't create circular triggers:**
```javascript
// Bad: Infinite loop
CREATE TRIGGER a AFTER INSERT ON table1
BEGIN INSERT INTO table2 ...; END;

CREATE TRIGGER b AFTER INSERT ON table2
BEGIN INSERT INTO table1 ...; END;
```

**3. Don't use non-deterministic functions unnecessarily:**
```javascript
// Bad: Prevents optimizations
db.function('random_value', { deterministic: false }, () => Math.random());
```

---

## Summary

### ✅ Triggers

- **Fully supported** in Node.js SQLite
- **6 types**: BEFORE/AFTER INSERT/UPDATE/DELETE
- **Use cases**: Validation, audit logs, auto-updates, cascades
- **Performance**: Minimal overhead, runs in same transaction

### ✅ Custom Functions

- **Fully supported** via `db.function()`
- **Types**: Scalar, varargs
- **Use cases**: REGEXP, JSON, validation, custom calculations
- **Performance**: JavaScript functions, fast enough for most uses

### 📊 Performance

| Feature | Overhead | When to Use |
|---------|----------|-------------|
| **Triggers** | Minimal | Data consistency, audit logs |
| **Custom Functions** | Low | Missing SQLite features, validation |
| **Built-in Functions** | None | Math, strings, dates |

**Both triggers and custom functions are production-ready in Node.js SQLite!** 🚀
