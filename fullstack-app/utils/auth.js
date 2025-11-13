import crypto from 'crypto';

/**
 * Hash a password using PBKDF2 (Password-Based Key Derivation Function 2)
 * This is a built-in Node.js crypto function - no external dependencies needed
 * 
 * @param {string} password - Plain text password
 * @returns {string} Hash in format: salt:hash
 */
export function hashPassword(password) {
  // Generate a random salt (16 bytes)
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with PBKDF2
  // 100,000 iterations, 64 byte key length, sha512 algorithm
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  // Return salt and hash combined (we need the salt to verify later)
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in format: salt:hash
 * @returns {boolean} True if password matches
 */
export function verifyPassword(password, storedHash) {
  // Split the stored hash to get salt and hash
  const [salt, originalHash] = storedHash.split(':');
  
  // Hash the provided password with the same salt
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  // Compare the hashes using timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hash, 'hex'));
}

/**
 * Generate a random token for sessions
 * 
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Random hex token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string (for general purpose hashing)
 * 
 * @param {string} data - Data to hash
 * @returns {string} SHA256 hash
 */
export function hashString(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
