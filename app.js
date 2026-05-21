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

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded fired");

  function el(id) { return document.getElementById(id); }

  // ========== PASSWORD EYE TOGGLE ==========
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
    console.log("Password toggle attached");
  } else {
    console.error("togglePassword not found");
  }

  // ========== AUTH BUTTONS ==========
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
  el("startQuizBtn")?.addEventListener('click', startQuiz);
  el("backToHomeBtn")?.addEventListener('click', returnToHome);

  // ========== JOIN QUIZ BY CODE ==========
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

  // ========== TEACHER DASHBOARD (placeholder) ==========
  el("teacherDashboardBtn")?.addEventListener('click', async () => {
    alert("Teacher dashboard coming soon");
  });

  // ========== STUDENT HISTORY OVERLAY ==========
  el("studentHistoryBtn")?.addEventListener('click', () => {
    const overlay = el("historyLogOverlay");
    if (overlay) overlay.style.display = "block";
  });

  // ========== EDITOR BUTTONS ==========
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

  // ========== PAUSE OVERLAY CONTINUE (fullscreen) ==========
  el("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(console.error);
  });

  // ========== AUTH STATE LISTENER (role-based UI) ==========
  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed, user:", user?.email || "null");
    if (user) {
      if (!user.emailVerified) {
        console.log("Email not verified");
        showAuthMessage("Please verify your email.", false);
        await signOut(auth);
        return;
      }
      // Get role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) {
        role = userDoc.data().role;
      } else {
        await setDoc(userDocRef, {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: true
        });
      }
      currentUserRole = role;
      console.log("User role:", role);

      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();

      // Apply role-based UI
      const editorBtn = el("openEditorBtn");
      const teacherDashboardBtn = el("teacherDashboardBtn");
      const joinSection = el("join-code-section"); // optional: hide join section from teachers?
      if (editorBtn) editorBtn.style.display = role === "teacher" ? "inline-block" : "none";
      if (teacherDashboardBtn) teacherDashboardBtn.style.display = role === "teacher" ? "inline-block" : "none";

      // Show main app, hide login
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
