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
