import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('teacher area needs the configured password before allowing access', async () => {
  const previousPassword = process.env.TEACHER_PASSWORD;
  process.env.TEACHER_PASSWORD = 'correct horse battery staple';

  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const blocked = await fetch(`${baseUrl}/teacher`, { redirect: 'manual' });
    assert.equal(blocked.status, 302);
    assert.match(blocked.headers.get('location'), /^\/login/);

    const wrong = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ returnTo: '/teacher', password: 'not it' })
    });
    assert.equal(wrong.status, 401);

    const right = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ returnTo: '/teacher', password: 'correct horse battery staple' })
    });
    assert.equal(right.status, 302);
    assert.equal(right.headers.get('location'), '/teacher');
    assert.match(right.headers.get('set-cookie'), /reet-code\.sid=/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    restoreEnv('TEACHER_PASSWORD', previousPassword);
  }
});

function restoreEnv(key, value) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
