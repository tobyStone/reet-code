import { validateProgrammingTask } from '../domain/ProgrammingTask.js';

const makeTest = (id, label, args, expected, extra = {}) => ({
  id,
  label,
  args,
  expected,
  ...extra
});

function matrixShutdownReference(matrix) {
  const rows = new Set();
  const cols = new Set();

  matrix.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        rows.add(rowIndex);
        cols.add(colIndex);
      }
    });
  });

  return matrix.map((row, rowIndex) =>
    row.map((value, colIndex) => (rows.has(rowIndex) || cols.has(colIndex) ? 0 : value))
  );
}

function findPastiePairReference(prices, budget) {
  const seen = new Map();

  for (let index = 0; index < prices.length; index += 1) {
    const needed = budget - prices[index];
    if (seen.has(needed)) {
      return [seen.get(needed), index];
    }
    if (!seen.has(prices[index])) {
      seen.set(prices[index], index);
    }
  }

  return [];
}

function mergeBusWindowsReference(windows) {
  if (windows.length === 0) {
    return [];
  }

  const sorted = windows.map(([start, end]) => [start, end]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function flattenKitBagReference(items) {
  const output = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else {
      output.push(value);
    }
  };
  visit(items);
  return output;
}

function maxMeritPointsReference(points) {
  let skip = 0;
  let take = 0;

  for (const score of points) {
    const nextTake = skip + score;
    skip = Math.max(skip, take);
    take = nextTake;
  }

  return Math.max(skip, take);
}

function createMatrix(rows, cols, zeroEvery = 0) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      if (zeroEvery > 0 && (row * cols + col) % zeroEvery === 0) {
        return 0;
      }
      return ((row + 3) * (col + 5)) % 97;
    })
  );
}

function createPairStress() {
  const prices = Array.from({ length: 4500 }, (_, index) => index * 10);
  prices[321] = 12345;
  prices[3890] = 54321;
  return { prices, budget: 66666 };
}

function createIntervalStress(count) {
  const windows = [];
  for (let index = 0; index < count; index += 1) {
    const base = index * 3;
    windows.push([base + 1, base + 3]);
    windows.push([base, base + 2]);
  }
  return windows.reverse();
}

function createNestedStress(size) {
  let nested = [];
  for (let index = size - 1; index >= 0; index -= 1) {
    nested = [index, nested];
  }
  return nested;
}

const matrixStressSmall = createMatrix(26, 30, 47);
const matrixStressLarge = createMatrix(48, 55, 71);
const pairStress = createPairStress();
const intervalStressSmall = createIntervalStress(700);
const intervalStressLarge = createIntervalStress(1800);
const nestedStressSmall = createNestedStress(350);
const nestedStressLarge = createNestedStress(950);
const meritStressSmall = Array.from({ length: 1800 }, (_, index) => (index * 17) % 103);
const meritStressLarge = Array.from({ length: 5200 }, (_, index) => (index * 31) % 127);

