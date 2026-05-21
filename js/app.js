import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;
let currentUserId = null;

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

async function showTeacherDashboard() {
  const teacherUid = auth.currentUser?.uid;
  const quizCodesQuery = query(collection(db, "quizCodes"), where("creatorUid", "==", teacherUid));
  const quizCodesSnap = await getDocs(quizCodesQuery);
  const codeList = quizCodesSnap.docs.map(doc => doc.data().code);
  if (codeList.length === 0) {
    alert("No quizzes published yet.");
    return;
  }
  const resultsQuery = query(collection(db, "quizResults"), where("code", "in", codeList), orderBy("timestamp", "desc"));
  const resultsSnap = await getDocs(resultsQuery);
  if (resultsSnap.empty) {
    alert("No student results yet.");
    return;
  }
  let message = "Quiz Results:\n\n";
  resultsSnap.forEach(doc => {
    const data = doc.data();
    message += `${data.userEmail} | Code: ${data.code} | Score: ${data.score}/100 | Penalties: ${data.penalties} | ${new Date(data.timestamp).toLocaleString()}\n`;
  });
  alert(message);
}

async function showStudentHistory() {
  const userId = auth.currentUser?.uid;
  const resultsQuery = query(collection(db, "quizResults"), where("userId", "==", userId), orderBy("timestamp", "desc"));
  const resultsSnap = await getDocs(resultsQuery);
  if (resultsSnap.empty) {
    alert("No past quizzes found.");
    return;
  }
  let message = "My Quiz History:\n\n";
  resultsSnap.forEach(doc => {
    const data = doc.data();
    message += `${new Date(data.timestamp).toLocaleString()} | Code: ${data.code || "manual"} | Score: ${data.score}/100 | Penalties: ${data.penalties}\n`;
  });
  alert(message);
}

document.addEventListener('DOMContentLoaded', () => {
  // Password toggle
  const toggle = getEl("togglePassword");
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = getEl("loginPassword");
      const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
      pwd.setAttribute('type', type);
      toggle.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // Auth buttons
  getEl("loginBtn")?.addEventListener('click', () => handleLogin(getEl("loginEmail").value, getEl("loginPassword").value));
  getEl("registerBtn")?.addEventListener('click', () => {
    const role = getEl("registerRole")?.value || "student";
    handleRegister(getEl("loginEmail").value, getEl("loginPassword").value, role);
  });
  getEl("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);
  getEl("logoutBtn")?.addEventListener('click', () => signOut(auth));

  // Quiz controls
  getEl("startQuizBtn")?.addEventListener('click', startQuiz);
  getEl("backToHomeBtn")?.addEventListener('click', returnToHome);
  getEl("joinQuizBtn")?.addEventListener('click', async () => {
    const code = getEl("joinCodeInput")?.value.trim();
    const errDiv = getEl("joinCodeError");
    if (!code || code.length !== 6) {
      if (errDiv) errDiv.innerText = "Enter 6-digit code";
      return;
    }
    if (errDiv) errDiv.innerText = "";
    await joinQuizByCode(code);
  });

  // Teacher / student buttons
  getEl("teacherDashboardBtn")?.addEventListener('click', showTeacherDashboard);
  getEl("studentHistoryBtn")?.addEventListener('click', showStudentHistory);

  // Editor
  getEl("openEditorBtn")?.addEventListener('click', () => {
    if (currentUserRole !== "teacher") {
      alert("Only teachers can edit questions.");
      return;
    }
    renderSubjectsList();
    renderQuestionEditor();
    getEl("homeScreen").style.display = "none";
    getEl("editorScreen").style.display = "block";
  });
  getEl("closeEditorBtn")?.addEventListener('click', () => {
    getEl("editorScreen").style.display = "none";
    getEl("homeScreen").style.display = "flex";
  });
  getEl("loadQuestionsBtn")?.addEventListener('click', renderQuestionEditor);
  getEl("addQuestionBtn")?.addEventListener('click', addNewQuestion);
  getEl("addSubjectBtn")?.addEventListener('click', async () => {
    if (currentUserRole !== "teacher") {
      alert("Only teachers can add subjects.");
      return;
    }
    await addNewSubject();
  });
  getEl("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(err => console.error(err));
  });

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        showAuthMessage("Please verify your email before logging in.", false);
        await signOut(auth);
        return;
      }
      currentUserId = user.uid;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) {
        role = userDoc.data().role;
      } else {
        await setDoc(userDocRef, { email: user.email, role: "student", createdAt: new Date().toISOString(), emailVerified: true });
      }
      currentUserRole = role;
      addLog(`User ${user.email} (${role}) logged in.`);
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      applyRoleBasedUI(role);
      getEl('authScreen').style.display = 'none';
      getEl('appContainer').style.display = 'block';
    } else {
      window.questionBank = getDefaultQuestionBank();
      getEl('authScreen').style.display = 'flex';
      getEl('appContainer').style.display = 'none';
      addLog("Logged out");
    }
  });
});
