import { validateProgrammingTask } from '../domain/ProgrammingTask.js';

const TEST_GROUPS = ['visible', 'hidden', 'edge', 'stress'];

export async function generateProgrammingTaskFromSkill(
  skillDescription,
  { usedSlugs = [], forceFallback = false } = {}
) {
  const description = String(skillDescription || '').trim();
  if (!description) {
    throw new Error('Add a short description of the skill to test.');
  }

  if (!forceFallback && process.env.OPENAI_API_KEY) {
    try {
      const task = await generateWithOpenAI(description, usedSlugs);
      return {
        task,
        notice: `Boss. ChatGPT drafted "${task.title}" and it is ready in the student challenge area.`,
        usedOpenAI: true
      };
    } catch (error) {
      console.warn('OpenAI challenge generation failed; using local fallback.', error);
      const task = createFallbackTask(description, usedSlugs);
      return {
        task,
        notice:
          'OpenAI was not available, so Reet Code made a local draft instead. It is ready to test and tweak.',
        usedOpenAI: false
      };
    }
  }

  const task = createFallbackTask(description, usedSlugs);
  return {
    task,
    notice:
      'No OpenAI API key is set, so Reet Code made a local draft challenge. Add OPENAI_API_KEY to enable ChatGPT-built challenges.',
    usedOpenAI: false
  };
}

async function generateWithOpenAI(description, usedSlugs) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-sol',
      store: false,
      instructions:
        'You create safe educational JavaScript programming challenges for a LeetCode-style classroom site. Return only strict JSON. Do not wrap it in Markdown.',
      input: buildGenerationPrompt(description, usedSlugs)
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  const rawTask = parseJsonObject(text);
  const task = normaliseTask(rawTask, description, usedSlugs);
  assertUsefulGeneratedTask(task);
  return task;
}

