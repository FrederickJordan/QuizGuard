import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank } from './questionBank.js';
import { getEl, addLog } from './utils.js';

// Display auth message (success or error)
export function showAuthMessage(message, isSuccess = false) {
  const msgDiv = getEl("authMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
  msgDiv.style.display = 'block';
  if (isSuccess) {
    setTimeout(() => { msgDiv.style.display = 'none'; }, 3000);
  }
}

// Handle login
export async function handleLogin(email, password) {
  if (!email || !password) {
    showAuthMessage("Enter email and password.", false);
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Welcome back, ${userCredential.user.email}!`, true);
    addLog(`User logged in: ${userCredential.user.email}`);
  } catch (error) {
    let errorMsg = "Login failed. ";
    if (error.code === 'auth/user-not-found') errorMsg += "No account found.";
    else if (error.code === 'auth/wrong-password') errorMsg += "Incorrect password.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
    addLog(`Login error: ${error.code}`);
  }
}

// Handle registration
export async function handleRegister(email, password) {
  if (!email || !password) {
    showAuthMessage("Enter email and password.", false);
    return;
  }
  if (password.length < 6) {
    showAuthMessage("Password must be at least 6 characters.", false);
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Account created for ${userCredential.user.email}!`, true);
    addLog(`New user registered: ${userCredential.user.email}`);
  } catch (error) {
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') errorMsg += "Email already registered.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else if (error.code === 'auth/weak-password') errorMsg += "Password too weak.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
    addLog(`Registration error: ${error.code}`);
  }
}

// Handle Google Sign-In
export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    showAuthMessage(`Welcome, ${result.user.displayName || result.user.email}!`, true);
    addLog(`Google sign-in: ${result.user.email}`);
  } catch (err) {
    let msg = "Google sign-in failed. ";
    if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked. Please allow pop‑ups.";
    else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized in Firebase.";
    else if (err.code === 'auth/cancelled-popup-request') msg += "Sign-in cancelled.";
    else msg += err.message;
    showAuthMessage(msg, false);
    addLog(`Google sign-in error: ${err.code}`);
  }
}
