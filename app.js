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

  // Helper to get element
  const el = (id) => document.getElementById(id);

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

  el("googleSignInBtn")?.addEventListener('click', () => handleGoogleSignIn());
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

  // Teacher dashboard (placeholder)
  el("teacherDashboardBtn")?.addEventListener('click', async () => {
    alert("Teacher dashboard coming soon");
  });

  // Student history button (opens overlay)
  el("studentHistoryBtn")?.addEventListener('click', () => {
    const overlay = el("historyLogOverlay");
    if (overlay) overlay.style.display = "block";
  });

  // Editor buttons (teacher only – visibility set after login)
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

  // Pause overlay continue (fullscreen)
  el("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(console.error);
  });

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        showAuthMessage("Please verify your email.", false);
        await signOut(auth);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) role = userDoc.data().role;
      else {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: true
        });
      }
      currentUserRole = role;
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();

      // Show/hide teacher buttons
      const editorBtn = el("openEditorBtn");
      const teacherDashboardBtn = el("teacherDashboardBtn");
      if (editorBtn) editorBtn.style.display = role === "teacher" ? "inline-block" : "none";
      if (teacherDashboardBtn) teacherDashboardBtn.style.display = role === "teacher" ? "inline-block" : "none";

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
