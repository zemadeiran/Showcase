/**
 * Development Utilities
 * Built-in Node.js modules for development and testing
 */

import assert from 'assert';
import { performance } from 'perf_hooks';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Performance timer for measuring execution time
 */
export class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.start = performance.now();
  }
  
  end() {
    const duration = performance.now() - this.start;
    console.log(`⏱️  ${this.name}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

/**
 * Measure async function performance
 * @param {string} name - Timer name
 * @param {Function} fn - Async function to measure
 */
export async function measurePerformance(name, fn) {
  const timer = new PerformanceTimer(name);
  const result = await fn();
  timer.end();
  return result;
}

/**
 * Simple test runner using assert
 * @param {string} description - Test description
 * @param {Function} testFn - Test function
 */
export async function test(description, testFn) {
  try {
    await testFn();
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

/**
 * Test suite runner
 * @param {string} suiteName - Suite name
 * @param {Array} tests - Array of test objects {name, fn}
 */
export async function testSuite(suiteName, tests) {
  console.log(`\n🧪 Running test suite: ${suiteName}`);
  console.log('─'.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, fn } of tests) {
    const result = await test(name, fn);
    if (result) passed++;
    else failed++;
  }
  
  console.log('─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  
  return { passed, failed };
}

/**
 * Assert helpers
 */
export const assertions = {
  equal: assert.strictEqual,
  notEqual: assert.notStrictEqual,
  deepEqual: assert.deepStrictEqual,
  throws: assert.throws,
  doesNotThrow: assert.doesNotThrow,
  ok: assert.ok,
  
  // Custom assertions
  async asyncThrows(fn, errorMessage) {
    try {
      await fn();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (errorMessage && !error.message.includes(errorMessage)) {
        throw new Error(`Expected error message to include "${errorMessage}", got "${error.message}"`);
      }
    }
  }
};

/**
 * Run shell command (for build scripts, etc.)
 * @param {string} command - Command to run
 * @returns {Promise<{stdout, stderr}>}
 */
export async function runCommand(command) {
  console.log(`🔧 Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return { stdout, stderr };
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Watch for file changes (simple implementation)
 * @param {string} path - Path to watch
 * @param {Function} callback - Callback on change
 */
export function watchFiles(path, callback) {
  import('fs').then(({ watch }) => {
    console.log(`👀 Watching: ${path}`);
    watch(path, { recursive: true }, (eventType, filename) => {
      if (filename) {
        console.log(`📝 File changed: ${filename}`);
        callback(eventType, filename);
      }
    });
  });
}

/**
 * Spawn a child process (for running external tools)
 * @param {string} command - Command to spawn
 * @param {Array} args - Command arguments
 * @returns {Promise} Resolves when process exits
 */
export function spawnProcess(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Spawning: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit' // Inherit parent's stdio
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Process completed successfully`);
        resolve(code);
      } else {
        console.error(`❌ Process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Process error: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Memory usage reporter
 */
export function reportMemoryUsage() {
  const usage = process.memoryUsage();
  console.log('\n💾 Memory Usage:');
  console.log(`   RSS: ${Math.round(usage.rss / 1024 / 1024)} MB`);
  console.log(`   Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)} MB`);
  console.log(`   Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)} MB`);
  console.log(`   External: ${Math.round(usage.external / 1024 / 1024)} MB\n`);
}

/**
 * Request logger middleware
 */
export function createRequestLogger() {
  return (req, res) => {
    const start = performance.now();
    const { method, url } = req;
    
    // Log when response finishes
    res.on('finish', () => {
      const duration = performance.now() - start;
      const { statusCode } = res;
      const color = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';
      console.log(`${color} ${method} ${url} - ${statusCode} (${duration.toFixed(2)}ms)`);
    });
  };
}
