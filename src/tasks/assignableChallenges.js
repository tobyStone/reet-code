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
    id: 'STRING-HASH-001',
    slug: 'anagram-check',
    title: 'Anagram Check',
    summary: 'Decide whether two words use the same letters in the same counts.',
    topics: ['strings', 'hash maps', 'counting'],
    difficulty: 3,
    classroomUse: 'A tidy introduction to frequency tables and edge cases.'
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
    id: 'GRAPH-BFS-001',
    slug: 'flood-fill-workshop',
    title: 'Flood Fill Workshop',
    summary: 'Change all connected matching cells in a picture grid.',
    topics: ['BFS', 'DFS', 'grids'],
    difficulty: 6,
    classroomUse: 'A practical bridge from 2D arrays into graph traversal.'
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
