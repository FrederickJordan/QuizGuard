import { auth } from './firebase-config.js';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const db = getFirestore();
let cachedAttempts = [];
let selectedAttemptId = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function scoreColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function quizTypeLabel(code) {
  return code && code !== 'manual' ? `Code: ${code}` : 'Practice quiz';
}

function renderSummary(attempts) {
  const el = document.getElementById('dataLogSummary');
  if (!el) return;

  if (!attempts.length) {
    el.innerHTML = '';
    return;
  }

  const total = attempts.length;
  const avg = Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / total);
  const best = Math.max(...attempts.map((a) => a.score || 0));
  const totalWrong = attempts.reduce((s, a) => s + (a.wrongAnswers?.length || 0), 0);

  el.innerHTML = `
    <div class="data-log-summary-grid">
      <div class="data-log-stat"><span class="data-log-stat-value">${total}</span><span class="data-log-stat-label">Attempts</span></div>
      <div class="data-log-stat"><span class="data-log-stat-value">${avg}</span><span class="data-log-stat-label">Avg score</span></div>
      <div class="data-log-stat"><span class="data-log-stat-value">${best}</span><span class="data-log-stat-label">Best score</span></div>
      <div class="data-log-stat"><span class="data-log-stat-value">${totalWrong}</span><span class="data-log-stat-label">Total wrong</span></div>
    </div>
  `;
}

function renderAttemptList() {
  const listEl = document.getElementById('dataLogList');
  if (!listEl) return;

  if (!cachedAttempts.length) {
    listEl.innerHTML = `<p class="data-log-empty">No quiz attempts yet. Finish a quiz to see your data log here.</p>`;
    return;
  }

  listEl.innerHTML = cachedAttempts
    .map((attempt) => {
      const wrongCount = attempt.wrongAnswers?.length || 0;
      const isActive = attempt.id === selectedAttemptId;
      const subject = escapeHtml(attempt.subject || 'Quiz');
      const difficulty = escapeHtml(attempt.difficulty || '—');
      const color = scoreColor(attempt.score);

      return `
        <button type="button" class="data-log-item${isActive ? ' active' : ''}" data-id="${attempt.id}">
          <div class="data-log-item-top">
            <span class="data-log-item-title">${subject}</span>
            <span class="data-log-item-score" style="color:${color}">${attempt.score}/100</span>
          </div>
          <div class="data-log-item-meta">${formatShortDate(attempt.timestamp)} · ${difficulty} · ${quizTypeLabel(attempt.code)}</div>
          <div class="data-log-item-chips">
            <span class="data-log-chip">⚠ ${attempt.penalties || 0} penalties</span>
            <span class="data-log-chip">⇥ ${attempt.tabSwitches || 0} tabs</span>
            <span class="data-log-chip">✗ ${wrongCount} wrong</span>
          </div>
        </button>
      `;
    })
    .join('');

  listEl.querySelectorAll('.data-log-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedAttemptId = btn.dataset.id;
      renderAttemptList();
      renderAttemptDetail(selectedAttemptId);
    });
  });
}