export const tasks = [
  {
    id: 'ARRAY-2D-003',
    slug: 'matrix-shutdown',
    title: 'Matrix Shutdown',
    sourceInspiration: 'Set Matrix Zeroes',
    summary: 'Mark every row and column as shut down when one sensor reads zero.',
    difficulty: 6,
    topics: ['2D arrays', 'nested loops', 'mutation planning'],
    prerequisites: ['arrays', 'for loops', 'nested loops'],
    specification: {
      description:
        "A workshop grid is represented by a 2D array of integers. If any cell contains 0, every value in that cell's row and column must become 0. Return the updated grid. Be careful: zeros you create while solving must not trigger extra shutdowns.",
      functionName: 'matrixShutdown',
      parameters: [{ name: 'matrix', type: 'number[][]' }],
      returns: 'number[][]',
      constraints: ['1 <= rows, columns <= 60', '-1000 <= matrix[row][col] <= 1000'],
      starterCode:
        'def matrixShutdown(matrix):\n    # Return the updated matrix.\n    pass'
    },
    examples: [
      {
        input: 'matrix = [[4,8,2],[7,0,5],[9,3,1]]',
        output: '[[4,0,2],[0,0,0],[9,0,1]]',
        explanation: 'The zero at row 1, column 1 shuts down that whole row and column.'
      }
    ],
    testGroups: {
      visible: [
        makeTest('matrix-v1', 'One middle zero', [[[4, 8, 2], [7, 0, 5], [9, 3, 1]]], [[4, 0, 2], [0, 0, 0], [9, 0, 1]], { size: 9 }),
        makeTest('matrix-v2', 'Two shutdown points', [[[1, 2, 3, 4], [5, 0, 7, 8], [9, 10, 11, 0]]], [[1, 0, 3, 0], [0, 0, 0, 0], [0, 0, 0, 0]], { size: 12 })
      ],
      hidden: [
        makeTest('matrix-h1', 'No zeros', [[[1, 2], [3, 4]]], [[1, 2], [3, 4]], { size: 4 }),
        makeTest('matrix-h2', 'Zero in first row', [[[0, 2, 3], [4, 5, 6], [7, 8, 9]]], [[0, 0, 0], [0, 5, 6], [0, 8, 9]], { size: 9 }),
        makeTest('matrix-h3', 'Column cascade trap', [[[1, 2, 0], [4, 5, 6], [0, 8, 9], [10, 11, 12]]], [[0, 0, 0], [0, 5, 0], [0, 0, 0], [0, 11, 0]], { size: 12 })
      ],
      edge: [
        makeTest('matrix-e1', 'Single cell zero', [[[0]]], [[0]], { size: 1 }),
        makeTest('matrix-e2', 'Single row', [[[5, 0, 7, 8]]], [[0, 0, 0, 0]], { size: 4 }),
        makeTest('matrix-e3', 'Single column', [[[1], [0], [3]]], [[0], [0], [0]], { size: 3 })
      ],
      stress: [
        makeTest('matrix-s1', 'Medium workshop grid', [matrixStressSmall], matrixShutdownReference(matrixStressSmall), { size: 780 }),
        makeTest('matrix-s2', 'Large workshop grid', [matrixStressLarge], matrixShutdownReference(matrixStressLarge), { size: 2640 })
      ]
    },
    workedSolutions: {
      python: {
        code:
          'def matrixShutdown(matrix):\n    rows = set()\n    cols = set()\n\n    for r, row in enumerate(matrix):\n        for c, value in enumerate(row):\n            if value == 0:\n                rows.add(r)\n                cols.add(c)\n\n    return [\n        [0 if r in rows or c in cols else value for c, value in enumerate(row)]\n        for r, row in enumerate(matrix)\n    ]',
        explanation: 'First remember the original rows and columns containing zero, then perform the updates in a second pass.'
      }
    },
    expectedComplexity: {
      time: 'O(rows * columns)',
      space: 'O(rows + columns)',
      maxObservedExponent: 1.35
    }
  },
  {
    id: 'HASH-LOOKUP-001',
    slug: 'pair-the-pasties',
    title: 'Pair the Pasties',
    sourceInspiration: 'Two Sum',
    summary: 'Find the first pair of prices that exactly matches a lunch budget.',
    difficulty: 4,
    topics: ['hash maps', 'arrays', 'single-pass lookup'],
    prerequisites: ['arrays', 'objects or maps', 'loops'],
    specification: {
      description:
        'Given a list of pasty prices and a target budget, return the first pair of zero-based indices whose prices add to the budget. Scan left to right; the first valid pair discovered during that scan is the answer. Return [] if no pair exists.',
      functionName: 'findPastiePair',
      parameters: [
        { name: 'prices', type: 'number[]' },
        { name: 'budget', type: 'number' }
      ],
      returns: 'number[]',
      constraints: ['0 <= prices.length <= 5000', '0 <= price, budget <= 1000000'],
      starterCode:
        'def findPastiePair(prices, budget):\n    # Return [leftIndex, rightIndex]\n    # or [] if no pair exists.\n    pass'
    },
    examples: [
      {
        input: 'prices = [3, 8, 4, 7, 5], budget = 12',
        output: '[1, 2]',
        explanation: '8 + 4 gives 12, and that is the first valid pair discovered while scanning.'
      }
    ],
    testGroups: {
      visible: [
        makeTest('pair-v1', 'Basic pair', [[3, 8, 4, 7, 5], 12], [1, 2], { size: 5 }),
        makeTest('pair-v2', 'Uses duplicate values', [[6, 1, 6, 2], 12], [0, 2], { size: 4 }),
        makeTest('pair-v3', 'No answer', [[2, 4, 9], 20], [], { size: 3 })
      ],
      hidden: [
        makeTest('pair-h1', 'Answer at the end', [[11, 14, 2, 8, 19, 1], 20], [4, 5], { size: 6 }),
        makeTest('pair-h2', 'Keeps earliest partner', [[5, 5, 5, 5], 10], [0, 1], { size: 4 }),
        makeTest('pair-h3', 'Zero budget', [[0, 3, 0], 0], [0, 2], { size: 3 })
      ],
      edge: [
        makeTest('pair-e1', 'Empty list', [[], 10], [], { size: 0 }),
        makeTest('pair-e2', 'Single value', [[10], 10], [], { size: 1 }),
        makeTest('pair-e3', 'Negative-style trap avoided by constraints', [[1, 999999, 2], 1000001], [1, 2], { size: 3 })
      ],
      stress: [
        makeTest('pair-s1', 'Wide menu', [pairStress.prices.slice(0, 1800), pairStress.budget], findPastiePairReference(pairStress.prices.slice(0, 1800), pairStress.budget), { size: 1800 }),
        makeTest('pair-s2', 'Very wide menu', [pairStress.prices, pairStress.budget], findPastiePairReference(pairStress.prices, pairStress.budget), { size: pairStress.prices.length })
      ]
    },
    workedSolutions: {
      python: {
        code:
          'def findPastiePair(prices, budget):\n    seen = {}\n\n    for index, price in enumerate(prices):\n        needed = budget - price\n        if needed in seen:\n            return [seen[needed], index]\n        if price not in seen:\n            seen[price] = index\n\n    return []',
        explanation: 'Store prices you have already seen so each new price only needs one lookup.'
      }
    },
    expectedComplexity: {
      time: 'O(n)',
      space: 'O(n)',
      maxObservedExponent: 1.3
    }
  },
  {
    id: 'SORT-INTERVAL-002',
    slug: 'tidy-bus-times',
    title: 'Tidy Bus Times',
    sourceInspiration: 'Merge Intervals',
    summary: 'Merge overlapping time windows into a clean timetable.',
    difficulty: 5,
    topics: ['sorting', 'intervals', 'array transformation'],
    prerequisites: ['arrays', 'sorting', 'conditionals'],
    specification: {
      description:
        'A bus stop display has collected overlapping service windows. Each window is [startMinute, endMinute]. Sort and merge overlapping windows. Windows that only touch, such as [10, 20] and [20, 25], should also merge.',
      functionName: 'mergeBusWindows',
      parameters: [{ name: 'windows', type: 'number[][]' }],
      returns: 'number[][]',
      constraints: ['0 <= windows.length <= 4000', '0 <= startMinute <= endMinute <= 1440'],
      starterCode:
        'def mergeBusWindows(windows):\n    # Return merged windows sorted by start time.\n    pass'
    },
    examples: [
      {
        input: 'windows = [[30,45],[5,10],[10,20],[18,22]]',
        output: '[[5,22],[30,45]]',
        explanation: 'The first three windows connect into one longer service window.'
      }
    ],
    testGroups: {
      visible: [
        makeTest('bus-v1', 'Unsorted overlaps', [[[30, 45], [5, 10], [10, 20], [18, 22]]], [[5, 22], [30, 45]], { size: 4 }),
        makeTest('bus-v2', 'Already tidy', [[[1, 3], [6, 8]]], [[1, 3], [6, 8]], { size: 2 })
      ],
      hidden: [
        makeTest('bus-h1', 'Nested window', [[[2, 12], [4, 8], [15, 20]]], [[2, 12], [15, 20]], { size: 3 }),
        makeTest('bus-h2', 'All merge', [[[50, 60], [10, 20], [20, 30], [29, 55]]], [[10, 60]], { size: 4 }),
        makeTest('bus-h3', 'Same start', [[[4, 9], [4, 6], [10, 10]]], [[4, 9], [10, 10]], { size: 3 })
      ],
      edge: [
        makeTest('bus-e1', 'No windows', [[]], [], { size: 0 }),
        makeTest('bus-e2', 'Single window', [[[12, 18]]], [[12, 18]], { size: 1 }),
        makeTest('bus-e3', 'Point windows touch', [[[3, 3], [3, 4], [5, 5]]], [[3, 4], [5, 5]], { size: 3 })
      ],
      stress: [
        makeTest('bus-s1', 'Crowded morning board', [intervalStressSmall], mergeBusWindowsReference(intervalStressSmall), { size: intervalStressSmall.length }),
        makeTest('bus-s2', 'Crowded full-day board', [intervalStressLarge], mergeBusWindowsReference(intervalStressLarge), { size: intervalStressLarge.length })
      ]
    },
    workedSolutions: {
      python: {
        code:
          'def mergeBusWindows(windows):\n    if not windows:\n        return []\n\n    sorted_windows = sorted(([start, end] for start, end in windows), key=lambda window: (window[0], window[1]))\n    merged = [sorted_windows[0]]\n\n    for current in sorted_windows[1:]:\n        last = merged[-1]\n        if current[0] <= last[1]:\n            last[1] = max(last[1], current[1])\n        else:\n            merged.append(current)\n\n    return merged',
        explanation: 'Sort first, then keep extending the latest merged window while overlaps continue.'
      }
    },
    expectedComplexity: {
      time: 'O(n log n)',
      space: 'O(n)',
      maxObservedExponent: 1.75
    }
  },
  {
    id: 'RECURSION-STACK-001',
    slug: 'flatten-the-kit-bag',
    title: 'Flatten the Kit Bag',
    sourceInspiration: 'Flatten Deeply Nested Array',
    summary: 'Turn a nested kit list into one left-to-right packing list.',
    difficulty: 5,
    topics: ['recursion', 'nested arrays', 'depth-first traversal'],
    prerequisites: ['arrays', 'functions', 'recursion or stacks'],
    specification: {
      description:
        'A kit bag can contain item numbers or smaller bags. Return a flat list of all item numbers in their original left-to-right order. The input may be nested many levels deep.',
      functionName: 'flattenKitBag',
      parameters: [{ name: 'items', type: '(number | array)[]' }],
      returns: 'number[]',
      constraints: ['0 <= total item count <= 1000', '0 <= nesting depth <= 1000'],
      starterCode:
        'def flattenKitBag(items):\n    # Return one flat list of numbers.\n    pass'
    },
    examples: [
      {
        input: 'items = [4,[7,2],[[8,1],[5,[9,3]]]]',
        output: '[4,7,2,8,1,5,9,3]',
        explanation: 'Read each nested bag from left to right.'
      }
    ],
    testGroups: {
      visible: [
        makeTest('flat-v1', 'Mixed nesting', [[4, [7, 2], [[8, 1], [5, [9, 3]]]]], [4, 7, 2, 8, 1, 5, 9, 3], { size: 8 }),
        makeTest('flat-v2', 'Already flat', [[1, 2, 3]], [1, 2, 3], { size: 3 })
      ],
      hidden: [
        makeTest('flat-h1', 'Empty bags vanish', [[[[], 1], [2, []], 3]], [1, 2, 3], { size: 3 }),
        makeTest('flat-h2', 'Single deep item', [[[[[[42]]]]]], [42], { size: 1 }),
        makeTest('flat-h3', 'Alternating shape', [[[1, [2]], 3, [[4, [5]]]]], [1, 2, 3, 4, 5], { size: 5 })
      ],
      edge: [
        makeTest('flat-e1', 'Empty kit', [[]], [], { size: 0 }),
        makeTest('flat-e2', 'Only empty bags', [[[[], [[]], []]]], [], { size: 0 }),
        makeTest('flat-e3', 'Zero is a real item', [[[0, [1, [0]]]]], [0, 1, 0], { size: 3 })
      ],
      stress: [
        makeTest('flat-s1', 'Deep training kit', [nestedStressSmall], flattenKitBagReference(nestedStressSmall), { size: 350 }),
        makeTest('flat-s2', 'Very deep expedition kit', [nestedStressLarge], flattenKitBagReference(nestedStressLarge), { size: 950 })
      ]
    },
    workedSolutions: {
      python: {
        code:
          'def flattenKitBag(items):\n    output = []\n\n    def visit(value):\n        if isinstance(value, list):\n            for child in value:\n                visit(child)\n        else:\n            output.append(value)\n\n    visit(items)\n    return output',
        explanation: 'A depth-first walk naturally preserves the left-to-right order.'
      }
    },
    expectedComplexity: {
      time: 'O(n)',
      space: 'O(depth + n)',
      maxObservedExponent: 1.35
    }
  },
  {
    id: 'DP-LINEAR-001',
    slug: 'merit-ladder',
    title: 'Merit Ladder',
    sourceInspiration: 'House Robber',
    summary: 'Choose non-adjacent merit tasks on Ethereum for the highest total score.',
    difficulty: 6,
    topics: ['Solidity', 'smart contracts', 'dynamic programming', 'gas efficiency'],
    prerequisites: ['solidity', 'uint256 arrays', 'loops', 'functions'],
    specification: {
      language: 'solidity',
      description:
        'A student can claim merit rewards from a sequence of tasks on Ethereum, but claiming one task locks neighbouring tasks. Write a function in a Solidity contract that calculates the maximum merit points obtainable without picking adjacent tasks. The function must only read its input data and cannot write to or amend contract storage.',
      functionName: 'maxMeritPoints',
      parameters: [{ name: 'points', type: 'uint256[]' }],
      returns: 'uint256',
      constraints: ['0 <= points.length <= 1000', '0 <= points[i] <= 1000000'],
      starterCode:
        '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Solution {\n    function maxMeritPoints(uint256[] memory points) public returns (uint256) {\n        // Return the best non-adjacent total without modifying storage.\n    }\n}'
    },
    examples: [
      {
        input: 'points = [3, 8, 4, 9, 2]',
        output: '17',
        explanation: 'Choose 8 and 9 for a total of 17.'
      }
    ],
    testGroups: {
      visible: [
        makeTest('merit-v1', 'Middle choices win', [[3, 8, 4, 9, 2]], 17, { size: 5 }),
        makeTest('merit-v2', 'Skip tempting neighbour', [[10, 1, 1, 10]], 20, { size: 4 })
      ],
      hidden: [
        makeTest('merit-h1', 'Classic alternating', [[2, 7, 9, 3, 1]], 12, { size: 5 }),
        makeTest('merit-h2', 'All equal', [[5, 5, 5, 5, 5]], 15, { size: 5 }),
        makeTest('merit-h3', 'Zeros included', [[0, 9, 0, 10, 0]], 19, { size: 5 })
      ],
      edge: [
        makeTest('merit-e1', 'No tasks', [[]], 0, { size: 0 }),
        makeTest('merit-e2', 'One task', [[13]], 13, { size: 1 }),
        makeTest('merit-e3', 'Two tasks', [[4, 9]], 9, { size: 2 })
      ],
      stress: [
        makeTest('merit-s1', 'Medium ladder', [meritStressSmall.slice(0, 300)], maxMeritPointsReference(meritStressSmall.slice(0, 300)), { size: 300 }),
        makeTest('merit-s2', 'Long ladder', [meritStressSmall.slice(0, 800)], maxMeritPointsReference(meritStressSmall.slice(0, 800)), { size: 800 })
      ]
    },
    workedSolutions: {
      solidity: {
        code:
          '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Solution {\n    function maxMeritPoints(uint256[] memory points) public pure returns (uint256) {\n        uint256 skip = 0;\n        uint256 take = 0;\n\n        for (uint256 i = 0; i < points.length; i++) {\n            uint256 nextTake = skip + points[i];\n            skip = skip > take ? skip : take;\n            take = nextTake;\n        }\n\n        return skip > take ? skip : take;\n    }\n}',
        explanation: 'Track the best total if the previous task was skipped and if it was taken. Because the calculation only reads its input arguments and neither reads nor writes contract storage, declaring the function "pure" enforces the read-only requirement at compile time and minimizes EVM gas.'
      }
    },
    expectedComplexity: {
      time: 'O(n)',
      space: 'O(1)',
      maxObservedExponent: 1.35
    }
  }
];

