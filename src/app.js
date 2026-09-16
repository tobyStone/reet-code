import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStudentTaskView, getTestsForMode } from './domain/ProgrammingTask.js';
import { addGeneratedTask, findTask, getDefaultTask, getGeneratedTasks, removeGeneratedTask, tasks } from './tasks/index.js';
import {
  assignableChallenges,
  findAssignableChallenge,
  getAssignedChallenges,
  isChallengeAssigned,
  setChallengeAssignment
} from './tasks/assignableChallenges.js';
import { judgeSubmission } from './runner/index.js';
import { feedbackVocabulary, selectFeedback } from './feedback/feedback.js';
import { generateProgrammingTaskFromSkill } from './services/challengeGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(projectRoot, 'views'));

app.use(express.static(path.join(projectRoot, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '220kb' }));
app.use(
  session({
    name: 'reet-code.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.tasks = tasks;
  res.locals.generatedTasks = getGeneratedTasks();
  res.locals.assignedChallenges = getAssignedChallenges();
  res.locals.feedbackVocabulary = feedbackVocabulary;
  next();
});

app.get('/', (req, res) => {
  res.render('home', {
    pageTitle: 'Reet Code',
    defaultTask: getDefaultTask()
  });
});

app.get('/tasks/assigned/:slug', (req, res, next) => {
  const challenge = findAssignableChallenge(req.params.slug);
  if (!challenge || !isChallengeAssigned(challenge.slug)) return next();

  res.render('assigned-task', {
    pageTitle: `${challenge.title} | Reet Code`,
    challenge
  });
});

app.get('/tasks/:slug', (req, res, next) => {
  const task = findTask(req.params.slug);
  if (!task) return next();

  res.render('task', {
    pageTitle: `${task.title} | Reet Code`,
    task: getStudentTaskView(task),
    fullTask: req.session.user ? task : null
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    pageTitle: 'Teacher Gateway | Reet Code',
    returnTo: safeReturnTo(req.query.returnTo)
  });
});

app.post('/login', (req, res) => {
  const returnTo = safeReturnTo(req.body.returnTo);
  req.session.user = { username: 'teacher', access: 'prototype-open-gateway' };
  return res.redirect(returnTo || '/teacher');
});

app.get('/teacher', requireTeacher, (req, res) => {
  const generationNotice = req.session.generationNotice || '';
  const generationError = req.session.generationError || '';
  delete req.session.generationNotice;
  delete req.session.generationError;

  res.render('teacher', {
    pageTitle: 'Teacher Area | Reet Code',
    challengeBank: assignableChallenges,
    assignedSlugs: getAssignedChallenges().map((challenge) => challenge.slug),
    generatedTasks: getGeneratedTasks(),
    generationNotice,
    generationError
  });
});

app.post('/teacher/assignments', requireTeacher, (req, res) => {
  const slug = String(req.body.slug || '');
  const action = String(req.body.action || '');
  setChallengeAssignment(slug, action === 'assign');
  res.redirect('/teacher');
});

app.post('/teacher/generated', requireTeacher, async (req, res) => {
  try {
    const skillDescription = String(req.body.skillDescription || '');
    const usedSlugs = [
      ...tasks.map((task) => task.slug),
      ...getGeneratedTasks().map((task) => task.slug),
      ...assignableChallenges.map((challenge) => challenge.slug)
    ];
    const { task, notice } = await generateProgrammingTaskFromSkill(skillDescription, { usedSlugs });
    addGeneratedTask(task);
    req.session.generationNotice = notice;
  } catch (error) {
    req.session.generationError =
      error.message || 'Could not build that challenge just now. Try a slightly clearer skill description.';
  }

  res.redirect('/teacher');
});

app.post('/teacher/generated/remove', requireTeacher, (req, res) => {
  removeGeneratedTask(String(req.body.slug || ''));
  res.redirect('/teacher');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.post('/api/tasks/:slug/:mode(run|submit)', async (req, res, next) => {
  try {
    const task = findTask(req.params.slug);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const code = String(req.body.code || '');
    if (code.trim().length === 0) {
      return res.status(400).json({ error: 'Add some code before running it.' });
    }
    if (code.length > 50000) {
      return res.status(413).json({ error: 'That solution is too large for this runner.' });
    }

    const mode = req.params.mode;
    const tests = getTestsForMode(task, mode).map((test) => ({
      ...test,
      group: testGroupFor(task, test.id)
    }));

    const report = await judgeSubmission({ task, code, mode, tests });
    const feedback = selectFeedback(report);

    return res.json({ report, feedback });
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).render('not-found', {
    pageTitle: 'Not found | Reet Code'
  });
});

app.use((error, req, res, _next) => {
  console.error(error);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: 'The judge hit a problem. Give it another go in a moment.'
    });
  }

  return res.status(500).render('error', {
    pageTitle: 'Something went sideways | Reet Code'
  });
});

function testGroupFor(task, testId) {
  for (const [group, testsInGroup] of Object.entries(task.testGroups)) {
    if (testsInGroup.some((test) => test.id === testId)) {
      return group;
    }
  }

  return 'visible';
}

function requireTeacher(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
}

function safeReturnTo(value) {
  const returnTo = String(value || '');
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return '';
}

export default app;
