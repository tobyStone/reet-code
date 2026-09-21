const task = window.REET_CODE_TASK;
const editor = document.querySelector('#code-editor');
const runButton = document.querySelector('#run-button');
const submitButton = document.querySelector('#submit-button');
const resetButton = document.querySelector('#reset-code');
const results = document.querySelector('#results');
const indent = '    ';
const storageKey = `reet-code:${task.slug}:python-solution`;

const savedCode = localStorage.getItem(storageKey);
if (savedCode) {
  editor.value = savedCode;
}

editor.addEventListener('input', saveCode);

editor.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') {
    return;
  }

  event.preventDefault();
  if (event.shiftKey) {
    unindentSelection();
  } else {
    indentSelection();
  }
  saveCode();
});

function saveCode() {
  localStorage.setItem(storageKey, editor.value);
}

resetButton.addEventListener('click', () => {
  editor.value = task.specification.starterCode;
  saveCode();
  editor.focus();
});

runButton.addEventListener('click', () => judge('run'));
submitButton.addEventListener('click', () => judge('submit'));

document.querySelectorAll('.tab-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach((tab) => {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-selected', tab === button ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === button.dataset.tab);
    });
  });
});

async function judge(mode) {
  const button = mode === 'run' ? runButton : submitButton;
  const otherButton = mode === 'run' ? submitButton : runButton;
  setBusy(button, otherButton, true);
  renderLoading(mode);

  try {
    const response = await fetch(`/api/tasks/${task.slug}/${mode}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: editor.value })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'The judge did not accept that request.');
    }

    renderReport(payload);
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(button, otherButton, false);
  }
}

function setBusy(primary, secondary, busy) {
  primary.disabled = busy;
  secondary.disabled = busy;
  primary.textContent = busy ? 'Checking...' : primary.id === 'run-button' ? 'Run visible checks' : 'Submit to judge';
}

function renderLoading(mode) {
  results.className = 'result-card loading';
  results.innerHTML = `
    <div class="pulse-dot" aria-hidden="true"></div>
    <h2>${mode === 'run' ? 'Running visible checks' : 'Running the judge'}</h2>
    <p>Hold tight. The runner is separate from the web server, so the site stays steady while your code is checked.</p>
  `;
}

function renderError(error) {
  results.className = 'result-card error';
  results.innerHTML = `
    <h2>That did not run.</h2>
    <p>${escapeHtml(error.message)}</p>
  `;
}

function renderReport({ report, feedback }) {
  const groupRows = Object.entries(report.groups)
    .map(([group, summary]) => {
      const label = groupLabel(group);
      const passed = summary.passed === summary.total;
      return `<tr>
        <th scope="row">${label}</th>
        <td>${summary.passed}/${summary.total}</td>
        <td><span class="status-pill ${passed ? 'pass' : 'fail'}">${passed ? 'Pass' : 'Check'}</span></td>
      </tr>`;
    })
    .join('');

  const failedMarkup = report.failures.length > 0 ? renderFailures(report.failures) : '<p class="quiet">No failing cases in this run.</p>';
  const scalingMarkup = report.scaling.available
    ? `<p>${escapeHtml(report.scaling.label)}. Input size changed by ${report.scaling.sizeRatio}x; runtime changed by ${report.scaling.timeRatio}x.</p>`
    : `<p>${escapeHtml(report.scaling.label)}</p>`;

  results.className = `result-card ${report.ok ? 'success' : 'needs-work'}`;
  results.innerHTML = `
    <div class="feedback-head">
      <img src="${feedback.image}" alt="">
      <div>
        <p class="feedback-word">${escapeHtml(feedback.word)}</p>
        <h2>${escapeHtml(feedback.title)}</h2>
        <p>${escapeHtml(feedback.message)}</p>
      </div>
    </div>

    <div class="metric-grid">
      <div>
        <span>${report.totals.passed}/${report.totals.total}</span>
        <small>Tests passed</small>
      </div>
      <div>
        <span>${report.totals.durationMs}ms</span>
        <small>Total measured time</small>
      </div>
      <div>
        <span>${report.totals.peakMemoryMb}MB</span>
        <small>Peak runner memory</small>
      </div>
    </div>

    <table class="group-table">
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Result</th>
          <th scope="col">State</th>
        </tr>
      </thead>
      <tbody>${groupRows}</tbody>
    </table>

    <section class="mini-section">
      <h3>Efficiency</h3>
      ${scalingMarkup}
      <p class="quiet">Expected: ${escapeHtml(report.task.expectedComplexity.time)} time and ${escapeHtml(report.task.expectedComplexity.space)} space.</p>
    </section>

    <section class="mini-section">
      <h3>Cases to inspect</h3>
      ${failedMarkup}
    </section>
  `;
}

function renderFailures(failures) {
  return failures
    .slice(0, 4)
    .map((failure) => {
      const visibleDetails = failure.visible
        ? `<pre><code>Input: ${escapeHtml(JSON.stringify(failure.input))}
Expected: ${escapeHtml(JSON.stringify(failure.expected))}
Received: ${escapeHtml(JSON.stringify(failure.actual))}</code></pre>`
        : '<p class="quiet">Hidden input. Use the group and label to reason about the case.</p>';

      return `<article class="failure-block">
        <strong>${escapeHtml(groupLabel(failure.group))}: ${escapeHtml(failure.label)}</strong>
        ${failure.error ? `<p>${escapeHtml(failure.error)}</p>` : ''}
        ${visibleDetails}
      </article>`;
    })
    .join('');
}

function groupLabel(group) {
  return {
    visible: 'Visible',
    hidden: 'Hidden',
    edge: 'Edge',
    stress: 'Stress'
  }[group] || group;
}

function indentSelection() {
  const { selectionStart, selectionEnd, value } = editor;
  if (selectionStart === selectionEnd || !value.slice(selectionStart, selectionEnd).includes('\n')) {
    editor.setRangeText(indent, selectionStart, selectionEnd, 'end');
    return;
  }

  const { start, end } = selectedLineRange();
  const block = value.slice(start, end);
  const lineCount = block.split('\n').length;
  const replacement = block
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');

  editor.setRangeText(replacement, start, end, 'preserve');
  editor.selectionStart = selectionStart + indent.length;
  editor.selectionEnd = selectionEnd + indent.length * lineCount;
}

function unindentSelection() {
  const { selectionStart, selectionEnd, value } = editor;
  const { start, end } = selectedLineRange();
  const lines = value.slice(start, end).split('\n');
  let removedBeforeStart = 0;
  let removedInSelection = 0;
  let cursor = start;

  const replacement = lines
    .map((line) => {
      const removeCount = indentationToRemove(line);
      if (removeCount === 0) {
        cursor += line.length + 1;
        return line;
      }

      if (cursor < selectionStart) {
        removedBeforeStart += Math.min(removeCount, selectionStart - cursor);
      }
      if (cursor < selectionEnd) {
        removedInSelection += removeCount;
      }

      cursor += line.length + 1;
      return line.slice(removeCount);
    })
    .join('\n');

  editor.setRangeText(replacement, start, end, 'preserve');
  editor.selectionStart = Math.max(start, selectionStart - removedBeforeStart);
  editor.selectionEnd = Math.max(editor.selectionStart, selectionEnd - removedInSelection);
}

function selectedLineRange() {
  const { selectionStart, selectionEnd, value } = editor;
  const start = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const nextLineBreak = value.indexOf('\n', selectionEnd);
  const end = nextLineBreak === -1 ? value.length : nextLineBreak;
  return { start, end };
}

function indentationToRemove(line) {
  if (line.startsWith(indent)) {
    return indent.length;
  }
  if (line.startsWith('\t')) {
    return 1;
  }
  return line.match(/^ {1,3}/)?.[0].length || 0;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
