import { createUser, getUserByEmail, updateLastLogin } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';
import { createSession, validateSession, deleteSession, getSessionToken, setSessionCookie, clearSessionCookie } from './session.js';
import db from './db.js';

/**
 * Handle authentication API requests
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @param {URL} url - Parsed URL
 * @returns {boolean} True if request was handled
 */
export function handleAuthRequest(req, res, url) {
  // POST /api/auth/register
  if (url.pathname === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password, fullName } = JSON.parse(body);
        
        // Validate input
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }
        
        // Check if user exists
        const existingUser = getUserByEmail(email);
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email already registered' }));
          return;
        }
        
        // Hash password
        const passwordHash = hashPassword(password);
        
        // Create user
        const userId = createUser(email, passwordHash, fullName || null, {});
        
        if (!userId) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create user' }));
          return;
        }
        
        // Create session
        const token = createSession(userId, db);
        setSessionCookie(res, token);
        
        // Get user (without password hash)
        const user = getUserByEmail(email);
        delete user.password_hash;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (error) {
        console.error('Registration error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return true;
  }
  
  // POST /api/auth/login
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        
        // Validate input
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }
        
        // Get user
        const user = getUserByEmail(email);
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }
        
        // Verify password
        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }
        
        // Check if user is active
        if (!user.is_active) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Account is inactive' }));
          return;
        }
        
        // Create session
        const token = createSession(user.id, db);
        setSessionCookie(res, token);
        
        // Update last login
        updateLastLogin(user.id);
        
        // Remove password hash from response
        delete user.password_hash;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return true;
  }
  
  // POST /api/auth/logout
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getSessionToken(req);
    if (token) {
      deleteSession(token, db);
    }
    clearSessionCookie(res);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return true;
  }
  
  // GET /api/auth/me
  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const token = getSessionToken(req);
    const user = token ? validateSession(token, db) : null;
    
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not authenticated' }));
      return true;
    }
    
    // Remove password hash
    delete user.password_hash;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
    return true;
  }
  
  return false;
}
