# Process & Concurrency Modules

Node.js provides three powerful built-in modules for running concurrent operations:

## 1. `child_process` - Spawn External Processes

### What It Does
Runs **external programs** (shell commands, scripts, other executables) as separate processes.

### Use Cases
- Run shell commands (ls, git, npm, etc.)
- Execute build scripts
- Run external tools (imagemagick, ffmpeg, etc.)
- Spawn other Node.js scripts
- Run system commands

### Methods

#### `spawn()` - Stream-based (Best for long-running)
```javascript
import { spawn } from 'child_process';

// Run a command with arguments
const ls = spawn('ls', ['-la', '/usr']);

// Stream output in real-time
ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

#### `exec()` - Buffer-based (Best for short commands)
```javascript
import { exec } from 'child_process';

// Run a shell command
exec('ls -la', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});
```

#### `execFile()` - Run executable directly
```javascript
import { execFile } from 'child_process';

// Run executable without shell
execFile('node', ['--version'], (error, stdout, stderr) => {
  console.log(`Node version: ${stdout}`);
});
```

#### `fork()` - Spawn Node.js process with IPC
```javascript
import { fork } from 'child_process';

// Spawn another Node.js script
const child = fork('./worker.js');

// Send message to child
child.send({ task: 'process data' });

// Receive message from child
child.on('message', (msg) => {
  console.log('Message from child:', msg);
});
```

### Real-World Examples

**Image Processing:**
```javascript
import { spawn } from 'child_process';