const validationErrors = tasks.flatMap((task) => {
  const result = validateProgrammingTask(task);
  return result.ok ? [] : result.errors.map((error) => `${task.slug}: ${error}`);
});

if (validationErrors.length > 0) {
  throw new Error(`ProgrammingTask validation failed:\n${validationErrors.join('\n')}`);
}

export function findTask(slug) {
  return [...tasks, ...generatedTasks].find((task) => task.slug === slug);
}

export function getDefaultTask() {
  return tasks[0];
}

const generatedTasks = [];

export function getGeneratedTasks() {
  return [...generatedTasks];
}

export function addGeneratedTask(task) {
  const result = validateProgrammingTask(task);
  if (!result.ok) {
    throw new Error(`Generated task failed validation:\n${result.errors.join('\n')}`);
  }

  const existingIndex = generatedTasks.findIndex((generatedTask) => generatedTask.slug === task.slug);
  if (existingIndex >= 0) {
    generatedTasks[existingIndex] = task;
    return task;
  }

  generatedTasks.push(task);
  return task;
}

export function removeGeneratedTask(slug) {
  const existingIndex = generatedTasks.findIndex((task) => task.slug === slug);
  if (existingIndex === -1) {
    return false;
  }

  generatedTasks.splice(existingIndex, 1);
  return true;
}
