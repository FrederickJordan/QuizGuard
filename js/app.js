import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;

// Make questionBank available globally for editor functions
window.questionBank = questionBank;

// Apply UI restrictions based on role
function applyRoleBasedUI(role) {
  const editorBtn = getEl("openEditorBtn");
  const subjectsListDiv = document.getElementById("subjectsList");
  const addSubjectBtn = getEl("addSubjectBtn");
  
  const isTeacher = (role === "teacher");
  if (editorBtn) editorBtn.style.display = isTeacher ? "inline-block" : "none";
  if (subjectsListDiv) subjectsListDiv.style.display = isTeacher ? "block" : "none";
  if (addSubjectBtn) addSubjectBtn.style.display = isTeacher ? "inline-block" : "none";
}

// Initialize UI after DOM loads
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
    const roleSelect = getEl("registerRole");
    const role = roleSelect ? roleSelect.value : "student";
    handleRegister(getEl("loginEmail").value, getEl("loginPassword").value, role);
  });
  getEl("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);
  getEl("logoutBtn")?.addEventListener('click', () => signOut(auth));

  // Quiz controls
  getEl("startQuizBtn")?.addEventListener('click', startQuiz);
  getEl("backToHomeBtn")?.addEventListener('click', returnToHome);

  // Editor – open only if user is teacher (role will be checked inside)
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

  // Pause overlay continue button (from anticheat)
  getEl("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(err => console.error(err));
  });

  // Auth state listener with email verification and role fetch
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 1. Check email verification
      if (!user.emailVerified) {
        addLog(`User ${user.email} not verified – signing out.`);
        showAuthMessage("Please verify your email address before logging in.", false);
        await signOut(auth);
        return;
      }

      // 2. Fetch or create user role
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) {
        role = userDoc.data().role;
      } else {
        // Create role document for existing users (e.g., those who registered before this update)
        await setDoc(userDocRef, {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: user.emailVerified
        });
      }
      currentUserRole = role;
      addLog(`User ${user.email} (${role}) logged in.`);

      // 3. Load question bank from Firestore
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();

      // 4. Apply UI restrictions
      applyRoleBasedUI(role);

      // 5. Show main app
      getEl('authScreen').style.display = 'none';
      getEl('appContainer').style.display = 'block';
    } else {
      // User logged out
      currentUserRole = null;
      window.questionBank = getDefaultQuestionBank();
      getEl('authScreen').style.display = 'flex';
      getEl('appContainer').style.display = 'none';
      addLog("Logged out");
    }
  });
});
