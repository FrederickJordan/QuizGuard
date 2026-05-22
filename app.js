console.log("=== app.js started ===");

import { getEl, addLog } from './utils.js';
import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

let currentUserRole = null;
let cachedAttempts = [];
let selectedAttemptId = null;

window.questionBank = questionBank;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== MODAL FOR VIEWING DETAILS ==========
function showDetailsModal(title, wrongAnswers, aiFeedback) {
  // Remove existing modal if any
  const existing = document.getElementById('detailsModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'detailsModal';
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:20000; display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px;';
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  let wrongHtml = '';
  if (wrongAnswers && wrongAnswers.length) {
    wrongHtml = '<div style="max-height: 300px; overflow-y: auto;"><ul style="margin:0; padding-left:20px;">';
    wrongAnswers.forEach(w => {
      wrongHtml += `<li style="margin-bottom:15px;"><strong>${escapeHtml(w.question)}</strong><br>❌ Your answer: ${escapeHtml(w.selectedAnswer)}<br>✅ Correct: ${escapeHtml(w.correctAnswer)}</li>`;
    });
    wrongHtml += '</ul></div>';
  } else {
    wrongHtml = '<p>None</p>';
  }

  modal.innerHTML = `
    <div style="background:white; max-width:700px; width:100%; border-radius:20px; padding:30px; position:relative;">
      <button id="closeDetailsModal" style="position:absolute; top:15px; right:20px; background:#ef4444; color:white; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:20px;">&times;</button>
      <h2 style="margin-top:0;">${escapeHtml(title)}</h2>
      <div style="margin-bottom:20px;">
        <strong>Wrong Answers:</strong>
        ${wrongHtml}
      </div>
      <div>
        <strong>AI Feedback:</strong>
        <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-top:8px;">${escapeHtml(aiFeedback || 'No AI feedback available.')}</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeDetailsModal')?.addEventListener('click', () => modal.remove());
}

async function getUserRole(userId, email) {
  const docRef = doc(db, "users", userId);
  for (let i = 0; i < 20; i++) {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const role = snap.data().role;
      console.log(`✅ Role found after ${i+1} attempts: ${role}`);
      return role;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  await setDoc(docRef, { email, role: "student", createdAt: new Date().toISOString() });
  return "student";
}

// ========== QUIZ DATA LOG ==========
function dataLogScoreColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function formatDataLogDate(iso) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDataLogShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function quizTypeLabel(code) {
  return code && code !== 'manual' ? `Code: ${code}` : 'Practice quiz';
}

function renderDataLogSummary(attempts) {
  const el = document.getElementById('dataLogSummary');
  if (!el) return;
  if (!attempts.length) { el.innerHTML = ''; return; }

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

function renderDataLogList() {
  const listEl = document.getElementById('dataLogList');
  if (!listEl) return;

  if (!cachedAttempts.length) {
    listEl.innerHTML = '<p class="data-log-empty">No quiz attempts yet. Finish a quiz to see your data log here.</p>';
    return;
  }

  listEl.innerHTML = cachedAttempts.map((attempt) => {
    const wrongCount = attempt.wrongAnswers?.length || 0;
    const isActive = attempt.id === selectedAttemptId;
    const subject = escapeHtml(attempt.subject || 'Quiz');
    const difficulty = escapeHtml(attempt.difficulty || '—');
    const color = dataLogScoreColor(attempt.score);
    return `
      <button type="button" class="data-log-item${isActive ? ' active' : ''}" data-id="${attempt.id}">
        <div class="data-log-item-top">
          <span class="data-log-item-title">${subject}</span>
          <span class="data-log-item-score" style="color:${color}">${attempt.score}/100</span>
        </div>
        <div class="data-log-item-meta">${formatDataLogShortDate(attempt.timestamp)} · ${difficulty} · ${quizTypeLabel(attempt.code)}</div>
        <div class="data-log-item-chips">
          <span class="data-log-chip">⚠ ${attempt.penalties || 0} penalties</span>
          <span class="data-log-chip">⇥ ${attempt.tabSwitches || 0} tabs</span>
          <span class="data-log-chip">✗ ${wrongCount} wrong</span>
        </div>
      </button>
    `;
  }).join('');

  listEl.querySelectorAll('.data-log-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedAttemptId = btn.dataset.id;
      renderDataLogList();
      renderDataLogDetail(selectedAttemptId);
    });
  });
}

function renderDataLogDetail(attemptId) {
  const detailEl = document.getElementById('dataLogDetail');
  if (!detailEl) return;

  const attempt = cachedAttempts.find((a) => a.id === attemptId);
  if (!attempt) {
    detailEl.innerHTML = '<p class="data-log-placeholder">Select an attempt from the list to view full details.</p>';
    return;
  }

  const wrong = attempt.wrongAnswers || [];
  const wrongHtml = wrong.length
    ? `<ul class="data-log-wrong-list">${wrong.map((w, i) => `
        <li>
          <strong>Q${i + 1}:</strong> ${escapeHtml(w.question)}<br>
          <span class="wrong-you">Your answer: ${escapeHtml(w.selectedAnswer)}</span><br>
          <span class="wrong-correct">Correct: ${escapeHtml(w.correctAnswer)}</span>
        </li>`).join('')}</ul>`
    : '<p class="data-log-muted">Perfect score — no wrong answers recorded.</p>';

  const aiText = attempt.aiFeedback?.trim();
  const aiHtml = aiText
    ? `<div class="data-log-ai-box">${escapeHtml(aiText)}</div>`
    : '<p class="data-log-muted">No AI review saved for this attempt.</p>';

  detailEl.innerHTML = `
    <div class="data-log-detail-header">
      <h2>${escapeHtml(attempt.subject || 'Quiz')}</h2>
      <p class="data-log-detail-sub">${formatDataLogDate(attempt.timestamp)}</p>
    </div>
    <div class="data-log-metrics">
      <div class="data-log-metric" style="border-color:${dataLogScoreColor(attempt.score)}">
        <span class="data-log-metric-value" style="color:${dataLogScoreColor(attempt.score)}">${attempt.score}</span>
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
    <section class="data-log-section"><h3>Wrong answers</h3>${wrongHtml}</section>
    <section class="data-log-section"><h3>🤖 AI review</h3>${aiHtml}</section>
  `;
}

async function loadQuizDataLog() {
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

    renderDataLogSummary(cachedAttempts);
    selectedAttemptId = cachedAttempts[0]?.id || null;
    renderDataLogList();
    if (selectedAttemptId) renderDataLogDetail(selectedAttemptId);
    else if (detailEl) {
      detailEl.innerHTML = '<p class="data-log-placeholder">Select an attempt from the list to view full details.</p>';
    }
  } catch (err) {
    console.error('Data log load error:', err);
    if (listEl) listEl.innerHTML = '<p class="data-log-empty">Could not load history. Try again later.</p>';
  }
}

function openDataLogScreen() {
  const home = document.getElementById('homeScreen');
  const editor = document.getElementById('editorScreen');
  const quiz = document.getElementById('quizApp');
  const dataLog = document.getElementById('dataLogScreen');

  if (!dataLog) {
    console.error('dataLogScreen element not found — upload the latest index.html');
    alert('Data log page is missing. Please refresh after the site updates.');
    return;
  }

  if (home) home.style.display = 'none';
  if (editor) editor.style.display = 'none';
  if (quiz) quiz.style.display = 'none';
  dataLog.style.display = 'block';
  window.scrollTo(0, 0);
  loadQuizDataLog();
}

function closeDataLogScreen() {
  const dataLog = document.getElementById('dataLogScreen');
  const home = document.getElementById('homeScreen');
  if (dataLog) dataLog.style.display = 'none';
  if (home) home.style.display = 'flex';
}

window.openDataLogScreen = openDataLogScreen;
window.closeDataLogScreen = closeDataLogScreen;

// ========== TEACHER DASHBOARD (with modal) ==========
async function showTeacherDashboard() {
  const teacherUid = auth.currentUser?.uid;
  if (!teacherUid) { alert("Not logged in as teacher."); return; }
  const container = document.getElementById("teacherResultsContainer");
  const overlay = document.getElementById("teacherResultsOverlay");
  if (!container || !overlay) return;
  overlay.style.display = "block";
  container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading results...</p>';
  try {
    const codesQuery = query(collection(db, "quizCodes"), where("creatorUid", "==", teacherUid));
    const codesSnap = await getDocs(codesQuery);
    if (codesSnap.empty) { container.innerHTML = '<p style="text-align: center; padding: 40px;">No quizzes published yet.</p>'; return; }
    const codeList = codesSnap.docs.map(doc => doc.data().code);
    const resultsQuery = query(collection(db, "quizResults"), where("code", "in", codeList));
    const resultsSnap = await getDocs(resultsQuery);
    if (resultsSnap.empty) { container.innerHTML = '<p style="text-align: center; padding: 40px;">No student results yet.</p>'; return; }
    const results = [];
    resultsSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let html = '<table style="width:100%; border-collapse: collapse; text-align: left;"><thead><tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;"><th style="padding: 12px;">Student</th><th style="padding: 12px;">Code</th><th style="padding: 12px;">Subject</th><th style="padding: 12px;">Score</th><th style="padding: 12px;">Penalties</th><th style="padding: 12px;">Tab Switches</th><th style="padding: 12px;">Date</th><th style="padding: 12px;">Details</th></tr></thead><tbody>';
    results.forEach(data => {
      const date = new Date(data.timestamp).toLocaleString();
      const scoreColor = data.score >= 70 ? '#22c55e' : (data.score >= 40 ? '#f59e0b' : '#ef4444');
      html += `<tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px;">${escapeHtml(data.userEmail)}</td>
        <td style="padding: 12px;">${data.code}</td>
        <td style="padding: 12px;">${escapeHtml(data.subject || '-')}</td>
        <td style="padding: 12px; font-weight: bold; color: ${scoreColor};">${data.score}/100</td>
        <td style="padding: 12px;">${data.penalties || 0}</td>
        <td style="padding: 12px;">${data.tabSwitches || 0}</td>
        <td style="padding: 12px;">${date}</td>
        <td style="padding: 12px;"><button class="viewResultDetails" data-subject="${escapeHtml(data.subject || 'Quiz')}" data-wrong='${JSON.stringify(data.wrongAnswers || [])}' data-feedback="${escapeHtml(data.aiFeedback || '')}" style="background:#2563eb; color:white; border:none; padding:4px 12px; border-radius:8px; cursor:pointer;">View</button></td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    document.querySelectorAll('.viewResultDetails').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.subject;
        let wrong = [];
        try { wrong = JSON.parse(btn.dataset.wrong); } catch(e) { wrong = []; }
        const feedback = btn.dataset.feedback || 'No AI feedback available.';
        showDetailsModal(title, wrong, feedback);
      });
    });
  } catch (err) {
    console.error("Teacher dashboard error:", err);
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #ef4444;">Error loading results.</p>';
  }
}

