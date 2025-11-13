# Architecture Documentation

## Overview

This is a modern web application built with **zero external dependencies** using vanilla JavaScript, Node.js built-in modules, and SQLite.

## Technology Stack

### Backend
- **Node.js v22+** - JavaScript runtime
- **HTTP Module** - Built-in web server
- **SQLite** - Built-in database (`node:sqlite`)
- **Crypto Module** - Built-in password hashing

### Frontend
- **Vanilla JavaScript** - No frameworks
- **Tailwind CSS** - Via CDN
- **HTML5** - Semantic markup

### Database
- **SQLite 3** - Embedded database
- **JSON Support** - For flexible metadata
- **Triggers** - Auto-update timestamps

## Project Structure

```
fullstack-app/
├── server.js              # Main HTTP server
├── schema.sql             # Database schema
├── data.db               # SQLite database (auto-created)
├── package.json          # Project configuration
│
├── utils/                # Backend utilities
│   ├── db.js            # Database operations
│   ├── api.js           # API route handlers
│   ├── auth.js          # Authentication utilities
│   ├── routes.js        # Route configuration
│   └── template.js      # Template rendering
│
├── views/               # HTML templates
│   ├── layout.html      # Main layout
│   └── pages/           # Page content
│       ├── index.html
│       ├── about.html
│       └── contact.html
│
├── public/              # Static assets
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── main.js
│
├── docs/                # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── AUTHENTICATION.md
│
└── README.md            # Project overview
```

## Architecture Patterns

### 1. Modular Structure

**Separation of Concerns:**
- `server.js` - HTTP server and routing
- `utils/` - Business logic and utilities
- `views/` - Presentation layer
- `public/` - Client-side assets

### 2. React Router v7 Pattern

Inspired by React Router v7's file-based routing:

```javascript
// utils/routes.js
export const routes = [
  {
    path: '/',
    page: 'index',
    title: 'Home',
    description: 'Page description'
  }
];
```

**Benefits:**
- Centralized route configuration
- Easy to add new routes
- SEO metadata per route
- Type-safe (when using TypeScript)

### 3. Template System

Layout inheritance with dynamic content injection:

```
layout.html (header + footer + {{CONTENT}})
  ↓
pages/index.html (content only)
  ↓
Rendered HTML (complete page)
```

**Template Engine:**
```javascript
// utils/template.js
export function renderPage(pageName, data) {
  const layout = readFile('layout.html');
  const content = readFile(`pages/${pageName}.html`);
  return layout.replace('{{CONTENT}}', content)
               .replace('{{TITLE}}', data.title);
}
```

### 4. Database Layer

Clean separation between database and business logic:

```javascript
// utils/db.js - Database operations
export function getUserByEmail(email) { ... }

// utils/api.js - Business logic
export function handleApiRequest(req, res, url) { ... }
```

### 5. RESTful API

Standard REST conventions:

```
GET    /api/items      - List all items
POST   /api/items      - Create item
PUT    /api/items?id=1 - Update item
DELETE /api/items?id=1 - Delete item
```

## Request Flow

### Page Request

```
1. Browser → GET /about
2. server.js → getRoute('/about')
3. routes.js → { path: '/about', page: 'about', ... }
4. template.js → renderPage('about', { title: 'About' })
5. Read layout.html + pages/about.html
6. Inject content into layout
7. Return complete HTML
8. Browser ← HTML response
```

### API Request

```
1. Browser → POST /api/items
2. server.js → handleApiRequest()
3. api.js → Parse request body
4. db.js → createItem(title, description)
5. SQLite → INSERT INTO items ...
6. api.js → Return { id: 123 }
7. Browser ← JSON response
```

## Server Architecture

### HTTP Server

```javascript
const server = http.createServer((req, res) => {
  // 1. Parse URL
  const url = new URL(req.url, 'http://' + req.headers.host);
  
  // 2. Handle API routes
  if (handleApiRequest(req, res, url)) return;
  
  // 3. Serve static files
  if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
    serveStaticFile(filePath, res);
    return;
  }
  
  // 4. Render pages
  const route = getRoute(url.pathname);
  if (route) {
    const html = renderPage(route.page, route);
    res.end(html);
    return;
  }
  
  // 5. 404 Not Found
  res.writeHead(404);
  res.end('Not Found');
});
```

### Static File Serving

```javascript
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}
```

## Database Architecture

### Schema-First Design

1. Define schema in `schema.sql`
2. Auto-load on startup
3. Triggers for timestamps
4. Indexes for performance

### JSON Flexibility

```sql
-- Store flexible metadata
meta TEXT DEFAULT '{}'

-- Query JSON fields
WHERE json_extract(meta, '$.country') = 'USA'

-- Update JSON fields
SET meta = json_set(meta, '$.phone', '555-1234')
```

### Foreign Keys

```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

Ensures referential integrity and automatic cleanup.

## Security Architecture

### Password Security

- **PBKDF2** with 100,000 iterations
- **Random salt** per password
- **SHA-512** algorithm
- **Timing-safe** comparison

### Session Security

- **Random tokens** (32 bytes)
- **Expiration times**
- **Database storage**
- **Automatic cleanup**

### Input Validation

- **Email validation**
- **Password requirements**
- **SQL injection prevention** (prepared statements)
- **XSS prevention** (proper escaping)

## Performance Considerations

### Database Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_items_user_id ON items(user_id);
```

### Prepared Statements

```javascript
// Cached and reused
const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
stmt.get(email);
```

### Static File Caching

```javascript
// Add cache headers
res.setHeader('Cache-Control', 'public, max-age=31536000');
```

## Scalability

### Current Limitations

- Single SQLite file (not for high concurrency)
- No load balancing
- No horizontal scaling

### Migration Path

To scale:

1. **PostgreSQL/MySQL** - Replace SQLite
2. **Redis** - Add session storage
3. **Load Balancer** - Multiple instances
4. **CDN** - Static asset delivery
5. **Microservices** - Split into services

## Development Workflow

### Local Development

```bash
node server.js
# Server running at http://localhost:3000
```

### Database Reset

```bash
rm data.db
node server.js  # Schema recreated
```

### Testing

```bash
# Test API
curl http://localhost:3000/api/items

# Test pages
open http://localhost:3000
```

## Deployment

### Requirements

- Node.js v22+
- Port 3000 (or configure PORT env var)
- Write access for data.db

### Production Considerations

1. **Environment Variables**
   - PORT
   - NODE_ENV
   - DATABASE_PATH

2. **Process Manager**
   - PM2
   - systemd
   - Docker

3. **Reverse Proxy**
   - nginx
   - Apache
   - Caddy

4. **HTTPS**
   - Let's Encrypt
   - Cloudflare
   - AWS Certificate Manager

5. **Monitoring**
   - Logs
   - Error tracking
   - Performance metrics

## Zero Dependencies Philosophy

**Why No Dependencies?**

✅ **Security** - No supply chain attacks
✅ **Simplicity** - Easy to understand
✅ **Stability** - No breaking changes
✅ **Performance** - No bloat
✅ **Maintenance** - No updates needed

**What We Use Instead:**

- `http` instead of Express
- `node:sqlite` instead of better-sqlite3
- `crypto` instead of bcrypt
- Vanilla JS instead of React
- Tailwind CDN instead of build process

## Future Enhancements

Potential additions:

1. **Authentication Middleware**
2. **Rate Limiting**
3. **File Uploads**
4. **Email Service**
5. **WebSocket Support**
6. **GraphQL API**
7. **TypeScript**
8. **Testing Framework**

All while maintaining the zero-dependency philosophy where possible!
