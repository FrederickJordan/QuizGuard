console.log("=== app.js started ===");

import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;

window.questionBank = questionBank;

// Manual role fix tool (run in console if needed)
window.setUserRole = async (role) => {
  const user = auth.currentUser;
  if (!user) { alert("Not logged in"); return; }
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(userDocRef, { role: role }, { merge: true });
  console.log(`Role set to ${role}`);
  alert(`Role updated to ${role}. Refresh page.`);
  location.reload();
};

// Function to get user role with retry
async function getUserRoleWithRetry(uid, retries = 3, delay = 500) {
  const userDocRef = doc(db, "users", uid);
  console.log(`Checking document: users/${uid}`);
  for (let i = 0; i < retries; i++) {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const role = docSnap.data().role;
      console.log(`Role found: ${role}`);
      return role;
    }
    console.log(`Attempt ${i+1}: Document not found, waiting ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.warn("Document not found after retries");
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded fired");

  function el(id) { return document.getElementById(id); }

  // Password toggle
  const togglePassword = el("togglePassword");
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const pwd = el("loginPassword");
      if (pwd) {
        const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
        pwd.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
      }
    });
  }

  // Auth buttons
  el("loginBtn")?.addEventListener('click', () => {
    const email = el("loginEmail")?.value || "";
    const password = el("loginPassword")?.value || "";
    handleLogin(email, password);
  });

  el("registerBtn")?.addEventListener('click', () => {
    const email = el("loginEmail")?.value || "";
    const password = el("loginPassword")?.value || "";
    const role = el("registerRole")?.value || "student";
    handleRegister(email, password, role);
  });

  el("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);
  el("logoutBtn")?.addEventListener('click', () => signOut(auth));

  // Quiz controls
  el("startQuizBtn")?.addEventListener('click', startQuiz);
  el("backToHomeBtn")?.addEventListener('click', returnToHome);

  // Join quiz by code
  el("joinQuizBtn")?.addEventListener('click', async () => {
    const code = el("joinCodeInput")?.value.trim();
    const errDiv = el("joinCodeError");
    if (!code || code.length !== 6) {
      if (errDiv) errDiv.innerText = "Enter 6-digit code";
      return;
    }
    if (errDiv) errDiv.innerText = "";
    await joinQuizByCode(code);
  });

  // Teacher dashboard placeholder
  el("teacherDashboardBtn")?.addEventListener('click', () => {
    alert("Teacher dashboard – coming soon");
  });

  // Student history button
  el("studentHistoryBtn")?.addEventListener('click', () => {
    const overlay = el("historyLogOverlay");
    if (overlay) overlay.style.display = "block";
  });

  // History close button (inline to ensure it works)
  const closeHistoryBtn = document.getElementById("closeHistoryLog");
  if (closeHistoryBtn) {
    closeHistoryBtn.onclick = () => {
      const overlay = document.getElementById("historyLogOverlay");
      if (overlay) overlay.style.display = "none";
    };
  }

  // Click outside to close
  const historyOverlay = document.getElementById("historyLogOverlay");
  if (historyOverlay) {
    historyOverlay.addEventListener('click', (e) => {
      if (e.target === historyOverlay) {
        historyOverlay.style.display = "none";
      }
    });
  }

  // Editor buttons (teacher only)
  el("openEditorBtn")?.addEventListener('click', () => {
    if (currentUserRole !== "teacher") {
      alert("Only teachers can edit questions.");
      return;
    }
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
    if (currentUserRole !== "teacher") {
      alert("Only teachers can add subjects.");
      return;
    }
    await addNewSubject();
  });

  // Pause overlay continue
  el("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(console.error);
  });

  // Auth state listener with retry
  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed, user:", user?.email || "null");
    if (user) {
      if (!user.emailVerified) {
        showAuthMessage("Please verify your email.", false);
        await signOut(auth);
        return;
      }
      // Wait a moment for Firestore to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      let role = await getUserRoleWithRetry(user.uid, 5, 500);
      if (!role) {
        console.warn("No role found, creating default student role");
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: true
        });
        role = "student";
      }
      currentUserRole = role;
      console.log("Final role set to:", role);

      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();

      // Apply role-based UI
      const editorBtn = el("openEditorBtn");
      const teacherDashboardBtn = el("teacherDashboardBtn");
      const joinSection = el("join-code-section");
      const studentHistoryBtn = el("studentHistoryBtn");

      if (editorBtn) editorBtn.style.display = role === "teacher" ? "inline-block" : "none";
      if (teacherDashboardBtn) teacherDashboardBtn.style.display = role === "teacher" ? "inline-block" : "none";
      if (joinSection) joinSection.style.display = "block";
      if (studentHistoryBtn) studentHistoryBtn.style.display = "inline-block";

      el("authScreen").style.display = "none";
      el("appContainer").style.display = "block";
    } else {
      currentUserRole = null;
      window.questionBank = getDefaultQuestionBank();
      el("authScreen").style.display = "flex";
      el("appContainer").style.display = "none";
    }
  });
});
