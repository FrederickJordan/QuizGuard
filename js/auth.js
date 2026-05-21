import { auth } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore';
import { getEl, addLog } from './utils.js';

const db = getFirestore();

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

export async function handleLogin(email, password) {
  console.log("handleLogin called with", email);
  if (!email || !password) {
    showAuthMessage("Enter email and password.", false);
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Please verify your email address. Check your inbox.", false);
      return;
    }
    showAuthMessage(`Welcome back, ${user.email}!`, true);
  } catch (error) {
    console.error("Login error", error);
    let errorMsg = "Login failed. ";
    if (error.code === 'auth/user-not-found') errorMsg += "No account found.";
    else if (error.code === 'auth/wrong-password') errorMsg += "Incorrect password.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}

export async function handleRegister(email, password, role = "student") {
  console.log("handleRegister called with", email, role);
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
    await sendEmailVerification(user);
    showAuthMessage(`Verification email sent to ${user.email}. Please verify before logging in.`, true);
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });
    await signOut(auth);
  } catch (error) {
    console.error("Register error", error);
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') errorMsg += "Email already registered.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else if (error.code === 'auth/weak-password') errorMsg += "Password too weak.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}

export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Your Google email is not verified. Please verify it.", false);
      return;
    }
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "student",
        createdAt: new Date().toISOString(),
        emailVerified: true
      });
    }
    showAuthMessage(`Welcome, ${user.displayName || user.email}!`, true);
  } catch (err) {
    console.error("Google popup error", err);
    let msg = "Google sign-in failed. ";
    if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked. Please allow pop‑ups.";
    else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized in Firebase.";
    else msg += err.message;
    showAuthMessage(msg, false);
  }
}
