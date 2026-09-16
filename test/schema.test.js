import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProgrammingTask } from '../src/domain/ProgrammingTask.js';
import { tasks } from '../src/tasks/index.js';

test('all starter tasks satisfy the ProgrammingTask schema', () => {
  assert.equal(tasks.length, 5);

  for (const task of tasks) {
    const result = validateProgrammingTask(task);
    assert.deepEqual(result.errors, []);
    assert.equal(result.ok, true);
  }
});

test('every task has the required test groups', () => {
  for (const task of tasks) {
    assert.ok(task.testGroups.visible.length >= 2, `${task.slug} needs visible tests`);
    assert.ok(task.testGroups.hidden.length >= 3, `${task.slug} needs hidden tests`);
    assert.ok(task.testGroups.edge.length >= 3, `${task.slug} needs edge tests`);
    assert.ok(task.testGroups.stress.length >= 2, `${task.slug} needs stress tests`);
  }
});
