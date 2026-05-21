import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore';
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;

window.questionBank = questionBank;

function applyRoleBasedUI(role) {
  const editorBtn = getEl("openEditorBtn");
  const teacherDashboardBtn = getEl("teacherDashboardBtn");
  const studentHistoryBtn = getEl("studentHistoryBtn");
  const isTeacher = (role === "teacher");
  if (editorBtn) editorBtn.style.display = isTeacher ? "inline-block" : "none";
  if (teacherDashboardBtn) teacherDashboardBtn.style.display = isTeacher ? "inline-block" : "none";
  if (studentHistoryBtn) studentHistoryBtn.style.display = "inline-block";
}

async function showTeacherDashboard() { alert("Teacher dashboard - coming soon"); }
async function showStudentHistory() { alert("Student history - coming soon"); }

document.addEventListener('DOMContentLoaded', () => {
  console.log("App initializing");

  // Buttons
  const loginBtn = getEl("loginBtn");
  const registerBtn = getEl("registerBtn");
  const googleBtn = getEl("googleSignInBtn");
  const logoutBtn = getEl("logoutBtn");
  const startQuizBtn = getEl("startQuizBtn");
  const backToHomeBtn = getEl("backToHomeBtn");
  const joinQuizBtn = getEl("joinQuizBtn");
  const teacherDashboardBtn = getEl("teacherDashboardBtn");
  const studentHistoryBtn = getEl("studentHistoryBtn");
  const openEditorBtn = getEl("openEditorBtn");
  const closeEditorBtn = getEl("closeEditorBtn");
  const loadQuestionsBtn = getEl("loadQuestionsBtn");
  const addQuestionBtn = getEl("addQuestionBtn");
  const addSubjectBtn = getEl("addSubjectBtn");
  const pauseOverlayContinue = getEl("pauseOverlayContinue");
  const togglePassword = getEl("togglePassword");

  console.log("Buttons found:", { loginBtn: !!loginBtn, registerBtn: !!registerBtn, googleBtn: !!googleBtn });

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const pwd = getEl("loginPassword");
      if (pwd) {
        const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
        pwd.setAttribute('type', type);
        togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
      }
    });
  }

  if (loginBtn) loginBtn.addEventListener('click', () => handleLogin(getEl("loginEmail")?.value || "", getEl("loginPassword")?.value || ""));
  if (registerBtn) registerBtn.addEventListener('click', () => {
    const role = getEl("registerRole")?.value || "student";
    handleRegister(getEl("loginEmail")?.value || "", getEl("loginPassword")?.value || "", role);
  });
  if (googleBtn) googleBtn.addEventListener('click', handleGoogleSignIn);
  if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));
  if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
  if (backToHomeBtn) backToHomeBtn.addEventListener('click', returnToHome);
  if (joinQuizBtn) joinQuizBtn.addEventListener('click', async () => {
    const code = getEl("joinCodeInput")?.value.trim();
    if (!code || code.length !== 6) return alert("Enter 6-digit code");
    await joinQuizByCode(code);
  });
  if (teacherDashboardBtn) teacherDashboardBtn.addEventListener('click', showTeacherDashboard);
  if (studentHistoryBtn) studentHistoryBtn.addEventListener('click', showStudentHistory);
  if (openEditorBtn) openEditorBtn.addEventListener('click', () => {
    if (currentUserRole !== "teacher") return alert("Only teachers");
    renderSubjectsList();
    renderQuestionEditor();
    getEl("homeScreen").style.display = "none";
    getEl("editorScreen").style.display = "block";
  });
  if (closeEditorBtn) closeEditorBtn.addEventListener('click', () => {
    getEl("editorScreen").style.display = "none";
    getEl("homeScreen").style.display = "flex";
  });
  if (loadQuestionsBtn) loadQuestionsBtn.addEventListener('click', renderQuestionEditor);
  if (addQuestionBtn) addQuestionBtn.addEventListener('click', addNewQuestion);
  if (addSubjectBtn) addSubjectBtn.addEventListener('click', async () => {
    if (currentUserRole !== "teacher") return alert("Only teachers");
    await addNewSubject();
  });
  if (pauseOverlayContinue) pauseOverlayContinue.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(e => console.error(e));
  });

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
        await setDoc(doc(db, "users", user.uid), { email: user.email, role: "student", createdAt: new Date().toISOString(), emailVerified: true });
      }
      currentUserRole = role;
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      applyRoleBasedUI(role);
      getEl("authScreen").style.display = "none";
      getEl("appContainer").style.display = "block";
    } else {
      window.questionBank = getDefaultQuestionBank();
      getEl("authScreen").style.display = "flex";
      getEl("appContainer").style.display = "none";
    }
  });
});
