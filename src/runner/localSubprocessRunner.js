import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(__dirname, 'worker.mjs');

export function runInLocalSubprocess({ task, code, mode, tests }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath], {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH || '',
        NODE_ENV: 'production'
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const hardLimitMs = mode === 'submit' ? 9000 : 4500;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      resolve({
        ok: false,
        setupError: `The runner timed out after ${hardLimitMs}ms.`,
        tests: [],
        stdout: []
      });
    }, hardLimitMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 1_000_000 && !settled) {
        settled = true;
        clearTimeout(timer);
        child.kill('SIGKILL');
        reject(new Error('Runner output was too large.'));
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Runner returned invalid output. ${stderr || error.message}`));
      }
    });

    child.stdin.end(
      JSON.stringify({
        code,
        functionName: task.specification.functionName,
        tests,
        mode,
        perTestTimeoutMs: mode === 'submit' ? 900 : 700
      })
    );
  });
}
