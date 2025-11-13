# Modern Web App - Modular Template

A beautiful, production-ready web application built with **ES modules** and **zero external dependencies**. Pure vanilla JavaScript, Node.js, and SQLite.

## Architecture

### Modular Structure
```
fullstack-app/
├── server.js              # Main server entry point
├── schema.sql             # Database schema
├── data.db               # SQLite database (auto-created)
├── utils/                # Backend utilities (ES modules)
│   ├── db.js             # Database operations
│   ├── api.js            # API route handlers
│   ├── auth.js           # Authentication (PBKDF2)
│   ├── routes.js         # Route configuration
│   └── template.js       # Template rendering
├── components/           # Reusable UI components (ES modules)
│   └── ui/
│       ├── button.js     # Button components
│       ├── card.js       # Card components
│       └── alert.js      # Alert components
├── views/                # HTML templates
│   ├── layout.html       # Main layout
│   └── pages/            # Page content
│       ├── index.html
│       ├── about.html
│       └── contact.html
├── public/               # Static assets
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── main.js
├── docs/                 # Documentation
│   ├── DATABASE.md
│   ├── API.md
│   └── AUTHENTICATION.md
└── package.json          # Project config
```

### ES Modules

This project uses **ES modules** (`import`/`export`) throughout:

```javascript
// ✅ Import utilities
import { getUserByEmail } from './utils/db.js';
import { hashPassword } from './utils/auth.js';

// ✅ Import components
import { Button } from './components/ui/button.js';
import { Alert } from './components/ui/alert.js';

// ✅ Import Node.js built-ins
import http from 'http';
import fs from 'fs';
```

**Benefits:**
- ✅ Modern JavaScript syntax
- ✅ Tree-shaking ready
- ✅ Better code organization
- ✅ Native Node.js support (v22+)
- ✅ No build step required

**Note:** File extensions (`.js`) are **required** in Node.js ES modules.

### Module Breakdown

**`server.js`** - HTTP server & routing
- Static file serving
- Route delegation using `utils/routes.js`
- CORS handling
- 404 error pages

**`utils/db.js`** - Database layer (ES module)
- SQLite initialization
- User functions: `createUser()`, `getUserByEmail()`, `updateUser()`
- Item functions: `createItem()`, `readItems()`, `updateItem()`, `deleteItem()`
- JSON metadata support

**`utils/api.js`** - API endpoints (ES module)
- RESTful API handlers
- Request/response logic
- Error handling

**`utils/auth.js`** - Authentication (ES module)
- PBKDF2 password hashing
- Password verification
- Token generation
- Timing-safe comparison

**`utils/routes.js`** - Route configuration (ES module)
- Centralized route definitions (React Router v7 style)
- Route metadata (path, page, title, description)
- Helper functions: `getRoute()`, `routeExists()`, `getAllPaths()`

**`utils/template.js`** - Template engine (ES module)
- Layout rendering with `{{placeholders}}`
- Page content injection
- Template data merging

**`components/ui/*.js`** - UI components (ES modules)
- Reusable component functions
- Return HTML strings
- Configurable via props
- Examples: `Button()`, `Card()`, `Alert()`

**`views/layout.html`** - Main layout
- Header with navigation
- Footer
- `{{CONTENT}}` placeholder for pages

**`views/pages/*.html`** - Page content
- Content-only HTML (no layout)
- Injected into layout template

**`public/js/main.js`** - Client logic (ES module)
- General website functionality
- API helper functions
- Smooth scrolling

**`public/css/styles.css`** - Custom styles
- Clean modern design
- Component styling
- Responsive utilities

## Features

### Core Functionality
- ✅ **ES Modules** - Modern JavaScript throughout
- ✅ **SQLite Database** - With JSON support for flexible metadata
- ✅ **User System** - Email-based authentication with PBKDF2
- ✅ **REST API** - Full CRUD operations
- ✅ **Component System** - Reusable UI components
- ✅ **Template Engine** - Layout inheritance
- ✅ **File-based Routing** - React Router v7 pattern

### Design & UI
- ✅ **Modern Design** - Clean, minimalist aesthetic
- ✅ **Responsive** - Mobile-first approach
- ✅ **Tailwind CSS** - Via CDN (no build step)
- ✅ **Reusable Components** - Button, Card, Alert, etc.
- ✅ **Smooth Animations** - Transitions and hover effects
- ✅ **Professional Typography** - Clean, readable fonts

### Technical
- ✅ **Zero Dependencies** - Only Node.js built-in modules
- ✅ **ES Modules** - Native import/export support
- ✅ **PBKDF2 Auth** - Secure password hashing (crypto module)
- ✅ **SQLite JSON** - Flexible metadata storage
- ✅ **Modular Architecture** - Clean separation of concerns
- ✅ **SEO-Friendly** - Meta tags per route
- ✅ **Production Ready** - Proper error handling & security

## Quick Start

```bash
node server.js
```

**Open your browser:**
```
http://localhost:3000
```

The app will create a `tasks.db` SQLite file in the directory automatically!

**No npm install needed!** Uses Node.js v22+ built-in SQLite module.

## How It Works

- **Frontend**: Pure HTML/CSS/JavaScript served directly
- **Backend**: Node.js HTTP server with built-in modules
- **Storage**: SQLite database file (`tasks.db`) for data persistence
- **API**: REST endpoints for task operations

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task (body: `{ "title": "Task name" }`)
- `PUT /api/tasks?id=<id>` - Toggle task completion
- `DELETE /api/tasks?id=<id>` - Delete task

## Files

- `server.js` - Complete Node.js server with HTML, API, and SQLite database
- `package.json` - Minimal config (no dependencies needed!)
- `tasks.db` - Auto-created SQLite database file

## Technologies

- **Node.js v22+** (built-in HTTP and SQLite modules)
- **SQLite** (via Node.js built-in `node:sqlite`)
- **Tailwind CSS** (via CDN)
- **Vanilla JavaScript** for frontend