function buildGenerationPrompt(description, usedSlugs) {
  return `Create one complete ProgrammingTask for this skill:\n\n${description}\n\nReturn a JSON object with exactly this shape:\n{
  "id": "GPT-001",
  "slug": "short-kebab-case-slug",
  "title": "Student-facing challenge title",
  "sourceInspiration": "Skill description",
  "summary": "One short sentence",
  "difficulty": 1-10,
  "topics": ["topic"],
  "prerequisites": ["prerequisite"],
  "specification": {
    "description": "Clear problem statement",
    "functionName": "validJavaScriptIdentifier",
    "parameters": [{"name": "value", "type": "number[]"}],
    "returns": "number",
    "constraints": ["constraint"],
    "starterCode": "function validJavaScriptIdentifier(value) {\\n  // Return the answer.\\n}\\n\\nmodule.exports = validJavaScriptIdentifier;"
  },
  "examples": [{"input": "value = ...", "output": "...", "explanation": "..."}],
  "testGroups": {
    "visible": [{"id": "visible-1", "label": "small clear case", "args": [[1,2,3]], "expected": 6, "size": 3}],
    "hidden": [{"id": "hidden-1", "label": "general case", "args": [[4,5]], "expected": 9, "size": 2}],
    "edge": [{"id": "edge-1", "label": "boundary case", "args": [[]], "expected": 0, "size": 0}],
    "stress": [{"id": "stress-1", "label": "larger case", "args": [[1,2,3,4]], "expected": 10, "size": 4}]
  },
  "workedSolutions": {
    "javascript": {
      "code": "function validJavaScriptIdentifier(value) {\\n  return 0;\\n}\\n\\nmodule.exports = validJavaScriptIdentifier;",
      "explanation": "Short teacher explanation"
    }
  },
  "expectedComplexity": {
    "time": "O(n)",
    "space": "O(1)",
    "maxObservedExponent": 1.35
  }
}

Rules:
- Use only JSON-serializable test inputs and expected values.
- Include at least 2 visible, 3 hidden, 3 edge and 2 stress tests.
- The worked JavaScript solution must export the named function with module.exports.
- Keep code self-contained with no file, network, eval, Function constructor or package access.
- Avoid these existing slugs: ${usedSlugs.join(', ') || 'none'}.`;
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string') {
    return payload.output_text;
  }

  const chunks = [];
  for (const outputItem of payload.output || []) {
    for (const contentItem of outputItem.content || []) {
      if (typeof contentItem.text === 'string') {
        chunks.push(contentItem.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function parseJsonObject(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('OpenAI returned an empty challenge.');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('OpenAI did not return JSON.');
    }
    return JSON.parse(match[0]);
  }
}

function normaliseTask(rawTask, description, usedSlugs) {
  const baseTitle = cleanText(rawTask.title) || titleFromDescription(description);
  const slug = uniqueSlug(slugify(rawTask.slug || baseTitle), usedSlugs);
  const functionName = validFunctionName(rawTask.specification?.functionName) || camelCase(slug);
  const parameters = normaliseParameters(rawTask.specification?.parameters);
  const starterCode = makeStarterCode(functionName, parameters);
  const solutionCode = withModuleExport(cleanText(rawTask.workedSolutions?.javascript?.code), functionName);

  return {
    id: cleanText(rawTask.id) || `GPT-${Date.now().toString(36).toUpperCase()}`,
    slug,
    title: baseTitle,
    sourceInspiration: cleanText(rawTask.sourceInspiration) || 'Teacher skill prompt',
    summary: cleanText(rawTask.summary) || `Practise ${description}.`,
    difficulty: clampNumber(rawTask.difficulty, 1, 10, 5),
    topics: normaliseStringArray(rawTask.topics, ['teacher-built', 'practice']),
    prerequisites: normaliseStringArray(rawTask.prerequisites, ['functions', 'conditionals', 'loops']),
    specification: {
      description:
        cleanText(rawTask.specification?.description) ||
        `Solve the task designed to practise this skill: ${description}.`,
      functionName,
      parameters,
      returns: cleanText(rawTask.specification?.returns) || 'any',
      constraints: normaliseStringArray(rawTask.specification?.constraints, ['Inputs are JSON-serializable.']),
      starterCode
    },
    examples: Array.isArray(rawTask.examples) && rawTask.examples.length > 0 ? rawTask.examples : [],
    testGroups: normaliseTestGroups(rawTask.testGroups, slug),
    workedSolutions: {
      javascript: {
        code: solutionCode,
        explanation:
          cleanText(rawTask.workedSolutions?.javascript?.explanation) ||
          'Use the same shape as the problem statement, then keep the loop state small and clear.'
      }
    },
    expectedComplexity: {
      time: cleanText(rawTask.expectedComplexity?.time) || 'O(n)',
      space: cleanText(rawTask.expectedComplexity?.space) || 'O(1)',
      maxObservedExponent: clampNumber(rawTask.expectedComplexity?.maxObservedExponent, 1, 4, 1.5)
    }
  };
}

function assertUsefulGeneratedTask(task) {
  for (const group of TEST_GROUPS) {
    if (task.testGroups[group].length === 0) {
      throw new Error(`Generated task has no ${group} tests.`);
    }
  }

  const result = validateProgrammingTask(task);
  if (!result.ok) {
    throw new Error(`Generated task failed validation:\n${result.errors.join('\n')}`);
  }
}

function createFallbackTask(description, usedSlugs) {
  const title = titleFromDescription(description);
  const slug = uniqueSlug(slugify(title), usedSlugs);
  const functionName = camelCase(slug);
  const smallValues = [4, 9, 12, 3, 18, 7];
  const stressSmall = Array.from({ length: 900 }, (_, index) => (index * 7) % 41);
  const stressLarge = Array.from({ length: 2200 }, (_, index) => (index * 11) % 73);

  const countAtLeast = (values, minimum) => values.filter((value) => value >= minimum).length;

  return {
    id: `GPT-${Date.now().toString(36).toUpperCase()}`,
    slug,
    title,
    sourceInspiration: 'Teacher skill prompt',
    summary: `Practise ${description} with a clear counting-and-filtering problem.`,
    difficulty: 4,
    topics: ['arrays', 'conditionals', 'loops'],
    prerequisites: ['functions', 'arrays', 'comparisons'],
    specification: {
      description:
        `A teacher wants a quick check for this skill: ${description}. Given an array of scores and a minimum score, return how many scores are at least that minimum.`,
      functionName,
      parameters: [
        { name: 'scores', type: 'number[]' },
        { name: 'minimum', type: 'number' }
      ],
      returns: 'number',
      constraints: ['0 <= scores.length <= 2500', '-1000 <= scores[i], minimum <= 1000'],
      starterCode: `function ${functionName}(scores, minimum) {\n  // Return how many scores are at least the minimum.\n}\n\nmodule.exports = ${functionName};`
    },
    examples: [
      {
        input: 'scores = [4, 9, 12, 3, 18, 7], minimum = 8',
        output: '3',
        explanation: '9, 12 and 18 are at least 8.'
      }
    ],
    testGroups: {
      visible: [
        makeTest(`${slug}-v1`, 'Some scores qualify', [smallValues, 8], 3, { size: smallValues.length }),
        makeTest(`${slug}-v2`, 'Everything qualifies', [[5, 6, 7], 5], 3, { size: 3 })
      ],
      hidden: [
        makeTest(`${slug}-h1`, 'Nothing qualifies', [[1, 2, 3], 10], 0, { size: 3 }),
        makeTest(`${slug}-h2`, 'Equal to the boundary counts', [[8, 8, 9, 2], 8], 3, { size: 4 }),
        makeTest(`${slug}-h3`, 'Negative scores', [[-5, -2, 0, 4], -2], 3, { size: 4 })
      ],
      edge: [
        makeTest(`${slug}-e1`, 'No scores', [[], 10], 0, { size: 0 }),
        makeTest(`${slug}-e2`, 'Single passing score', [[10], 10], 1, { size: 1 }),
        makeTest(`${slug}-e3`, 'Single failing score', [[9], 10], 0, { size: 1 })
      ],
      stress: [
        makeTest(`${slug}-s1`, 'Long class list', [stressSmall, 20], countAtLeast(stressSmall, 20), {
          size: stressSmall.length
        }),
        makeTest(`${slug}-s2`, 'Very long class list', [stressLarge, 36], countAtLeast(stressLarge, 36), {
          size: stressLarge.length
        })
      ]
    },
    workedSolutions: {
      javascript: {
        code: `function ${functionName}(scores, minimum) {\n  let total = 0;\n\n  for (const score of scores) {\n    if (score >= minimum) {\n      total += 1;\n    }\n  }\n\n  return total;\n}\n\nmodule.exports = ${functionName};`,
        explanation:
          'Walk through the scores once, add one whenever the current score meets the threshold, and return the total.'
      }
    },
    expectedComplexity: {
      time: 'O(n)',
      space: 'O(1)',
      maxObservedExponent: 1.35
    }
  };
}

function normaliseTestGroups(testGroups, slug) {
  const groups = {};
  for (const group of TEST_GROUPS) {
    groups[group] = Array.isArray(testGroups?.[group])
      ? testGroups[group]
          .map((testCase, index) => normaliseTestCase(testCase, group, index, slug))
          .filter(Boolean)
      : [];
  }
  return groups;
}

function normaliseTestCase(testCase, group, index, slug) {
  if (!testCase || !Array.isArray(testCase.args) || !Object.hasOwn(testCase, 'expected')) {
    return null;
  }

  return {
    id: cleanText(testCase.id) || `${slug}-${group}-${index + 1}`,
    label: cleanText(testCase.label) || `${group} case ${index + 1}`,
    args: testCase.args,
    expected: testCase.expected,
    size: Number.isFinite(Number(testCase.size)) ? Number(testCase.size) : estimateSize(testCase.args)
  };
}

function normaliseParameters(parameters) {
  if (!Array.isArray(parameters) || parameters.length === 0) {
    return [{ name: 'input', type: 'any' }];
  }

  return parameters.map((parameter, index) => ({
    name: validFunctionName(parameter?.name) || `input${index + 1}`,
    type: cleanText(parameter?.type) || 'any'
  }));
}

function makeStarterCode(functionName, parameters) {
  const parameterNames = parameters.map((parameter) => parameter.name).join(', ');
  return `function ${functionName}(${parameterNames}) {\n  // Return the answer.\n}\n\nmodule.exports = ${functionName};`;
}

function normaliseStringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value.map(cleanText).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function withModuleExport(code, functionName) {
  const baseCode =
    cleanText(code) ||
    `function ${functionName}(input) {\n  return input;\n}\n\nmodule.exports = ${functionName};`;

  if (baseCode.includes('module.exports')) {
    return baseCode;
  }

  return `${baseCode}\n\nmodule.exports = ${functionName};`;
}

function makeTest(id, label, args, expected, extra = {}) {
  return {
    id,
    label,
    args,
    expected,
    ...extra
  };
}

function titleFromDescription(description) {
  const words = description
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 4);

  if (words.length === 0) {
    return 'Teacher Built Challenge';
  }

  return `${words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ')} Check`;
}

function uniqueSlug(baseSlug, usedSlugs) {
  const used = new Set(usedSlugs);
  let slug = baseSlug || 'teacher-built-challenge';
  let suffix = 2;

  while (used.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function slugify(value) {
  return (
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'teacher-built-challenge'
  );
}

function camelCase(value) {
  const words = slugify(value).split('-');
  const name = words
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('');
  return validFunctionName(name) || 'teacherBuiltChallenge';
}

function validFunctionName(value) {
  const cleaned = cleanText(value);
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cleaned) ? cleaned : '';
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function estimateSize(args) {
  const [firstArg] = args;
  if (Array.isArray(firstArg)) {
    return firstArg.length;
  }
  return args.length;
}
