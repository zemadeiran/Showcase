# Authentication Documentation

## Overview

This application uses **PBKDF2** (Password-Based Key Derivation Function 2) for password hashing via Node.js built-in `crypto` module. No external dependencies required.

## Password Hashing

### Algorithm: PBKDF2

**Why PBKDF2?**
- ✅ Built into Node.js `crypto` module
- ✅ Industry standard (NIST recommended)
- ✅ Used by Apple, Microsoft, and others
- ✅ Configurable iterations for security
- ✅ No external dependencies

**Security Parameters:**
- **Algorithm**: SHA-512
- **Iterations**: 100,000
- **Salt Length**: 16 bytes (128 bits)
- **Key Length**: 64 bytes (512 bits)

### Hash Format

Passwords are stored in the format: `salt:hash`

```
a1b2c3d4e5f6g7h8:i9j0k1l2m3n4o5p6...
```

This allows us to verify passwords later by using the same salt.

## Functions

See `utils/auth.js` for implementation.

### Hash Password

```javascript
import { hashPassword } from './utils/auth.js';

const password = 'mySecurePassword123';
const hash = hashPassword(password);
// Returns: "16bytesalt:64byteshash"
```

**Process:**
1. Generate random 16-byte salt
2. Hash password with PBKDF2 (100,000 iterations, SHA-512)
3. Return combined `salt:hash` string

### Verify Password

```javascript
import { verifyPassword } from './utils/auth.js';

const password = 'mySecurePassword123';
const storedHash = 'a1b2c3...salt:e5f6g7...hash';

const isValid = verifyPassword(password, storedHash);
// Returns: true or false
```

**Process:**
1. Split stored hash to extract salt
2. Hash provided password with same salt
3. Compare hashes using timing-safe comparison
4. Return boolean result

### Generate Token

```javascript
import { generateToken } from './utils/auth.js';

const sessionToken = generateToken();
// Returns: 64-character hex string (32 bytes)

const customToken = generateToken(16);
// Returns: 32-character hex string (16 bytes)
```

### Hash String

```javascript
import { hashString } from './utils/auth.js';

const hash = hashString('some data');
// Returns: SHA-256 hash
```

## User Registration Flow

```javascript
import { createUser } from './utils/db.js';
import { hashPassword } from './utils/auth.js';

// 1. Validate user input
const email = 'user@example.com';
const password = 'SecurePass123!';
const fullName = 'John Doe';

// 2. Hash the password
const passwordHash = hashPassword(password);

// 3. Create user in database
const userId = createUser(email, passwordHash, fullName, {
  phone: '555-1234',
  country: 'USA'
});

if (userId) {
  console.log('User registered successfully');
}
```

## User Login Flow

```javascript
import { getUserByEmail } from './utils/db.js';
import { verifyPassword, generateToken } from './utils/auth.js';

// 1. Get user by email
const email = 'user@example.com';
const password = 'SecurePass123!';

const user = getUserByEmail(email);

if (!user) {
  console.log('User not found');
  return;
}

// 2. Verify password
const isValid = verifyPassword(password, user.password_hash);

if (!isValid) {
  console.log('Invalid password');
  return;
}

// 3. Check if user is active
if (!user.is_active) {
  console.log('Account is inactive');
  return;
}

// 4. Generate session token
const sessionToken = generateToken();

// 5. Store session in database (implement this)
// createSession(user.id, sessionToken, expiresAt);

// 6. Update last login
import { updateLastLogin } from './utils/db.js';
updateLastLogin(user.id);

console.log('Login successful');
```

## Session Management

### Creating Sessions

```javascript
// Store session in database
const sessionToken = generateToken();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

// Insert into sessions table
db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
  .run(userId, sessionToken, expiresAt.toISOString());
```

### Validating Sessions

```javascript
// Check if session is valid
const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?')
  .get(sessionToken, new Date().toISOString());

if (session) {
  // Session is valid
  const user = getUserById(session.user_id);
}
```

### Revoking Sessions

```javascript
// Delete session (logout)
db.prepare('DELETE FROM sessions WHERE token = ?').run(sessionToken);

// Delete all user sessions
db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
```

## Security Best Practices

### Password Requirements

Implement password validation:

```javascript
function validatePassword(password) {
  // Minimum 8 characters
  if (password.length < 8) return false;
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // At least one number
  if (!/[0-9]/.test(password)) return false;
  
  // At least one special character
  if (!/[!@#$%^&*]/.test(password)) return false;
  
  return true;
}
```

### Email Validation

```javascript
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Rate Limiting

Implement rate limiting for login attempts:

```javascript
// Track failed login attempts
const loginAttempts = new Map();

function checkRateLimit(email) {
  const attempts = loginAttempts.get(email) || 0;
  
  if (attempts >= 5) {
    return false; // Too many attempts
  }
  
  return true;
}

function recordFailedLogin(email) {
  const attempts = loginAttempts.get(email) || 0;
  loginAttempts.set(email, attempts + 1);
  
  // Reset after 15 minutes
  setTimeout(() => {
    loginAttempts.delete(email);
  }, 15 * 60 * 1000);
}
```

### HTTPS

Always use HTTPS in production to protect credentials in transit.

### Session Expiration

Set reasonable session expiration times:

```javascript
// Short-lived sessions (1 hour)
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

// Long-lived sessions with "remember me" (30 days)
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
```

### Clean Up Expired Sessions

Periodically remove expired sessions:

```javascript
// Run daily
setInterval(() => {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?')
    .run(new Date().toISOString());
}, 24 * 60 * 60 * 1000);
```

## Timing-Safe Comparison

The `verifyPassword` function uses `crypto.timingSafeEqual()` to prevent timing attacks:

```javascript
// Timing-safe comparison
crypto.timingSafeEqual(
  Buffer.from(originalHash, 'hex'),
  Buffer.from(hash, 'hex')
);
```

This ensures the comparison takes the same amount of time regardless of where the hashes differ, preventing attackers from using timing information to guess passwords.

## Migration from Other Systems

If migrating from bcrypt or other systems:

```javascript
// Check if password uses old format
if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
  // Old bcrypt hash - verify with bcrypt
  // Then rehash with PBKDF2 and update
  const newHash = hashPassword(password);
  updateUser(user.id, { password_hash: newHash });
}
```
