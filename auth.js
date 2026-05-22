import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase-config.js';
import { getEl, addLog } from './utils.js';

/** Prevents onAuthStateChanged from signing out mid-registration before role is saved */
export let isRegistering = false;

function normalizeRole(role) {
  return String(role || '').toLowerCase().trim() === 'teacher' ? 'teacher' : 'student';
}

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
      showAuthMessage("Please verify your email address. Check your inbox.", false);
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

  const normalizedRole = normalizeRole(role);
  console.log(`[Register] Selected role: "${role}" → saving as "${normalizedRole}"`);

  isRegistering = true;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDocRef = doc(db, "users", user.uid);

    // Must finish while still signed in (Firestore rules usually require auth)
    await setDoc(
      userDocRef,
      {
        email: user.email,
        role: normalizedRole,
        createdAt: new Date().toISOString(),
        emailVerified: false,
      },
      { merge: true }
    );

    const verifySnap = await getDoc(userDocRef);
    const savedRole = verifySnap.data()?.role;
    console.log(`[Register] Firestore role after save: "${savedRole}"`);
    if (savedRole !== normalizedRole) {
      throw new Error(
        `Could not save ${normalizedRole} role (Firestore has "${savedRole || 'none'}"). Check Firestore security rules.`
      );
    }

    addLog(`User role "${normalizedRole}" stored for ${user.email}`);
    await sendEmailVerification(user);
    showAuthMessage(
      `Account created as ${normalizedRole}. Verify your email, then log in.`,
      true
    );
    addLog(`Verification email sent to ${user.email}`);
  } catch (error) {
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') {
      errorMsg += "Email already registered — log in or use a new email.";
    } else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email format.";
    else if (error.code === 'auth/weak-password') errorMsg += "Password too weak.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
    addLog(`Registration error: ${error?.code || error.message}`);
    console.error('[Register] failed:', error);
  } finally {
    isRegistering = false;
    if (auth.currentUser) await signOut(auth);
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
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(
        userDocRef,
        {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: true,
        },
        { merge: true }
      );
    } else if (!userDoc.data().role) {
      await setDoc(userDocRef, { role: "student" }, { merge: true });
    }
    showAuthMessage(`Welcome, ${user.displayName || user.email}!`, true);
    addLog(`Google sign-in: ${user.email}`);
  } catch (err) {
    let msg = "Google sign-in failed. ";
    if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked. Please allow pop‑ups.";
    else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized in Firebase.";
    else msg += err.message;
    showAuthMessage(msg, false);
    addLog(`Google error: ${err.code}`);
  }
}
