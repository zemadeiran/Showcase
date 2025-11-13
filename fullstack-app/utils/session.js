import crypto from 'crypto';
import { getUserById } from './db.js';

/**
 * Session Management
 * Using secure HTTP-only cookies with database-backed sessions
 * No JWT dependencies - uses simple token-based sessions
 */

const COOKIE_NAME = 'session_token';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a new session for a user
 * @param {number} userId - User ID
 * @param {object} db - Database instance
 * @returns {string} Session token
 */
export function createSession(userId, db) {
  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  // Store in database
  const stmt = db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
  stmt.run(userId, token, expiresAt.toISOString());
  
  return token;
}

/**
 * Validate a session token
 * @param {string} token - Session token
 * @param {object} db - Database instance
 * @returns {object|null} User object if valid, null otherwise
 */
export function validateSession(token, db) {
  if (!token) return null;
  
  // Get session from database
  const stmt = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?');
  const session = stmt.get(token, new Date().toISOString());
  
  if (!session) return null;
  
  // Get user
  const user = getUserById(session.user_id);
  
  if (!user || !user.is_active) return null;
  
  return user;
}

/**
 * Delete a session (logout)
 * @param {string} token - Session token
 * @param {object} db - Database instance
 */
export function deleteSession(token, db) {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Delete all sessions for a user
 * @param {number} userId - User ID
 * @param {object} db - Database instance
 */
export function deleteAllUserSessions(userId, db) {
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  stmt.run(userId);
}

/**
 * Clean up expired sessions
 * @param {object} db - Database instance
 */
export function cleanupExpiredSessions(db) {
  const stmt = db.prepare('DELETE FROM sessions WHERE expires_at < ?');
  stmt.run(new Date().toISOString());
}

/**
 * Set session cookie in HTTP response
 * @param {object} res - HTTP response object
 * @param {string} token - Session token
 * @param {object} options - Cookie options
 */
export function setSessionCookie(res, token, options = {}) {
  const {
    maxAge = SESSION_DURATION / 1000, // Convert to seconds
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
    path = '/'
  } = options;
  
  const cookieValue = `${COOKIE_NAME}=${token}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}${httpOnly ? '; HttpOnly' : ''}${secure ? '; Secure' : ''}`;
  
  res.setHeader('Set-Cookie', cookieValue);
}

/**
 * Clear session cookie
 * @param {object} res - HTTP response object
 */
export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/`);
}

/**
 * Parse cookies from request
 * @param {object} req - HTTP request object
 * @returns {object} Parsed cookies
 */
export function parseCookies(req) {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      cookies[name.trim()] = rest.join('=').trim();
    });
  }
  
  return cookies;
}

/**
 * Get session token from request
 * @param {object} req - HTTP request object
 * @returns {string|null} Session token
 */
export function getSessionToken(req) {
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] || null;
}

/**
 * Middleware to get current user from session
 * @param {object} req - HTTP request object
 * @param {object} db - Database instance
 * @returns {object|null} User object if authenticated
 */
export function getCurrentUser(req, db) {
  const token = getSessionToken(req);
  if (!token) return null;
  
  return validateSession(token, db);
}

/**
 * Create a signed token (alternative to JWT)
 * Uses HMAC for signing - no JWT library needed
 * @param {object} payload - Data to encode
 * @param {string} secret - Secret key
 * @returns {string} Signed token
 */
export function createSignedToken(payload, secret) {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  
  return `${encoded}.${signature}`;
}

/**
 * Verify a signed token
 * @param {string} token - Signed token
 * @param {string} secret - Secret key
 * @returns {object|null} Decoded payload if valid
 */
export function verifySignedToken(token, secret) {
  try {
    const [encoded, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encoded)
      .digest('base64url');
    
    // Timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return null;
    }
    
    // Decode payload
    const data = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}
