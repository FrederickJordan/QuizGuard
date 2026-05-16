import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-aOYS4SxBin4ks17MzX_TVtnxzjPLhD8",
  authDomain: "quizguard-d8c56.firebaseapp.com",
  databaseURL: "https://quizguard-d8c56-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizguard-d8c56",
  storageBucket: "quizguard-d8c56.firebasestorage.app",
  messagingSenderId: "1025907204447",
  appId: "1:1025907204447:web:047dc148e89e49e21456ea",
  measurementId: "G-YBKTDS05H3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);