console.log("=== app.js started ===");

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

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded fired");

  // Debug: check if buttons exist
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const googleBtn = document.getElementById("googleSignInBtn");
  console.log("loginBtn exists?", !!loginBtn);
  console.log("registerBtn exists?", !!registerBtn);
  console.log("googleBtn exists?", !!googleBtn);

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      console.log("Login clicked with email:", email);
      alert("Login clicked! Check console for details.");
      handleLogin(email, password);
    });
  } else {
    console.error("loginBtn not found");
    alert("loginBtn missing from HTML!");
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      const roleSelect = document.getElementById("registerRole");
      const role = roleSelect ? roleSelect.value : "student";
      console.log("Register clicked with email:", email);
      alert("Register clicked! Check console for details.");
      handleRegister(email, password, role);
    });
  } else {
    console.error("registerBtn not found");
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      console.log("Google sign-in clicked");
      handleGoogleSignIn();
    });
  }

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed, user =", user ? user.email : "null");
    if (user) {
      if (!user.emailVerified) {
        console.log("Email not verified");
        showAuthMessage("Please verify your email.", false);
        await signOut(auth);
        return;
      }
      console.log("User verified, loading data...");
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) role = userDoc.data().role;
      else await setDoc(doc(db, "users", user.uid), { email: user.email, role: "student", createdAt: new Date().toISOString(), emailVerified: true });
      currentUserRole = role;
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      document.getElementById("authScreen").style.display = "none";
      document.getElementById("appContainer").style.display = "block";
    } else {
      document.getElementById("authScreen").style.display = "flex";
      document.getElementById("appContainer").style.display = "none";
    }
  });
});