// ========== DOM CONTENT LOADED ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded fired");
  const el = (id) => document.getElementById(id);

  // Password toggle
  el("togglePassword")?.addEventListener('click', () => {
    const pwd = el("loginPassword");
    if (pwd) {
      const type = pwd.type === 'password' ? 'text' : 'password';
      pwd.type = type;
      el("togglePassword").textContent = type === 'password' ? '👁️' : '🙈';
    }
  });

  // Auth buttons
  el("loginBtn")?.addEventListener('click', () => handleLogin(el("loginEmail")?.value, el("loginPassword")?.value));
  el("registerBtn")?.addEventListener('click', () => {
    const role = el("registerRole")?.value || "student";
    handleRegister(el("loginEmail")?.value, el("loginPassword")?.value, role);
  });
  el("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);
  el("logoutBtn")?.addEventListener('click', () => signOut(auth));

  // Quiz controls
  el("startQuizBtn")?.addEventListener('click', startQuiz);
  el("backToHomeBtn")?.addEventListener('click', returnToHome);
  el("joinQuizBtn")?.addEventListener('click', async () => {
    const code = el("joinCodeInput")?.value.trim();
    const errDiv = el("joinCodeError");
    if (!code || code.length !== 6) errDiv.innerText = "Enter 6-digit code";
    else { errDiv.innerText = ""; await joinQuizByCode(code); }
  });

  // Teacher dashboard and quiz data log
  el("teacherDashboardBtn")?.addEventListener('click', showTeacherDashboard);
  el("openDataLogBtn")?.addEventListener('click', openDataLogScreen);
  el("studentHistoryBtn")?.addEventListener('click', openDataLogScreen);
  el("closeDataLogBtn")?.addEventListener('click', closeDataLogScreen);

  document.getElementById('appContainer')?.addEventListener('click', (e) => {
    if (e.target.closest('#openDataLogBtn') || e.target.closest('#studentHistoryBtn')) {
      e.preventDefault();
      openDataLogScreen();
    }
    if (e.target.closest('#closeDataLogBtn')) {
      e.preventDefault();
      closeDataLogScreen();
    }
  });

  // Close overlays
  const closeTeacher = document.getElementById("closeTeacherResults");
  if (closeTeacher) closeTeacher.onclick = () => document.getElementById("teacherResultsOverlay").style.display = "none";
  const teacherOverlay = document.getElementById("teacherResultsOverlay");
  if (teacherOverlay) teacherOverlay.addEventListener('click', (e) => { if (e.target === teacherOverlay) teacherOverlay.style.display = "none"; });

  // Editor (teacher only)
  el("openEditorBtn")?.addEventListener('click', () => {
    if (currentUserRole !== "teacher") return alert("Only teachers can edit questions.");
    renderSubjectsList();
    renderQuestionEditor();
    el("homeScreen").style.display = "none";
    el("editorScreen").style.display = "block";
  });
  el("closeEditorBtn")?.addEventListener('click', () => {
    el("editorScreen").style.display = "none";
    el("homeScreen").style.display = "flex";
  });
  el("loadQuestionsBtn")?.addEventListener('click', renderQuestionEditor);
  el("addQuestionBtn")?.addEventListener('click', addNewQuestion);
  el("addSubjectBtn")?.addEventListener('click', async () => {
    if (currentUserRole !== "teacher") return alert("Only teachers add subjects");
    await addNewSubject();
  });

  // Fullscreen continue
  el("pauseOverlayContinue")?.addEventListener('click', () => document.documentElement.requestFullscreen());

  // ========== HOW TO PLAY POPUP (unchanged) ==========
  const howToPlayBtn = document.getElementById('howToPlayBtn');
  const popup = document.getElementById('howToPlayPopup');
  const closePopup = document.getElementById('closeHowToPlay');
  const popupImage = document.getElementById('popupImage');
  const popupCaption = document.getElementById('popupCaption');
  const popupPrev = document.getElementById('popupPrev');
  const popupNext = document.getElementById('popupNext');
  const popupTabFtb = document.getElementById('popupTabFtb');
  const popupTabQte = document.getElementById('popupTabQte');

  const ftbImages = ['ftb1.png', 'ftb2.png', 'ftb3.png', 'ftb4.png'];
  const ftbCaptions = [
    'Step 1: The cups appear with the ball hidden under one cup.',
    'Step 2: Hover over a cup – you can see the ball.',
    'Step 3: Click the correct cup before the gauge empties!',
    'Step 4: After a correct click, the ball moves to a new random cup and the gauge refills.'
  ];
  const qteImages = ['qte1.png', 'qte2.png', 'qte3.png'];
  const qteCaptions = [
    'Step 1: The QTE gauge appears with a random target key.',
    'Step 2: Press the correct key – the gauge increases by 35%.',
    'Step 3: Keep pressing correct keys to keep the gauge full and avoid penalties.'
  ];

  let currentGame = 'ftb';
  let currentIndex = 0;

  function updatePopupContent() {
    if (currentGame === 'ftb') {
      popupImage.src = ftbImages[currentIndex];
      popupCaption.textContent = ftbCaptions[currentIndex];
    } else {
      popupImage.src = qteImages[currentIndex];
      popupCaption.textContent = qteCaptions[currentIndex];
    }
  }

  function setActiveTab() {
    if (currentGame === 'ftb') {
      popupTabFtb.classList.add('active');
      popupTabQte.classList.remove('active');
    } else {
      popupTabQte.classList.add('active');
      popupTabFtb.classList.remove('active');
    }
  }

  if (howToPlayBtn && popup) {
    howToPlayBtn.addEventListener('click', () => {
      currentGame = 'ftb';
      currentIndex = 0;
      updatePopupContent();
      setActiveTab();
      popup.style.display = 'block';
    });
  }
  if (closePopup) closePopup.addEventListener('click', () => popup.style.display = 'none');
  if (popupPrev) popupPrev.addEventListener('click', () => {
    const maxIndex = (currentGame === 'ftb') ? ftbImages.length - 1 : qteImages.length - 1;
    currentIndex = (currentIndex - 1 + maxIndex + 1) % (maxIndex + 1);
    updatePopupContent();
  });
  if (popupNext) popupNext.addEventListener('click', () => {
    const maxIndex = (currentGame === 'ftb') ? ftbImages.length - 1 : qteImages.length - 1;
    currentIndex = (currentIndex + 1) % (maxIndex + 1);
    updatePopupContent();
  });
  if (popupTabFtb) popupTabFtb.addEventListener('click', () => {
    currentGame = 'ftb';
    currentIndex = 0;
    updatePopupContent();
    setActiveTab();
  });
  if (popupTabQte) popupTabQte.addEventListener('click', () => {
    currentGame = 'qte';
    currentIndex = 0;
    updatePopupContent();
    setActiveTab();
  });
  if (popup) popup.addEventListener('click', (e) => { if (e.target === popup) popup.style.display = 'none'; });

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        showAuthMessage("Please verify your email.", false);
        await signOut(auth);
        return;
      }
      const role = await getUserRole(user.uid, user.email);
      currentUserRole = role;
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      const editorBtn = el("openEditorBtn");
      const teacherDashboardBtn = el("teacherDashboardBtn");
      if (editorBtn) editorBtn.style.display = role === "teacher" ? "inline-block" : "none";
      if (teacherDashboardBtn) teacherDashboardBtn.style.display = role === "teacher" ? "inline-block" : "none";
      el("authScreen").style.display = "none";
      el("appContainer").style.display = "block";
    } else {
      window.questionBank = getDefaultQuestionBank();
      el("authScreen").style.display = "flex";
      el("appContainer").style.display = "none";
    }
  });
});
