import test from 'node:test';
import assert from 'node:assert/strict';
import { getTestsForMode } from '../src/domain/ProgrammingTask.js';
import { judgeSubmission } from '../src/runner/index.js';
import { findTask } from '../src/tasks/index.js';

test('local runner passes a worked solution without executing in the server process', async () => {
  const task = findTask('merit-ladder');
  const tests = getTestsForMode(task, 'run').map((testCase) => ({
    ...testCase,
    group: 'visible'
  }));

  const report = await judgeSubmission({
    task,
    mode: 'run',
    tests,
    code: task.workedSolutions.python.code
  });

  assert.equal(report.ok, true);
  assert.equal(report.totals.passed, tests.length);
});

test('runner reports failing visible details', async () => {
  const task = findTask('pair-the-pasties');
  const tests = getTestsForMode(task, 'run').map((testCase) => ({
    ...testCase,
    group: 'visible'
  }));

  const report = await judgeSubmission({
    task,
    mode: 'run',
    tests,
    code: 'def findPastiePair(prices, budget):\n    return []'
  });

  assert.equal(report.ok, false);
  assert.ok(report.failures.some((failure) => failure.visible));
  assert.ok(report.failures[0].expected);
});
