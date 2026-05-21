import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore';
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

console.log("app.js loaded");

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
  if (!teacherUid) return alert("Not logged in as teacher.");
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
  if (!userId) return alert("Not logged in.");
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
  console.log("DOMContentLoaded fired");

  function checkElement(id) {
    const el = document.getElementById(id);
    console.log(`Element #${id}:`, el ? "found" : "NOT FOUND");
    return el;
  }

  checkElement("loginBtn");
  checkElement("registerBtn");
  checkElement("googleSignInBtn");
  checkElement("loginEmail");
  checkElement("loginPassword");
  checkElement("authScreen");
  checkElement("appContainer");
  checkElement("togglePassword");

  // Password toggle
  const toggle = getEl("togglePassword");
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = getEl("loginPassword");
      if (pwd) {
        const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
        pwd.setAttribute('type', type);
        toggle.textContent = type === 'password' ? '👁️' : '🙈';
      }
    });
  }

  // Login button
  const loginBtn = getEl("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const email = getEl("loginEmail")?.value || "";
      const password = getEl("loginPassword")?.value || "";
      console.log("Login clicked with email:", email);
      handleLogin(email, password);
    });
  } else {
    console.error("loginBtn missing");
  }

  // Register button
  const registerBtn = getEl("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const email = getEl("loginEmail")?.value || "";
      const password = getEl("loginPassword")?.value || "";
      const roleSelect = getEl("registerRole");
      const role = roleSelect ? roleSelect.value : "student";
      console.log("Register clicked with email:", email, "role:", role);
      handleRegister(email, password, role);
    });
  } else {
    console.error("registerBtn missing");
  }

  // Google Sign-In button
  const googleBtn = getEl("googleSignInBtn");
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      console.log("Google sign-in clicked");
      handleGoogleSignIn();
    });
  } else {
    console.error("googleSignInBtn missing");
  }

  // Logout button
  const logoutBtn = getEl("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log("Logout clicked");
      signOut(auth);
    });
  }

  // Start Quiz button
  const startQuizBtn = getEl("startQuizBtn");
  if (startQuizBtn) {
    startQuizBtn.addEventListener('click', () => {
      console.log("Start Quiz clicked");
      startQuiz();
    });
  }

  // Back to Home button
  const backToHomeBtn = getEl("backToHomeBtn");
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      console.log("Back to Home clicked");
      returnToHome();
    });
  }

  // Join Quiz button
  const joinQuizBtn = getEl("joinQuizBtn");
  if (joinQuizBtn) {
    joinQuizBtn.addEventListener('click', async () => {
      const code = getEl("joinCodeInput")?.value.trim();
      const errDiv = getEl("joinCodeError");
      console.log("Join quiz with code:", code);
      if (!code || code.length !== 6) {
        if (errDiv) errDiv.innerText = "Enter 6-digit code";
        return;
      }
      if (errDiv) errDiv.innerText = "";
      await joinQuizByCode(code);
    });
  }

  // Teacher Dashboard button
  const teacherDashboardBtn = getEl("teacherDashboardBtn");
  if (teacherDashboardBtn) {
    teacherDashboardBtn.addEventListener('click', () => {
      console.log("Teacher Dashboard clicked");
      showTeacherDashboard();
    });
  }

  // Student History button
  const studentHistoryBtn = getEl("studentHistoryBtn");
  if (studentHistoryBtn) {
    studentHistoryBtn.addEventListener('click', () => {
      console.log("Student History clicked");
      showStudentHistory();
    });
  }

  // Open Editor button (teacher only)
  const openEditorBtn = getEl("openEditorBtn");
  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => {
      console.log("Open Editor clicked, currentUserRole:", currentUserRole);
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

  // Close Editor button
  const closeEditorBtn = getEl("closeEditorBtn");
  if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', () => {
      console.log("Close Editor clicked");
      getEl("editorScreen").style.display = "none";
      getEl("homeScreen").style.display = "flex";
    });
  }

  // Load Questions button
  const loadQuestionsBtn = getEl("loadQuestionsBtn");
  if (loadQuestionsBtn) {
    loadQuestionsBtn.addEventListener('click', () => {
      console.log("Load Questions clicked");
      renderQuestionEditor();
    });
  }

  // Add Question button
  const addQuestionBtn = getEl("addQuestionBtn");
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', () => {
      console.log("Add Question clicked");
      addNewQuestion();
    });
  }

  // Add Subject button
  const addSubjectBtn = getEl("addSubjectBtn");
  if (addSubjectBtn) {
    addSubjectBtn.addEventListener('click', async () => {
      console.log("Add Subject clicked, currentUserRole:", currentUserRole);
      if (currentUserRole !== "teacher") {
        alert("Only teachers can add subjects.");
        return;
      }
      await addNewSubject();
    });
  }

  // Pause overlay continue (fullscreen request)
  const pauseOverlayContinue = getEl("pauseOverlayContinue");
  if (pauseOverlayContinue) {
    pauseOverlayContinue.addEventListener('click', () => {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    });
  }

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed, user:", user ? user.email : "null");
    if (user) {
      if (!user.emailVerified) {
        console.log("User email not verified");
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
        console.log("Created new user document with role student");
      }
      currentUserRole = role;
      console.log(`User ${user.email} (${role}) logged in.`);
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      applyRoleBasedUI(role);
      getEl("authScreen").style.display = "none";
      getEl("appContainer").style.display = "block";
    } else {
      console.log("No user, showing auth screen");
      window.questionBank = getDefaultQuestionBank();
      getEl("authScreen").style.display = "flex";
      getEl("appContainer").style.display = "none";
    }
  });
});
