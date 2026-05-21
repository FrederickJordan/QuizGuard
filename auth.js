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
  if (!email || !password) {
    showAuthMessage("Enter email and password.", false);
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Please verify your email address.", false);
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
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created:", user.uid, user.email);

    // 2. Send verification email
    await sendEmailVerification(user);
    showAuthMessage(`Verification email sent to ${user.email}. Please verify before logging in.`, true);
    addLog(`Verification email sent to ${user.email}`);
    
    // 3. Store user role in Firestore (CRITICAL)
    const userDocRef = doc(db, "users", user.uid);
    const userData = {
      email: user.email,
      role: role,
      createdAt: new Date().toISOString(),
      emailVerified: false
    };
    console.log("Attempting to save to Firestore:", userData);
    await setDoc(userDocRef, userData);
    console.log("Firestore save successful");
    addLog(`User role "${role}" stored for ${user.email}`);
    
    // 4. Sign out until email is verified
    await signOut(auth);
  } catch (error) {
    console.error("Registration error details:", error);
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') errorMsg += "Email already registered.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else if (error.code === 'auth/weak-password') errorMsg += "Password too weak.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
    addLog(`Registration error: ${error.code}`);
  }
}

export async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user.emailVerified) {
      await signOut(auth);
      showAuthMessage("Your Google email is not verified.", false);
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
      console.log("[auth.js] Google user role saved as student");
    }
    showAuthMessage(`Welcome, ${user.displayName || user.email}!`, true);
    addLog(`Google sign-in: ${user.email}`);
  } catch (err) {
    let msg = "Google sign-in failed. ";
    if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked.";
    else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized.";
    else msg += err.message;
    showAuthMessage(msg, false);
    addLog(`Google error: ${err.code}`);
  }
}