function resizeImage(input, output) {
  return new Promise((resolve, reject) => {
    const convert = spawn('convert', [
      input,
      '-resize', '800x600',
      output
    ]);
    
    convert.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed with code ${code}`));
    });
  });
}
```

**Git Operations:**
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function gitCommit(message) {
  await execAsync('git add .');
  await execAsync(`git commit -m "${message}"`);
  await execAsync('git push');
}
```

**Database Backup:**
```javascript
import { spawn } from 'child_process';
import fs from 'fs';

function backupDatabase() {
  const backup = spawn('sqlite3', ['data.db', '.dump']);
  const output = fs.createWriteStream('backup.sql');
  
  backup.stdout.pipe(output);
  
  return new Promise((resolve, reject) => {
    backup.on('close', resolve);
    backup.on('error', reject);
  });
}
```

---

## 2. `cluster` - Multi-Process Clustering

### What It Does
Creates **multiple Node.js processes** (workers) that share the same server port. Uses **all CPU cores** for better performance.

### How It Works
```
┌─────────────────────────────────────┐
│         Primary Process             │
│         (Master/Manager)            │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬──────┬──────┐
    │             │      │      │
┌───▼───┐   ┌───▼───┐  ...  ┌───▼───┐
│Worker 1│   │Worker 2│      │Worker N│
│Port 3000│  │Port 3000│    │Port 3000│
└────────┘   └────────┘      └────────┘
```

### Basic Usage

```javascript
import cluster from 'cluster';
import http from 'http';
import os from 'os';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  
  // Fork workers (one per CPU core)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker...');
    cluster.fork(); // Restart
  });
  
} else {
  // Workers share the TCP connection
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Handled by worker ${process.pid}\n`);
  }).listen(3000);
  
  console.log(`Worker ${process.pid} started`);
}
```

### Benefits

✅ **Uses all CPU cores** - 4 cores = 4x capacity
✅ **Zero-downtime restarts** - Restart workers one at a time
✅ **Automatic failover** - Dead workers are restarted
✅ **Load balancing** - OS distributes connections

### Performance Example

```javascript
// Single process (1 core)
Requests/sec: 5,000

// Cluster (4 cores)
Requests/sec: 18,000 (3.6x improvement!)
```

### Advanced: Zero-Downtime Deployment

```javascript
import cluster from 'cluster';

if (cluster.isPrimary) {
  // Graceful restart on SIGUSR2
  process.on('SIGUSR2', () => {
    const workers = Object.values(cluster.workers);
    
    // Restart workers one by one
    const restartWorker = (i) => {
      if (i >= workers.length) return;
      
      const worker = workers[i];
      worker.disconnect();
      
      worker.on('exit', () => {
        cluster.fork();
        setTimeout(() => restartWorker(i + 1), 1000);
      });
    };
    
    restartWorker(0);
  });
}
```

### When to Use Cluster

✅ **CPU-intensive operations** - Image processing, encryption
✅ **High traffic** - Need to handle many concurrent requests
✅ **Production servers** - Maximize hardware utilization

❌ **Don't use for:**
- Development (adds complexity)
- I/O-bound operations (single process is fine)
- Apps with shared state (use Redis instead)

---

## 3. `worker_threads` - Multi-Threading

### What It Does
Runs **JavaScript in parallel threads** within the same process. True multi-threading for CPU-intensive tasks.

### Cluster vs Worker Threads

| Feature | Cluster | Worker Threads |
|---------|---------|----------------|
| **Type** | Multiple processes | Multiple threads |
| **Memory** | Separate (isolated) | Shared (can share) |
| **Startup** | Slower (~30ms) | Faster (~5ms) |
| **Use case** | Scale HTTP servers | CPU-intensive tasks |
| **Communication** | IPC (slow) | SharedArrayBuffer (fast) |

### Basic Usage

**Main Thread:**
```javascript
import { Worker } from 'worker_threads';

// Create worker
const worker = new Worker('./worker.js', {
  workerData: { task: 'heavy computation' }
});

// Receive message from worker
worker.on('message', (result) => {
  console.log('Result:', result);
});

// Handle errors
worker.on('error', (error) => {
  console.error('Worker error:', error);
});

// Handle exit
worker.on('exit', (code) => {
  console.log(`Worker exited with code ${code}`);
});
```

**Worker Thread (worker.js):**
```javascript
import { parentPort, workerData } from 'worker_threads';

// Get data from main thread
console.log('Worker received:', workerData);

// Do heavy computation
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(40);

// Send result back to main thread
parentPort.postMessage(result);
```

### Real-World Example: Image Processing

```javascript
import { Worker } from 'worker_threads';
import path from 'path';

function processImageInWorker(imagePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./image-worker.js', {
      workerData: { imagePath }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Process multiple images in parallel
async function processImages(images) {
  const promises = images.map(img => processImageInWorker(img));
  return await Promise.all(promises);
}
```

### Worker Pool Pattern

```javascript
import { Worker } from 'worker_threads';

class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workers = [];
    this.queue = [];
    
    for (let i = 0; i < poolSize; i++) {
      this.workers.push({
        worker: new Worker(workerScript),
        busy: false
      });
    }
  }
  
  async runTask(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      
      // Find available worker
      const available = this.workers.find(w => !w.busy);
      
      if (available) {
        this.executeTask(available, task);
      } else {
        // Queue task
        this.queue.push(task);
      }
    });
  }
  
  executeTask(workerObj, task) {
    workerObj.busy = true;
    
    workerObj.worker.once('message', (result) => {
      task.resolve(result);
      workerObj.busy = false;
      
      // Process next queued task
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        this.executeTask(workerObj, nextTask);
      }
    });
    
    workerObj.worker.postMessage(task.data);
  }
}

// Usage
const pool = new WorkerPool('./worker.js', 4);

for (let i = 0; i < 100; i++) {
  const result = await pool.runTask({ number: i });
  console.log(result);
}
```

### Shared Memory (Advanced)

```javascript
import { Worker } from 'worker_threads';

// Create shared memory
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// Main thread
const worker = new Worker('./worker.js', {
  workerData: { sharedBuffer }
});

// Both threads can access the same memory!
sharedArray[0] = 42;

// Worker can read/write the same array
```

### When to Use Worker Threads

✅ **CPU-intensive tasks:**
- Image/video processing
- Encryption/decryption
- Data compression
- Complex calculations
- Machine learning inference

✅ **Parallel processing:**
- Process multiple files
- Batch operations
- Data transformation

❌ **Don't use for:**
- I/O operations (use async/await instead)
- Simple tasks (overhead not worth it)
- Tasks that need shared state (use cluster + Redis)

---

## Comparison Summary

| Module | Use Case | Example |
|--------|----------|---------|
| **child_process** | Run external programs | Git, ImageMagick, shell scripts |
| **cluster** | Scale HTTP servers | Handle more concurrent requests |
| **worker_threads** | CPU-intensive JS tasks | Image processing, encryption |

## Performance Tips

1. **child_process**: Use `spawn()` for large output, `exec()` for small
2. **cluster**: Use 1 worker per CPU core (not more!)
3. **worker_threads**: Use worker pools to reuse threads

## Your App Could Use

```javascript
// Production: Use cluster for better performance
import { setupCluster } from './utils/production.js';

setupCluster(() => {
  // Start your server
  server.listen(3000);
});

// Development: Use child_process for build tasks
import { spawnProcess } from './utils/development.js';

await spawnProcess('npm', ['run', 'build']);

// Future: Use worker_threads for heavy tasks
// (e.g., image processing, PDF generation)
```
