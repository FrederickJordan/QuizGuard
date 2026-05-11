// script.js – Firebase integrated version
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// References to Firebase objects (set by index.html)
const auth = window.auth;
const db = window.db;
const signOutFirebase = window.signOut;

// Global question bank (will be loaded from Firestore)
let questionBank = {};

// DOM elements
function getEl(id) { return document.getElementById(id); }

// ---------- LOGGING ----------
function addLog(message) {
  const logArea = getEl("logArea");
  if (!logArea) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.innerHTML = `<strong>[${time}]</strong> ${message}`;
  logArea.prepend(entry);
  while (logArea.children.length > 10) logArea.removeChild(logArea.lastChild);
}

// ---------- FIREBASE SAVE/LOAD ----------
async function saveQuestionBankToFirebase() {
  if (!auth.currentUser) return;
  const userDoc = doc(db, "users", auth.currentUser.uid);
  await setDoc(userDoc, { questionBank: questionBank }, { merge: true });
  addLog("Question bank saved to cloud.");
}

async function loadQuestionBankFromFirebase() {
  if (!auth.currentUser) return;
  const userDoc = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(userDoc);
  if (docSnap.exists() && docSnap.data().questionBank) {
    questionBank = docSnap.data().questionBank;
    addLog("Question bank loaded from cloud.");
  } else {
    // Default bank (include all 10 per difficulty)
    questionBank = getDefaultQuestionBank();
    await saveQuestionBankToFirebase(); // upload default
  }
  // Refresh any open editor view
  if (getEl("editorScreen").style.display === "block") renderQuestionEditor();
}

function getDefaultQuestionBank() {
  // Your existing huge questionBank object (10 per difficulty) goes here.
  // To save space, I assume you already have it. Copy from your previous script.
  // For brevity, I'm not repeating all 120 questions – paste your full bank here.
  return {
    math: { easy: [...], medium: [...], hard: [...] },
    english: { easy: [...], medium: [...], hard: [...] },
    computer_science: { easy: [...], medium: [...], hard: [...] },
    science: { easy: [...], medium: [...], hard: [...] }
  };
}

// ---------- WRAPPER for any questionBank modification to auto‑save ----------
function modifyQuestionBankAndSave(callback) {
  callback();
  saveQuestionBankToFirebase();
}

// ---------- EXISTING QUIZ FUNCTIONS (modified to use global questionBank) ----------
// All functions that previously used the const `questionBank` must now reference the global variable.
// For example:
function startQuizApp() {
  const subject = getEl("subjectSelect").value;
  const difficulty = getEl("difficultySelect").value;
  const questions = questionBank[subject][difficulty];
  // ... rest unchanged (your existing startQuizApp logic)
}
function addNewQuestion() {
  const subject = getEl("editorSubjectSelect").value;
  const difficulty = getEl("editorDifficultySelect").value;
  // ... add logic
  modifyQuestionBankAndSave(() => {
    questionBank[subject][difficulty].push({ question, answers, correct });
  });
  renderQuestionEditor();
}
// Similarly, updateQuestion, updateAnswer, etc., should call modifyQuestionBankAndSave.

// ---------- LOGIN / LOGOUT ----------
document.getElementById("loginBtn").onclick = async () => {
  const email = getEl("loginEmail").value;
  const pwd = getEl("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, pwd);
    getEl("authMessage").innerText = "";
  } catch (err) {
    getEl("authMessage").innerText = err.message;
  }
};
document.getElementById("registerBtn").onclick = async () => {
  const email = getEl("loginEmail").value;
  const pwd = getEl("loginPassword").value;
  try {
    await createUserWithEmailAndPassword(auth, email, pwd);
    getEl("authMessage").innerText = "";
  } catch (err) {
    getEl("authMessage").innerText = err.message;
  }
};
document.getElementById("logoutBtn").onclick = async () => {
  await signOutFirebase(auth);
};

// ---------- AUTH STATE LISTENER ----------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User logged in: load data and show main app
    await loadQuestionBankFromFirebase();
    getEl("authScreen").style.display = "none";
    getEl("appContainer").style.display = "block";
    // Optionally reload home screen
  } else {
    // User logged out: show auth screen
    getEl("authScreen").style.display = "flex";
    getEl("appContainer").style.display = "none";
  }
});

// You must also copy ALL your existing game and UI functions (cup, QTE, loadQuestion, endQuiz, etc.)
// and change every reference of `questionBank` to the global variable.
// Because the file is long, I’ll summarise: everything stays the same, just use the global `questionBank`.
