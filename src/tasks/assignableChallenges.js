export const assignableChallenges = [
  {
    id: 'ARRAY-2D-001',
    slug: 'search-a-2d-matrix',
    title: 'Search a 2D Matrix',
    summary: 'Find whether a target value appears in a sorted grid.',
    topics: ['2D arrays', 'binary search', 'indexing'],
    difficulty: 4,
    classroomUse: 'A good next step after students can read matrix positions confidently.'
  },
  {
    id: 'ARRAY-2D-002',
    slug: 'set-matrix-zeroes',
    title: 'Set Matrix Zeroes',
    summary: 'Use original zero positions to update rows and columns.',
    topics: ['2D arrays', 'mutation', 'state tracking'],
    difficulty: 6,
    classroomUse: 'The original catalogue title behind Matrix Shutdown; useful for comparing the teaching version to the source idea.'
  },
  {
    id: 'ARRAY-2D-004',
    slug: 'spiral-matrix-walk',
    title: 'Spiral Matrix Walk',
    summary: 'Return every value in a grid while walking around the edges inward.',
    topics: ['2D arrays', 'boundaries', 'simulation'],
    difficulty: 7,
    classroomUse: 'Useful when students are ready to manage several loop boundaries at once.'
  },
  {
    id: 'ARRAY-2D-005',
    slug: 'rotate-the-grid',
    title: 'Rotate the Grid',
    summary: 'Rotate a square grid clockwise without losing values.',
    topics: ['matrix transforms', 'mutation', 'index mapping'],
    difficulty: 7,
    classroomUse: 'A strong stretch task for students who need careful position mapping.'
  },
  {
    id: 'ARRAY-001',
    slug: 'two-sum',
    title: 'Two Sum',
    summary: 'Find two numbers in a list that add to a target.',
    topics: ['arrays', 'hash maps', 'lookup'],
    difficulty: 3,
    classroomUse: 'A compact way to introduce trading nested loops for remembered information.'
  },
  {
    id: 'STRING-HASH-001',
    slug: 'anagram-check',
    title: 'Anagram Check',
    summary: 'Decide whether two words use the same letters in the same counts.',
    topics: ['strings', 'hash maps', 'counting'],
    difficulty: 3,
    classroomUse: 'A tidy introduction to frequency tables and edge cases.'
  },
  {
    id: 'STRING-001',
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    summary: 'Check whether brackets close in the correct order.',
    topics: ['strings', 'stacks', 'validation'],
    difficulty: 4,
    classroomUse: 'A clear stack exercise with quick feedback and lots of useful edge cases.'
  },
  {
    id: 'POINTERS-ARRAY-001',
    slug: 'tidy-two-pointer-sum',
    title: 'Tidy Two-Pointer Sum',
    summary: 'Use both ends of a sorted list to find a target pair.',
    topics: ['two pointers', 'arrays', 'search'],
    difficulty: 5,
    classroomUse: 'Pairs well with Pair the Pasties to compare hash maps and pointer thinking.'
  },
  {
    id: 'SORT-INTERVAL-001',
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    summary: 'Combine overlapping ranges into the fewest possible ranges.',
    topics: ['sorting', 'intervals', 'greedy'],
    difficulty: 5,
    classroomUse: 'The source title behind Tidy Bus Times; useful for lessons on sorting before scanning.'
  },
  {
    id: 'BINARY-SEARCH-001',
    slug: 'binary-search',
    title: 'Binary Search',
    summary: 'Find a target in a sorted list by repeatedly halving the search space.',
    topics: ['binary search', 'arrays', 'bounds'],
    difficulty: 4,
    classroomUse: 'Best after students can reason carefully about loop boundaries.'
  },
  {
    id: 'PREFIX-001',
    slug: 'range-sum-query',
    title: 'Range Sum Query',
    summary: 'Answer repeated slice-sum questions efficiently with prefix totals.',
    topics: ['prefix sums', 'arrays', 'precomputation'],
    difficulty: 5,
    classroomUse: 'Good for showing how a little preparation can make repeated queries much faster.'
  },
  {
    id: 'DP-001',
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    summary: 'Count how many ways there are to climb using one- and two-step moves.',
    topics: ['dynamic programming', 'recurrence', 'iteration'],
    difficulty: 4,
    classroomUse: 'A friendly first dynamic-programming recurrence.'
  },
  {
    id: 'DP-002',
    slug: 'house-robber',
    title: 'House Robber',
    summary: 'Choose non-adjacent values for the best total.',
    topics: ['dynamic programming', 'arrays', 'state'],
    difficulty: 6,
    classroomUse: 'The source title behind Merit Ladder; good for comparing story wording and abstract structure.'
  },
  {
    id: 'DP-003',
    slug: 'coin-change',
    title: 'Coin Change',
    summary: 'Find the fewest coins needed to make a target amount.',
    topics: ['dynamic programming', 'minimums', 'arrays'],
    difficulty: 7,
    classroomUse: 'A strong challenge once students have seen one-dimensional DP.'
  },
  {
    id: 'GRAPH-BFS-001',
    slug: 'flood-fill-workshop',
    title: 'Flood Fill Workshop',
    summary: 'Change all connected matching cells in a picture grid.',
    topics: ['BFS', 'DFS', 'grids'],
    difficulty: 6,
    classroomUse: 'A practical bridge from 2D arrays into graph traversal.'
  },
  {
    id: 'GRAPH-BFS-002',
    slug: 'number-of-islands',
    title: 'Number of Islands',
    summary: 'Count connected land groups in a grid.',
    topics: ['BFS', 'DFS', 'grids'],
    difficulty: 7,
    classroomUse: 'A natural follow-up after Flood Fill Workshop.'
  },
  {
    id: 'DFS-001',
    slug: 'word-search',
    title: 'Word Search',
    summary: 'Trace neighbouring cells in a grid to form a word.',
    topics: ['DFS', 'backtracking', 'grids'],
    difficulty: 7,
    classroomUse: 'Good for students ready to manage visited cells and backtracking.'
  },
  {
    id: 'HEAP-001',
    slug: 'kth-largest-element',
    title: 'Kth Largest Element',
    summary: 'Find the kth largest value without fully hand-sorting every time.',
    topics: ['heaps', 'sorting', 'selection'],
    difficulty: 6,
    classroomUse: 'A good conversation starter about partial ordering and priority queues.'
  },
  {
    id: 'TREE-001',
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    summary: 'Measure how far the deepest branch of a tree reaches.',
    topics: ['trees', 'recursion', 'DFS'],
    difficulty: 4,
    classroomUse: 'A gentle first tree traversal once recursion is comfortable.'
  },
  {
    id: 'GRAPH-TOPO-001',
    slug: 'course-schedule',
    title: 'Course Schedule',
    summary: 'Decide whether prerequisites can be completed without a cycle.',
    topics: ['graphs', 'cycles', 'topological order'],
    difficulty: 8,
    classroomUse: 'A later challenge for graph-ready students thinking about dependency chains.'
  }
];

const assignedChallengeSlugs = new Set();

export function getAssignedChallenges() {
  return assignableChallenges.filter((challenge) => assignedChallengeSlugs.has(challenge.slug));
}

export function findAssignableChallenge(slug) {
  return assignableChallenges.find((challenge) => challenge.slug === slug);
}

export function isChallengeAssigned(slug) {
  return assignedChallengeSlugs.has(slug);
}

export function setChallengeAssignment(slug, assigned) {
  const challenge = findAssignableChallenge(slug);
  if (!challenge) {
    return false;
  }

  if (assigned) {
    assignedChallengeSlugs.add(slug);
  } else {
    assignedChallengeSlugs.delete(slug);
  }

  return true;
}
