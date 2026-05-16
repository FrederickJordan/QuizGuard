import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank } from './questionBank.js';
import { getEl, addLog } from './utils.js';
