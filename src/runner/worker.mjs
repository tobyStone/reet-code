import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const input = await readStdin();
const job = JSON.parse(input);
const logs = [];

const results = [];
let setupError = null;

for (const testCase of job.tests) {
  const result = runSingleTest(job, testCase, logs);
  results.push(result);
  if (result.setupError) {
    setupError = result.setupError;
    break;
  }
}

process.stdout.write(
  JSON.stringify({
    ok: !setupError,
    setupError,
    tests: results,
    stdout: logs.slice(0, 20)
  })
);

function runSingleTest(job, testCase, logs) {
  const startedAt = performance.now();

  try {
    const context = createContext(logs);
    const script = new vm.Script(`"use strict";\n${job.code}`, { filename: 'student-solution.js' });
    script.runInContext(context, { timeout: 300 });

    const candidate = resolveCandidate(context, job.functionName);
    if (typeof candidate !== 'function') {
      return {
        id: testCase.id,
        label: testCase.label,
        group: testCase.group,
        visible: Boolean(testCase.visible),
        passed: false,
        setupError: `Export a function named ${job.functionName} or assign it to module.exports.`,
        durationMs: 0,
        memoryBytes: process.memoryUsage().rss
      };
    }

    context.__candidate = candidate;
    context.__args = structuredClone(testCase.args);

    const callScript = new vm.Script('globalThis.__result = globalThis.__candidate(...globalThis.__args);');
    const beforeCall = performance.now();
    callScript.runInContext(context, { timeout: job.perTestTimeoutMs });
    const durationMs = performance.now() - beforeCall;
    const actual = toSerializable(context.__result);
    const passed = deepEqual(actual, testCase.expected);

    return {
      id: testCase.id,
      label: testCase.label,
      group: testCase.group,
      visible: Boolean(testCase.visible),
      passed,
      durationMs,
      memoryBytes: process.memoryUsage().rss,
      size: testCase.size || 0,
      input: testCase.visible ? testCase.args : undefined,
      expected: testCase.visible ? testCase.expected : undefined,
      actual: testCase.visible ? actual : undefined
    };
  } catch (error) {
    return {
      id: testCase.id,
      label: testCase.label,
      group: testCase.group,
      visible: Boolean(testCase.visible),
      passed: false,
      error: cleanError(error),
      durationMs: performance.now() - startedAt,
      memoryBytes: process.memoryUsage().rss,
      size: testCase.size || 0,
      input: testCase.visible ? testCase.args : undefined,
      expected: testCase.visible ? testCase.expected : undefined
    };
  }
}

function createContext(logs) {
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    console: {
      log: (...values) => {
        if (logs.length < 20) {
          logs.push(values.map((value) => String(value)).join(' ').slice(0, 300));
        }
      }
    },
    Array,
    Boolean,
    Date,
    JSON,
    Map,
    Math,
    Number,
    Object,
    Set,
    String,
    structuredClone
  };

  return vm.createContext(sandbox, {
    codeGeneration: {
      strings: false,
      wasm: false
    }
  });
}

function resolveCandidate(context, functionName) {
  if (typeof context.module.exports === 'function') {
    return context.module.exports;
  }

  if (context.module.exports && typeof context.module.exports[functionName] === 'function') {
    return context.module.exports[functionName];
  }

  if (typeof context[functionName] === 'function') {
    return context[functionName];
  }

  return null;
}

function toSerializable(value) {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
}

function deepEqual(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function cleanError(error) {
  if (error?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
    return 'This test timed out. Have another look for an infinite loop or a very slow approach.';
  }

  return String(error?.message || error).slice(0, 500);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Input too large'));
      }
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
