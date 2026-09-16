# Reet Code

Reet Code is a first implementation of a LeetCode-style educational coding site for talented teenage programming students. It is built around a reusable `ProgrammingTask` schema first, then renders the website from that data.

The voice is warm, direct and encouraging: visible checks help students debug, submit checks run hidden, edge and stress cases, and the result panel explains correctness, runtime, memory and observed scaling.

## What is included

- Node, Express, EJS and browser JavaScript.
- Five starter `ProgrammingTask` challenges:
  - Matrix Shutdown: 2D array mutation.
  - Pair the Pasties: hash lookup.
  - Tidy Bus Times: sorting and interval merging.
  - Flatten the Kit Bag: recursion or explicit stack traversal.
  - Merit Ladder: linear dynamic programming.
- Visible, hidden, edge and stress tests for every task.
- Run vs Submit API endpoints.
- A feedback system using the mug vocabulary: Lad, Ey up, Sound, Buzzin and Boss.
- A prototype teacher gateway for worked solutions and assigning future challenge prompts.
- Reet Code branding assets and favicon.
- Vercel configuration.
- Local subprocess runner so student code never executes inside the main Express server process.

## Local setup

```bash
npm install
npm test
npm run dev
```

Open `http://localhost:3000`.

For now, the teacher gateway opens without credentials so the prototype can be reviewed quickly. This is not production security. Add real server-side authentication before sharing the site with students.

Set `SESSION_SECRET` before deploying.

## Runner architecture

The Express server never evaluates submitted code directly. It sends jobs to a runner adapter:

- Development default: a separate Node child process using a restricted VM context and per-test timeouts.
- Production path: set `RUNNER_SERVICE_URL` to send judge jobs to an external isolated runner service.

The development runner is useful for the first implementation, but a public classroom deployment should use a disposable sandbox with network, CPU, memory, filesystem and process limits. The adapter boundary is already in place for that.

## Vercel preparation

This repository includes `vercel.json` and an `api/index.js` entrypoint for Vercel's Node runtime. Import the GitHub repository into Vercel, then configure the environment variables from `.env.example`.

For public use, connect `RUNNER_SERVICE_URL` to a separate locked-down runner and replace the open teacher gateway with authenticated server-side access.

## GitHub

This folder is ready to be committed and pushed as a GitHub repository named `reet-code`. The available GitHub connector in this environment can update existing repositories, but it does not expose a create-new-repository action, so the remote repository still needs to be created in GitHub before pushing.
