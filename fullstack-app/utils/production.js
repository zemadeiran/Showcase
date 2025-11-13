/**
 * Production Utilities
 * Built-in Node.js modules for production optimization
 */

import cluster from 'cluster';
import os from 'os';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

/**
 * Multi-core clustering for better performance
 * Uses all available CPU cores
 */
export function setupCluster(startServer) {
  const numCPUs = os.cpus().length;
  
  if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    
    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork(); // Restart the worker
    });
    
    // Handle worker online
    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.process.pid} is online`);
    });
    
  } else {
    // Workers can share any TCP connection
    // In this case, it's an HTTP server
    startServer();
    console.log(`Worker ${process.pid} started`);
  }
}

/**
 * Compress response data (gzip)
 * @param {string|Buffer} data - Data to compress
 * @returns {Promise<Buffer>} Compressed data
 */
export async function compressGzip(data) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return await gzip(buffer);
}

/**
 * Compress response data (brotli - better compression)
 * @param {string|Buffer} data - Data to compress
 * @returns {Promise<Buffer>} Compressed data
 */
export async function compressBrotli(data) {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return await brotli(buffer);
}

/**
 * Check if client accepts compression
 * @param {object} req - HTTP request
 * @returns {string|null} Compression type ('gzip', 'br', or null)
 */
export function getAcceptedEncoding(req) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('br')) {
    return 'br'; // Brotli (best compression)
  } else if (acceptEncoding.includes('gzip')) {
    return 'gzip';
  }
  
  return null;
}

/**
 * Compress and send response
 * @param {object} res - HTTP response
 * @param {string} data - Response data
 * @param {string} contentType - Content type
 * @param {object} req - HTTP request
 */
export async function sendCompressed(res, data, contentType, req) {
  const encoding = getAcceptedEncoding(req);
  
  if (!encoding || data.length < 1024) {
    // Don't compress small responses
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    return;
  }
  
  try {
    let compressed;
    if (encoding === 'br') {
      compressed = await compressBrotli(data);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'br'
      });
    } else {
      compressed = await compressGzip(data);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'gzip'
      });
    }
    res.end(compressed);
  } catch (error) {
    console.error('Compression error:', error);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  }
}

/**
 * Get system information
 * @returns {object} System info
 */
export function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
    uptime: Math.round(os.uptime() / 60) + ' minutes',
    nodeVersion: process.version,
    pid: process.pid
  };
}

/**
 * Graceful shutdown handler
 * @param {object} server - HTTP server instance
 */
export function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Closing server gracefully...`);
    
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
