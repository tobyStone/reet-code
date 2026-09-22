import { runInLocalSubprocess } from './localSubprocessRunner.js';
import { runSolidityInVM } from './solidityRunner.js';
import { buildJudgeReport } from './report.js';

export async function judgeSubmission({ task, code, mode, tests }) {
  const runnerResult = await runWithConfiguredRunner({ task, code, mode, tests });
  return buildJudgeReport({ task, mode, runnerResult });
}

async function runWithConfiguredRunner(job) {
  if (job.task.specification?.language === 'solidity') {
    return runSolidityInVM(job);
  }

  if (process.env.RUNNER_SERVICE_URL) {
    return runWithRemoteRunner(job);
  }

  return runInLocalSubprocess(job);
}

async function runWithRemoteRunner({ task, code, mode, tests }) {
  const response = await fetch(process.env.RUNNER_SERVICE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      taskId: task.id,
      slug: task.slug,
      functionName: task.specification.functionName,
      mode,
      code,
      tests
    })
  });

  if (!response.ok) {
    throw new Error(`Remote runner failed with status ${response.status}`);
  }

  return response.json();
}
