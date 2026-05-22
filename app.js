console.log("=== app.js started ===");

import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';
import { openTutorial } from './tutorial.js';

const db = getFirestore();
let currentUserRole = null;

window.questionBank = questionBank;

// Function to get role with retries
async function getUserRole(userId, email) {
  const docRef = doc(db, "users", userId);
  for (let i = 0; i < 20; i++) {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const role = snap.data().role;
      console.log(`Role found after ${i+1} attempts: ${role}`);
      return role;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  await setDoc(docRef, { email, role: "student", createdAt: new Date().toISOString() });
  return "student";
}

// ========== TEACHER DASHBOARD ==========
async function showTeacherDashboard() {
  const teacherUid = auth.currentUser?.uid;
  if (!teacherUid) {
    alert("Not logged in as teacher.");
    return;
  }

  const container = document.getElementById("teacherResultsContainer");
  const overlay = document.getElementById("teacherResultsOverlay");
  if (!container || !overlay) return;

  overlay.style.display = "block";
  container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading results...</p>';

  try {
    // 1. Get all quiz codes created by this teacher
    const codesQuery = query(collection(db, "quizCodes"), where("creatorUid", "==", teacherUid));
    const codesSnap = await getDocs(codesQuery);
    if (codesSnap.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">No quizzes published yet.</p>';
      return;
    }

    const codeList = codesSnap.docs.map(doc => doc.data().code);
    // 2. Get all quiz results for those codes
    const resultsQuery = query(collection(db, "quizResults"), where("code", "in", codeList), orderBy("timestamp", "desc"));
    const resultsSnap = await getDocs(resultsQuery);

    if (resultsSnap.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px;">No student results yet.</p>';
      return;
    }

    // 3. Build HTML table
    let html = '<table style="width:100%; border-collapse: collapse; text-align: left;">';
    html += `<thead><tr style="background: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
      <th style="padding: 12px;">Student</th>
      <th style="padding: 12px;">Code</th>
      <th style="padding: 12px;">Subject</th>
      <th style="padding: 12px;">Score</th>
      <th style="padding: 12px;">Penalties</th>
      <th style="padding: 12px;">Tab Switches</th>
      <th style="padding: 12px;">Date</th>
      <th style="padding: 12px;">Details</th>
    </tr></thead><tbody>`;

    resultsSnap.forEach(doc => {
      const data = doc.data();
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
        <td style="padding: 12px;"><button class="viewResultDetails" data-id="${doc.id}" style="background: #2563eb; color: white; border: none; padding: 4px 12px; border-radius: 8px; cursor: pointer;">View</button></td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    // Attach event listeners to "View" buttons
    document.querySelectorAll('.viewResultDetails').forEach(btn => {
      btn.addEventListener('click', async () => {
        const resultId = btn.dataset.id;
        const resultDoc = await getDoc(doc(db, "quizResults", resultId));
        if (resultDoc.exists()) {
          const data = resultDoc.data();
          let wrongHtml = '';
          if (data.wrongAnswers && data.wrongAnswers.length) {
            wrongHtml = '<div style="margin-top: 15px;"><strong>Wrong Answers:</strong><ul>';
            data.wrongAnswers.forEach(w => {
              wrongHtml += `<li><strong>${escapeHtml(w.question)}</strong><br>Your answer: ${escapeHtml(w.selectedAnswer)}<br>Correct: ${escapeHtml(w.correctAnswer)}</li>`;
            });
            wrongHtml += '</ul></div>';
          }
          const feedbackHtml = data.aiFeedback ? `<div style="margin-top: 15px;"><strong>AI Feedback:</strong><br>${escapeHtml(data.aiFeedback)}</div>` : '';
          alert(`Student: ${data.userEmail}\nScore: ${data.score}/100\nPenalties: ${data.penalties}\nTab switches: ${data.tabSwitches}\n\nWrong Answers:\n${data.wrongAnswers?.map(w => `Q: ${w.question}\nSelected: ${w.selectedAnswer}\nCorrect: ${w.correctAnswer}`).join('\n\n') || 'None'}\n\nAI Feedback:\n${data.aiFeedback || 'None'}`);
        }
      });
    });
  } catch (err) {
    console.error("Teacher dashboard error:", err);
    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #ef4444;">Error loading results.</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
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

  // Teacher dashboard (real implementation)
  el("teacherDashboardBtn")?.addEventListener('click', showTeacherDashboard);

  // Student history
  el("studentHistoryBtn")?.addEventListener('click', () => {
    const overlay = el("historyLogOverlay");
    if (overlay) overlay.style.display = "block";
  });
  
  // TUTORIAL
  el("tutorialBtn")?.addEventListener('click', () => {
    import('./tutorial.js').then(module => {
      module.openTutorial(false);
    });
  });

  // Close buttons for overlays
  const closeHistory = document.getElementById("closeHistoryLog");
  if (closeHistory) closeHistory.onclick = () => document.getElementById("historyLogOverlay").style.display = "none";
  const closeTeacher = document.getElementById("closeTeacherResults");
  if (closeTeacher) closeTeacher.onclick = () => document.getElementById("teacherResultsOverlay").style.display = "none";

  // Click outside to close overlays
  const historyOverlay = document.getElementById("historyLogOverlay");
  if (historyOverlay) historyOverlay.addEventListener('click', (e) => { if (e.target === historyOverlay) historyOverlay.style.display = "none"; });
  const teacherOverlay = document.getElementById("teacherResultsOverlay");
  if (teacherOverlay) teacherOverlay.addEventListener('click', (e) => { if (e.target === teacherOverlay) teacherOverlay.style.display = "none"; });

// TUTORIAL close
  const closeTutorialBtn = document.getElementById("closeTutorial");
  if (closeTutorialBtn) {
    closeTutorialBtn.addEventListener('click', () => {
      document.getElementById('tutorialModal').style.display = 'none';
    });
  }

  const closeTutorialModalBtn = document.getElementById("closeTutorialBtn");
  if (closeTutorialModalBtn) {
    closeTutorialModalBtn.addEventListener('click', () => {
      document.getElementById('tutorialModal').style.display = 'none';
    });
  }

  const tutorialModal = document.getElementById("tutorialModal");
  if (tutorialModal) {
    tutorialModal.addEventListener('click', (e) => {
      if (e.target === tutorialModal) {
        tutorialModal.style.display = 'none';
      }
    });
  }
  
  // Editor buttons (teacher only)
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
