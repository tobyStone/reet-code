import test from 'node:test';
import assert from 'node:assert/strict';
import { getTestsForMode } from '../src/domain/ProgrammingTask.js';
import { judgeSubmission } from '../src/runner/index.js';
import { findTask } from '../src/tasks/index.js';

test('local python runner passes a worked solution', async () => {
  const task = findTask('matrix-shutdown');
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

test('local solidity runner passes a worked solution in EVM', async () => {
  const task = findTask('merit-ladder');
  const tests = getTestsForMode(task, 'run').map((testCase) => ({
    ...testCase,
    group: 'visible'
  }));

  const report = await judgeSubmission({
    task,
    mode: 'run',
    tests,
    code: task.workedSolutions.solidity.code
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

test('local python runner passes find-the-wedding-route in run and submit modes', async () => {
  const task = findTask('find-the-wedding-route');
  assert.ok(task, 'find-the-wedding-route task should exist');

  const runTests = getTestsForMode(task, 'run').map((testCase) => ({
    ...testCase,
    group: 'visible'
  }));

  const runReport = await judgeSubmission({
    task,
    mode: 'run',
    tests: runTests,
    code: task.workedSolutions.python.code
  });

  assert.equal(runReport.ok, true);
  assert.equal(runReport.totals.passed, runTests.length);

  const submitTests = getTestsForMode(task, 'submit');
  const submitReport = await judgeSubmission({
    task,
    mode: 'submit',
    tests: submitTests,
    code: task.workedSolutions.python.code
  });

  assert.equal(submitReport.ok, true);
  assert.equal(submitReport.totals.passed, submitTests.length);
});