function renderAttemptDetail(attemptId) {
  const detailEl = document.getElementById('dataLogDetail');
  if (!detailEl) return;

  const attempt = cachedAttempts.find((a) => a.id === attemptId);
  if (!attempt) {
    detailEl.innerHTML = `<p class="data-log-placeholder">Select an attempt from the list to view full details.</p>`;
    return;
  }

  const wrong = attempt.wrongAnswers || [];
  const wrongHtml = wrong.length
    ? `<ul class="data-log-wrong-list">${wrong
        .map(
          (w, i) => `
        <li>
          <strong>Q${i + 1}:</strong> ${escapeHtml(w.question)}<br>
          <span class="wrong-you">Your answer: ${escapeHtml(w.selectedAnswer)}</span><br>
          <span class="wrong-correct">Correct: ${escapeHtml(w.correctAnswer)}</span>
        </li>`
        )
        .join('')}</ul>`
    : '<p class="data-log-muted">Perfect score — no wrong answers recorded.</p>';

  const aiText = attempt.aiFeedback?.trim();
  const aiHtml = aiText
    ? `<div class="data-log-ai-box">${escapeHtml(aiText)}</div>`
    : '<p class="data-log-muted">No AI review saved for this attempt.</p>';

  detailEl.innerHTML = `
    <div class="data-log-detail-header">
      <h2>${escapeHtml(attempt.subject || 'Quiz')}</h2>
      <p class="data-log-detail-sub">${formatDate(attempt.timestamp)}</p>
    </div>

    <div class="data-log-metrics">
      <div class="data-log-metric" style="border-color:${scoreColor(attempt.score)}">
        <span class="data-log-metric-value" style="color:${scoreColor(attempt.score)}">${attempt.score}</span>
        <span class="data-log-metric-label">Score</span>
      </div>
      <div class="data-log-metric">
        <span class="data-log-metric-value">${attempt.penalties || 0}</span>
        <span class="data-log-metric-label">Penalties</span>
      </div>
      <div class="data-log-metric">
        <span class="data-log-metric-value">${attempt.tabSwitches || 0}</span>
        <span class="data-log-metric-label">Tab switches</span>
      </div>
      <div class="data-log-metric">
        <span class="data-log-metric-value">${attempt.failures || 0}</span>
        <span class="data-log-metric-label">Minigame fails</span>
      </div>
      <div class="data-log-metric">
        <span class="data-log-metric-value">${wrong.length}</span>
        <span class="data-log-metric-label">Wrong answers</span>
      </div>
    </div>

    <div class="data-log-info-row">
      <span><strong>Difficulty:</strong> ${escapeHtml(attempt.difficulty || '—')}</span>
      <span><strong>Type:</strong> ${escapeHtml(quizTypeLabel(attempt.code))}</span>
    </div>

    <section class="data-log-section">
      <h3>Wrong answers</h3>
      ${wrongHtml}
    </section>

    <section class="data-log-section">
      <h3>🤖 AI review</h3>
      ${aiHtml}
    </section>
  `;
}

export async function loadQuizDataLog() {
  const listEl = document.getElementById('dataLogList');
  const detailEl = document.getElementById('dataLogDetail');
  if (listEl) listEl.innerHTML = '<p class="data-log-loading">Loading your quiz history…</p>';
  if (detailEl) detailEl.innerHTML = '';

  const user = auth.currentUser;
  if (!user) {
    if (listEl) listEl.innerHTML = '<p class="data-log-empty">Please log in to view your data log.</p>';
    return;
  }

  try {
    const q = query(collection(db, 'quizResults'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    cachedAttempts = [];
    snapshot.forEach((docSnap) => cachedAttempts.push({ id: docSnap.id, ...docSnap.data() }));
    cachedAttempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderSummary(cachedAttempts);
    selectedAttemptId = cachedAttempts[0]?.id || null;
    renderAttemptList();
    if (selectedAttemptId) renderAttemptDetail(selectedAttemptId);
    else if (detailEl) {
      detailEl.innerHTML = '<p class="data-log-placeholder">Select an attempt from the list to view full details.</p>';
    }
  } catch (err) {
    console.error('Data log load error:', err);
    if (listEl) listEl.innerHTML = '<p class="data-log-empty">Could not load history. Try again later.</p>';
  }
}

export function openDataLogScreen() {
  const home = document.getElementById('homeScreen');
  const editor = document.getElementById('editorScreen');
  const quiz = document.getElementById('quizApp');
  const dataLog = document.getElementById('dataLogScreen');

  if (home) home.style.display = 'none';
  if (editor) editor.style.display = 'none';
  if (quiz) quiz.style.display = 'none';
  if (dataLog) dataLog.style.display = 'block';

  loadQuizDataLog();
}

export function closeDataLogScreen() {
  const dataLog = document.getElementById('dataLogScreen');
  const home = document.getElementById('homeScreen');
  if (dataLog) dataLog.style.display = 'none';
  if (home) home.style.display = 'flex';
}
