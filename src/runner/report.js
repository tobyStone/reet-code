export function buildJudgeReport({ task, mode, runnerResult }) {
  const tests = runnerResult.tests || [];
  const total = tests.length;
  const passed = tests.filter((test) => test.passed).length;
  const failed = tests.filter((test) => !test.passed);
  const durationMs = tests.reduce((sum, test) => sum + Number(test.durationMs || 0), 0);
  const peakMemoryBytes = tests.reduce((max, test) => Math.max(max, Number(test.memoryBytes || 0)), 0);
  const groups = summarizeGroups(tests);
  const scaling = estimateScaling(tests, task.expectedComplexity);

  return {
    mode,
    task: {
      slug: task.slug,
      title: task.title,
      expectedComplexity: task.expectedComplexity
    },
    ok: runnerResult.ok && failed.length === 0,
    setupError: runnerResult.setupError,
    totals: {
      passed,
      total,
      durationMs: round(durationMs),
      peakMemoryMb: round(peakMemoryBytes / 1024 / 1024)
    },
    groups,
    scaling,
    failures: failed.map((test) => ({
      id: test.id,
      label: test.label,
      group: test.group,
      visible: test.visible,
      error: test.error || test.setupError,
      input: test.input,
      expected: test.expected,
      actual: test.actual
    })),
    tests: tests.map((test) => ({
      id: test.id,
      label: test.label,
      group: test.group,
      visible: test.visible,
      passed: test.passed,
      durationMs: round(test.durationMs || 0),
      memoryMb: round((test.memoryBytes || 0) / 1024 / 1024),
      size: test.size || 0,
      input: test.input,
      expected: test.expected,
      actual: test.actual,
      error: test.error || test.setupError
    })),
    stdout: runnerResult.stdout || []
  };
}

function summarizeGroups(tests) {
  const groups = {};
  for (const test of tests) {
    if (!groups[test.group]) {
      groups[test.group] = { passed: 0, total: 0 };
    }
    groups[test.group].total += 1;
    if (test.passed) {
      groups[test.group].passed += 1;
    }
  }
  return groups;
}

function estimateScaling(tests, expectedComplexity) {
  const stress = tests
    .filter((test) => test.group === 'stress' && test.passed && test.size > 0 && test.durationMs > 0)
    .sort((a, b) => a.size - b.size);

  if (stress.length < 2) {
    return {
      available: false,
      label: 'Not enough passing stress data yet.',
      rating: 'unknown'
    };
  }

  const first = stress[0];
  const last = stress[stress.length - 1];
  const sizeRatio = last.size / first.size;
  const timeRatio = Math.max(last.durationMs, 0.01) / Math.max(first.durationMs, 0.01);

  if (last.durationMs < 2 || timeRatio < 1.2) {
    return {
      available: true,
      sizeRatio: round(sizeRatio),
      timeRatio: round(timeRatio),
      observedExponent: 0,
      label: 'stress checks passed, but the timings are too small to infer scaling confidently',
      rating: 'on-track'
    };
  }

  const exponent = Math.log(timeRatio) / Math.log(sizeRatio);
  const roundedExponent = round(exponent);
  const expectedMax = Number(expectedComplexity.maxObservedExponent || 2);
  const rating = exponent <= expectedMax ? 'on-track' : 'watch';

  return {
    available: true,
    sizeRatio: round(sizeRatio),
    timeRatio: round(timeRatio),
    observedExponent: roundedExponent,
    label: describeExponent(exponent),
    rating
  };
}

function describeExponent(exponent) {
  if (exponent < 0.35) return 'roughly constant or heavily optimised at this scale';
  if (exponent < 0.8) return 'sub-linear to near-linear in this run';
  if (exponent < 1.35) return 'approximately linear';
  if (exponent < 1.75) return 'between linear and quadratic';
  if (exponent < 2.4) return 'close to quadratic';
  return 'growing very quickly as input increases';
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
