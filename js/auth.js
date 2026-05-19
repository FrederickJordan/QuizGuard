import { auth } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendEmailVerification
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getEl, addLog } from './utils.js';

const db = getFirestore();

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

// Handle login with email verification check
export async function handleLogin(email, password) {
  if (!email || !password) {
    showAuthMessage("Enter email and password.", false);
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Please verify your email address. Check your inbox and spam folder.", false);
      addLog(`Login blocked: ${user.email} not verified.`);
      return;
    }
    
    showAuthMessage(`Welcome back, ${user.email}!`, true);
    addLog(`User logged in: ${user.email}`);
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

// Handle registration with email verification and role storage
export async function handleRegister(email, password, role = "student") {
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
    const user = userCredential.user;
    
    // Send verification email
    await sendEmailVerification(user);
    showAuthMessage(`Verification email sent to ${user.email}. Please verify before logging in.`, true);
    addLog(`Verification email sent to ${user.email}`);
    
    // Store user role in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });
    addLog(`User role "${role}" stored for ${user.email}`);
    
    // Immediately sign out until email is verified
    await signOut(auth);
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

// Google Sign-In with automatic role assignment and verification check
export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Google accounts are automatically verified
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Your Google email is not verified. Please verify it and try again.", false);
      return;
    }
    
    // Ensure user document exists in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "student",   // default role for Google users
        createdAt: new Date().toISOString(),
        emailVerified: true
      });
      addLog(`Google user role created for ${user.email}`);
    }
    
    showAuthMessage(`Welcome, ${user.displayName || user.email}!`, true);
    addLog(`Google sign-in: ${user.email}`);
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
