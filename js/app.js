import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn } from './auth.js';  // Make sure handleGoogleSignIn is imported

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
  getEl("registerBtn")?.addEventListener('click', () => handleRegister(getEl("loginEmail").value, getEl("loginPassword").value));
  getEl("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);  // <-- ADD HERE
  getEl("logoutBtn")?.addEventListener('click', () => signOut(auth));

  // Quiz controls
  getEl("startQuizBtn")?.addEventListener('click', startQuiz);
  getEl("backToHomeBtn")?.addEventListener('click', returnToHome);

  // Editor
  getEl("openEditorBtn")?.addEventListener('click', () => {
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
  getEl("addSubjectBtn")?.addEventListener('click', addNewSubject);

  // Pause overlay continue
  getEl("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(err => console.error(err));
  });

  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      getEl('authScreen').style.display = 'none';
      getEl('appContainer').style.display = 'block';
      addLog(`Logged in as ${user.email}`);
    } else {
      window.questionBank = getDefaultQuestionBank();
      getEl('authScreen').style.display = 'flex';
      getEl('appContainer').style.display = 'none';
      addLog("Logged out");
    }
  });
});
