import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import cluster from 'cluster';
import os from 'os';
import { handleApiRequest } from './utils/api.js';
import { handleAuthRequest } from './utils/auth-api.js';
import { getRoute } from './utils/routes.js';
import { renderPage } from './utils/template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const USE_CLUSTER = process.env.USE_CLUSTER === 'true';
const numCPUs = os.cpus().length;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Serve static files
function serveStaticFile(filePath, res, req) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Add cache headers for better performance
    const headers = { 'Content-Type': contentType };
    
    // Cache static assets for 1 year (31536000 seconds)
    if (ext === '.js' || ext === '.mjs' || ext === '.css') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    // Check if client supports Brotli compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const supportsBrotli = acceptEncoding.includes('br');
    const supportsGzip = acceptEncoding.includes('gzip');
    
    // Compress text-based files
    const compressibleTypes = ['.html', '.css', '.js', '.mjs', '.json', '.svg'];
    const shouldCompress = compressibleTypes.includes(ext) && (supportsBrotli || supportsGzip);
    
    if (shouldCompress) {
      if (supportsBrotli) {
        headers['Content-Encoding'] = 'br';
        zlib.brotliCompress(data, (err, compressed) => {
          if (err) {
            // Fallback to uncompressed
            res.writeHead(200, headers);
            res.end(data);
            return;
          }
          res.writeHead(200, headers);
          res.end(compressed);
        });
      } else if (supportsGzip) {
        headers['Content-Encoding'] = 'gzip';
        zlib.gzip(data, (err, compressed) => {
          if (err) {
            // Fallback to uncompressed
            res.writeHead(200, headers);
            res.end(data);
            return;
          }
          res.writeHead(200, headers);
          res.end(compressed);
        });
      }
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://' + req.headers.host);

  // Handle authentication API routes
  if (handleAuthRequest(req, res, url)) {
    return;
  }

  // Handle API routes
  if (handleApiRequest(req, res, url)) {
    return;
  }

  // Serve static files from public directory
  if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
    const filePath = path.join(__dirname, 'public', url.pathname);
    serveStaticFile(filePath, res, req);
    return;
  }

  // Serve components as static files
  if (url.pathname.startsWith('/components/')) {
    const filePath = path.join(__dirname, url.pathname);
    serveStaticFile(filePath, res, req);
    return;
  }

  // Route-based rendering (like React Router v7)
  if (req.method === 'GET') {
    const route = getRoute(url.pathname);
    
    if (route) {
      // Render page with layout using route configuration
      const html = renderPage(route.page, {
        title: route.title,
        description: route.description
      });
      
      if (html) {
        // Check for compression support
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const supportsBrotli = acceptEncoding.includes('br');
        const supportsGzip = acceptEncoding.includes('gzip');
        
        const headers = { 'Content-Type': 'text/html' };
        
        if (supportsBrotli) {
          headers['Content-Encoding'] = 'br';
          zlib.brotliCompress(html, (err, compressed) => {
            if (err) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(html);
              return;
            }
            res.writeHead(200, headers);
            res.end(compressed);
          });
        } else if (supportsGzip) {
          headers['Content-Encoding'] = 'gzip';
          zlib.gzip(html, (err, compressed) => {
            if (err) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(html);
              return;
            }
            res.writeHead(200, headers);
            res.end(compressed);
          });
        } else {
          res.writeHead(200, headers);
          res.end(html);
        }
        return;
      }
    }
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 - Page Not Found</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gradient-to-br from-purple-600 to-purple-800 min-h-screen flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-6xl font-bold mb-4">404</h1>
          <p class="text-2xl mb-8">Page Not Found</p>
          <a href="/" class="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all inline-block">
            Go Home
          </a>
        </div>
      </body>
    </html>
  `);
});

// Cluster mode or single process
if (USE_CLUSTER && cluster.isPrimary) {
  console.log(`🚀 Primary process ${process.pid} is running`);
  console.log(`💻 CPU cores available: ${numCPUs}`);
  console.log(`📦 Forking ${numCPUs} workers...\n`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Track worker status
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died (${signal || code})`);
    console.log(`🔄 Starting a new worker...`);
    cluster.fork();
  });
  
  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    
    setTimeout(() => {
      console.log('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
} else {
  // Worker process or single process mode
  server.listen(PORT, () => {
    if (USE_CLUSTER) {
      console.log(`👷 Worker ${process.pid} listening on port ${PORT}`);
    } else {
      console.log(`Server running at http://localhost:${PORT}`);
    }
  });
}
