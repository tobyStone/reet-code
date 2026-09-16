import test from 'node:test';
import assert from 'node:assert/strict';
import { getTestsForMode, validateProgrammingTask } from '../src/domain/ProgrammingTask.js';
import { generateProgrammingTaskFromSkill } from '../src/services/challengeGenerator.js';
import { judgeSubmission } from '../src/runner/index.js';

test('fallback challenge builder creates a valid runnable ProgrammingTask', async () => {
  const { task, notice, usedOpenAI } = await generateProgrammingTaskFromSkill(
    'using conditionals and loops to count matching values',
    {
      forceFallback: true,
      usedSlugs: []
    }
  );

  const validation = validateProgrammingTask(task);
  assert.equal(usedOpenAI, false);
  assert.match(notice, /local draft/i);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ok, true);
  assert.ok(task.testGroups.visible.length >= 2);
  assert.ok(task.testGroups.hidden.length >= 3);
  assert.ok(task.testGroups.edge.length >= 3);
  assert.ok(task.testGroups.stress.length >= 2);

  const tests = getTestsForMode(task, 'submit').map((testCase) => ({
    ...testCase,
    group: 'generated'
  }));
  const report = await judgeSubmission({
    task,
    mode: 'submit',
    tests,
    code: task.workedSolutions.javascript.code
  });

  assert.equal(report.ok, true);
});
