console.log("=== app.js started ===");

import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;

window.questionBank = questionBank;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
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
    console.log(`⏳ Attempt ${i+1}/20: Document not found, waiting 300ms...`);
    await new Promise(r => setTimeout(r, 300));
  }
  console.warn("❌ No document after retries. Creating default student role.");
  await setDoc(docRef, { email, role: "student", createdAt: new Date().toISOString() });
  return "student";
}

async function loadStudentHistory() {
  const container = document.getElementById('historyLogContainer');
  if (!container) return;
  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = `<div style="text-align:center; padding:40px;">Please log in to view history.</div>`;
    return;
  }
  try {
    const q = query(collection(db, "quizResults"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      container.innerHTML = `<div style="text-align:center; padding:40px;">No quiz history found.</div>`;
      return;
    }
    const results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let html = '';
    results.forEach(data => {
      const date = new Date(data.timestamp).toLocaleString();
      const scoreColor = data.score >= 70 ? '#22c55e' : (data.score >= 40 ? '#f59e0b' : '#ef4444');
      html += `<div style="background:white; border-radius:16px; padding:20px; margin-bottom:15px; border-left:4px solid ${scoreColor};">
        <div style="display:flex; justify-content:space-between;">
          <strong>${escapeHtml(data.subject || 'Quiz')}</strong>
          <span style="font-size:24px;">${data.score}/100</span>
        </div>
        <div style="color:#64748b; font-size:13px;">${date}</div>
        <div>Penalties: ${data.penalties || 0} | Tab switches: ${data.tabSwitches || 0}</div>
      </div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    console.error("Error loading student history:", err);
    container.innerHTML = `<div style="text-align:center; padding:40px;">Error loading history.</div>`;
  }
}

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
        <td style="padding: 12px;"><button class="viewResultDetails" data-id="${data.id}" style="background: #2563eb; color: white; border: none; padding: 4px 12px; border-radius: 8px; cursor: pointer;">View</button></td>
       </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    document.querySelectorAll('.viewResultDetails').forEach(btn => {
      btn.addEventListener('click', async () => {
        const resultDoc = await getDoc(doc(db, "quizResults", btn.dataset.id));
        if (resultDoc.exists()) {
          const data = resultDoc.data();
          let wrongList = data.wrongAnswers?.map(w => `Q: ${w.question}\n   Your: ${w.selectedAnswer}\n   Correct: ${w.correctAnswer}`).join('\n\n') || 'None';
          alert(`Student: ${data.userEmail}\nScore: ${data.score}/100\nPenalties: ${data.penalties}\nTab switches: ${data.tabSwitches}\n\nWrong Answers:\n${wrongList}\n\nAI Feedback:\n${data.aiFeedback || 'None'}`);
        }
      });
    });
  } catch (err) {
    console.error("Teacher dashboard error:", err);
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #ef4444;">Error loading results.</p>';
  }
}

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

  // Teacher dashboard and student history
  el("teacherDashboardBtn")?.addEventListener('click', showTeacherDashboard);
  el("studentHistoryBtn")?.addEventListener('click', () => {
    const overlay = el("historyLogOverlay");
    if (overlay) { loadStudentHistory(); overlay.style.display = "block"; }
  });

  // Close overlays
  const closeHistory = document.getElementById("closeHistoryLog");
  if (closeHistory) closeHistory.onclick = () => document.getElementById("historyLogOverlay").style.display = "none";
  const closeTeacher = document.getElementById("closeTeacherResults");
  if (closeTeacher) closeTeacher.onclick = () => document.getElementById("teacherResultsOverlay").style.display = "none";
  const historyOverlay = document.getElementById("historyLogOverlay");
  if (historyOverlay) historyOverlay.addEventListener('click', (e) => { if (e.target === historyOverlay) historyOverlay.style.display = "none"; });
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

  // ========== HOW TO PLAY POPUP ==========
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

  // ========== AUTH STATE LISTENER ==========
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
