import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore';
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
    message += `${data.userEmail} | Code: ${data.code} | Score: ${data.score}/100 | Penalties: ${data.penalties}\n`;
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
    message += `${new Date(data.timestamp).toLocaleString()} | ${data.code || "manual"} | Score: ${data.score}/100 | Penalties: ${data.penalties}\n`;
  });
  alert(message);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded – app.js running");

  // Get all elements
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

  console.log("Elements found:", {
    loginBtn: !!loginBtn,
    registerBtn: !!registerBtn,
    googleBtn: !!googleBtn
  });

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

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const email = getEl("loginEmail")?.value || "";
      const password = getEl("loginPassword")?.value || "";
      console.log("Login clicked", email);
      handleLogin(email, password);
    });
  } else console.error("loginBtn missing");

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const email = getEl("loginEmail")?.value || "";
      const password = getEl("loginPassword")?.value || "";
      const roleSelect = getEl("registerRole");
      const role = roleSelect ? roleSelect.value : "student";
      console.log("Register clicked", email, role);
      handleRegister(email, password, role);
    });
  } else console.error("registerBtn missing");

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      console.log("Google sign-in clicked");
      handleGoogleSignIn();
    });
  } else console.error("googleBtn missing");

  if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));
  if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
  if (backToHomeBtn) backToHomeBtn.addEventListener('click', returnToHome);
  if (joinQuizBtn) {
    joinQuizBtn.addEventListener('click', async () => {
      const code = getEl("joinCodeInput")?.value.trim();
      const errDiv = getEl("joinCodeError");
      if (!code || code.length !== 6) {
        if (errDiv) errDiv.innerText = "Enter 6-digit code";
        return;
      }
      if (errDiv) errDiv.innerText = "";
      await joinQuizByCode(code);
    });
  }
  if (teacherDashboardBtn) teacherDashboardBtn.addEventListener('click', showTeacherDashboard);
  if (studentHistoryBtn) studentHistoryBtn.addEventListener('click', showStudentHistory);
  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      if (currentUserRole !== "teacher") {
        alert("Only teachers can edit questions.");
        return;
      }
      renderSubjectsList();
      renderQuestionEditor();
      getEl("homeScreen").style.display = "none";
      getEl("editorScreen").style.display = "block";
    });
  }
  if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', () => {
      getEl("editorScreen").style.display = "none";
      getEl("homeScreen").style.display = "flex";
    });
  }
  if (loadQuestionsBtn) loadQuestionsBtn.addEventListener('click', renderQuestionEditor);
  if (addQuestionBtn) addQuestionBtn.addEventListener('click', addNewQuestion);
  if (addSubjectBtn) {
    addSubjectBtn.addEventListener('click', async () => {
      if (currentUserRole !== "teacher") {
        alert("Only teachers can add subjects.");
        return;
      }
      await addNewSubject();
    });
  }
  if (pauseOverlayContinue) {
    pauseOverlayContinue.addEventListener('click', () => {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    });
  }

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        showAuthMessage("Please verify your email before logging in.", false);
        await signOut(auth);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) {
        role = userDoc.data().role;
      } else {
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
      applyRoleBasedUI(role);
      getEl('authScreen').style.display = 'none';
      getEl('appContainer').style.display = 'block';
    } else {
      window.questionBank = getDefaultQuestionBank();
      getEl('authScreen').style.display = 'flex';
      getEl('appContainer').style.display = 'none';
    }
  });
});
