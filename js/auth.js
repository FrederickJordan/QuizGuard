import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank } from './questionBank.js';
import { getEl, addLog } from './utils.js';

export function showAuthMessage(message, isSuccess = false) {
  const msgDiv = getEl("authMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
  setTimeout(() => {
    msgDiv.textContent = '';
    msgDiv.className = 'auth-message';
  }, 4000);
}

export async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Welcome back, ${userCredential.user.email}!`, true);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  } catch (error) {
    let errorMsg = "Login failed. ";
    if (error.code === 'auth/user-not-found') errorMsg += "No account found.";
    else if (error.code === 'auth/wrong-password') errorMsg += "Incorrect password.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}

export async function handleRegister(email, password) {
  if (!email || !password) return showAuthMessage("Enter email and password.", false);
  if (password.length < 6) return showAuthMessage("Password must be ≥6 characters.", false);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Account created for ${userCredential.user.email}!`, true);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  } catch (error) {
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') errorMsg += "Email already registered.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}

// ADD THIS FUNCTION - IT WAS MISSING
export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    showAuthMessage(`Welcome, ${result.user.displayName || result.user.email}!`, true);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  } catch (err) {
    let msg = "Google sign-in failed. ";
    if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked. Allow pop-ups.";
    else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized in Firebase.";
    else msg += err.message;
    showAuthMessage(msg, false);
  }
}

export function setupAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadQuestionBankFromFirestore();
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      addLog(`Logged in as ${user.email}`);
    } else {
      window.questionBank = getDefaultQuestionBank();
      document.getElementById('authScreen').style.display = 'flex';
      document.getElementById('appContainer').style.display = 'none';
      addLog("Logged out");
    }
  });
}
