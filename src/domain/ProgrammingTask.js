const TEST_GROUPS = ['visible', 'hidden', 'edge', 'stress'];

export function validateProgrammingTask(task) {
  const errors = [];

  requireString(task, 'id', errors);
  requireString(task, 'slug', errors);
  requireString(task, 'title', errors);
  requireArray(task, 'topics', errors);
  requireArray(task, 'prerequisites', errors);
  requireObject(task, 'specification', errors);
  requireObject(task, 'testGroups', errors);
  requireObject(task, 'exemplarSolutions', errors);
  requireObject(task, 'expectedComplexity', errors);

  if (task.specification) {
    requireString(task.specification, 'description', errors, 'specification');
    requireString(task.specification, 'functionName', errors, 'specification');
    requireArray(task.specification, 'parameters', errors, 'specification');
    requireString(task.specification, 'returns', errors, 'specification');
    requireString(task.specification, 'starterCode', errors, 'specification');
  }

  if (task.testGroups) {
    for (const group of TEST_GROUPS) {
      requireArray(task.testGroups, group, errors, 'testGroups');
      for (const testCase of task.testGroups[group] || []) {
        validateTestCase(testCase, group, errors);
      }
    }
  }

  if (!task.exemplarSolutions?.javascript?.code) {
    errors.push('exemplarSolutions.javascript.code is required');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function getStudentTaskView(task) {
  return {
    id: task.id,
    slug: task.slug,
    title: task.title,
    sourceInspiration: task.sourceInspiration,
    summary: task.summary,
    difficulty: task.difficulty,
    topics: task.topics,
    prerequisites: task.prerequisites,
    specification: task.specification,
    examples: task.examples,
    visibleTests: task.testGroups.visible.map(maskExpectedTest),
    expectedComplexity: task.expectedComplexity
  };
}

export function getTestsForMode(task, mode) {
  if (mode === 'run') {
    return task.testGroups.visible.map((test) => ({ ...test, visible: true }));
  }

  return [
    ...task.testGroups.visible.map((test) => ({ ...test, visible: true })),
    ...task.testGroups.hidden.map((test) => ({ ...test, visible: false })),
    ...task.testGroups.edge.map((test) => ({ ...test, visible: false })),
    ...task.testGroups.stress.map((test) => ({ ...test, visible: false }))
  ];
}

export function getSchemaSummary() {
  return {
    name: 'ProgrammingTask',
    requiredFields: [
      'id',
      'slug',
      'title',
      'topics',
      'prerequisites',
      'specification',
      'examples',
      'testGroups.visible',
      'testGroups.hidden',
      'testGroups.edge',
      'testGroups.stress',
      'exemplarSolutions',
      'expectedComplexity'
    ],
    testGroupPurpose: {
      visible: 'Small transparent tests for the Run button.',
      hidden: 'General correctness checks for Submit.',
      edge: 'Boundary cases that should not guide rote solutions.',
      stress: 'Larger inputs used for timing and observed scaling.'
    }
  };
}

function validateTestCase(testCase, group, errors) {
  requireString(testCase, 'id', errors, `testGroups.${group}`);
  requireString(testCase, 'label', errors, `testGroups.${group}`);
  if (!Array.isArray(testCase.args)) {
    errors.push(`testGroups.${group}.${testCase.id || '<unknown>'}.args must be an array`);
  }
  if (!Object.hasOwn(testCase, 'expected')) {
    errors.push(`testGroups.${group}.${testCase.id || '<unknown>'}.expected is required`);
  }
}

function maskExpectedTest(test) {
  return {
    id: test.id,
    label: test.label,
    args: test.args,
    expected: test.expected,
    size: test.size
  };
}

function requireString(value, key, errors, parent = '') {
  if (typeof value?.[key] !== 'string' || value[key].trim() === '') {
    errors.push(`${parent ? `${parent}.` : ''}${key} must be a non-empty string`);
  }
}

function requireArray(value, key, errors, parent = '') {
  if (!Array.isArray(value?.[key])) {
    errors.push(`${parent ? `${parent}.` : ''}${key} must be an array`);
  }
}

function requireObject(value, key, errors, parent = '') {
  if (!value?.[key] || typeof value[key] !== 'object' || Array.isArray(value[key])) {
    errors.push(`${parent ? `${parent}.` : ''}${key} must be an object`);
  }
}
