export const feedbackVocabulary = {
  lad: {
    word: 'Lad',
    tone: 'needs-work',
    image: '/images/mug-lad.png',
    title: 'Not there yet, lad.',
    message: 'No drama. Read the first failing case, fix one thing, and run it again.'
  },
  eyUp: {
    word: 'Ey up',
    tone: 'started',
    image: '/images/mug-ey-up.png',
    title: 'Ey up, that is moving.',
    message: 'Some of the tests are passing. Keep following the evidence.'
  },
  sound: {
    word: 'Sound',
    tone: 'correct-run',
    image: '/images/mug-sound.png',
    title: 'Sound work.',
    message: 'The visible checks are happy. Submit when you are ready for the wider set.'
  },
  buzzin: {
    word: 'Buzzin',
    tone: 'correct-submit',
    image: '/images/mug-buzzin.png',
    title: 'Buzzin.',
    message: 'Correct across the judge set. Now look at how it scales.'
  },
  boss: {
    word: 'Boss',
    tone: 'efficient',
    image: '/images/mug-boss.png',
    title: 'Boss answer.',
    message: 'Correct and scaling nicely. That is tidy thinking.'
  }
};

export function selectFeedback(report) {
  const { mode, totals, ok, scaling } = report;

  if (ok && mode === 'submit' && scaling.rating === 'on-track') {
    return feedbackVocabulary.boss;
  }

  if (ok && mode === 'submit') {
    return feedbackVocabulary.buzzin;
  }

  if (ok) {
    return feedbackVocabulary.sound;
  }

  if (totals.passed > 0) {
    return feedbackVocabulary.eyUp;
  }

  return feedbackVocabulary.lad;
}

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

function estimateScaling(tests, expectedComplexity = {}) {
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
