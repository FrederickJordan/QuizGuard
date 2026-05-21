import { getEl, addLog } from './utils.js';
import { auth } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { loadQuestionBankFromFirestore, getDefaultQuestionBank, questionBank } from './questionBank.js';
import { startQuiz, returnToHome, joinQuizByCode } from './quiz.js';
import { renderSubjectsList, renderQuestionEditor, addNewQuestion, addNewSubject, updateSubjectDropdowns } from './editor.js';
import { handleLogin, handleRegister, handleGoogleSignIn, showAuthMessage } from './auth.js';

const db = getFirestore();
let currentUserRole = null;
let currentUserId = null;

window.questionBank = questionBank;

function applyRoleBasedUI(role) {
  const editorBtn = getEl("openEditorBtn");
  const teacherDashboardBtn = getEl("teacherDashboardBtn");
  const studentHistoryBtn = getEl("studentHistoryBtn");
  const isTeacher = (role === "teacher");
  if (editorBtn) editorBtn.style.display = isTeacher ? "inline-block" : "none";
  if (teacherDashboardBtn) teacherDashboardBtn.style.display = isTeacher ? "inline-block" : "none";
  if (studentHistoryBtn) studentHistoryBtn.style.display = "inline-block"; // visible to all
}

async function showTeacherDashboard() {
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "dashboardModal";
  resultsContainer.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:3000; overflow:auto; padding:20px;";
  resultsContainer.innerHTML = `
    <div style="background:white; max-width:1000px; margin:20px auto; border-radius:20px; padding:20px;">
      <h2>Teacher Dashboard - Quiz Results</h2>
      <div id="dashboardContent">Loading...</div>
      <button id="closeDashboard" class="home-btn editor-btn" style="margin-top:20px;">Close</button>
    </div>
  `;
  document.body.appendChild(resultsContainer);
  const closeBtn = resultsContainer.querySelector("#closeDashboard");
  closeBtn.onclick = () => resultsContainer.remove();

  const teacherUid = auth.currentUser?.uid;
  const quizCodesQuery = query(collection(db, "quizCodes"), where("creatorUid", "==", teacherUid));
  const quizCodesSnap = await getDocs(quizCodesQuery);
  const codeList = quizCodesSnap.docs.map(doc => doc.data().code);
  if (codeList.length === 0) {
    document.getElementById("dashboardContent").innerHTML = "<p>No quizzes published yet.</p>";
    return;
  }
  const resultsQuery = query(collection(db, "quizResults"), where("code", "in", codeList), orderBy("timestamp", "desc"));
  const resultsSnap = await getDocs(resultsQuery);
  if (resultsSnap.empty) {
    document.getElementById("dashboardContent").innerHTML = "<p>No student results yet.</p>";
    return;
  }
  let html = "<table style='width:100%; border-collapse: collapse;'><tr><th>Student</th><th>Quiz Code</th><th>Score</th><th>Penalties</th><th>Date</th><th>Details</th></tr>";
  resultsSnap.forEach(doc => {
    const data = doc.data();
    html += `<tr style='border-bottom:1px solid #ddd;'>
      <td style='padding:8px;'>${data.userEmail}</td>
      <td style='padding:8px;'>${data.code}</td>
      <td style='padding:8px;'>${data.score}/100</td>
      <td style='padding:8px;'>${data.penalties}</td>
      <td style='padding:8px;'>${new Date(data.timestamp).toLocaleString()}</td>
      <td style='padding:8px;'><button class='viewDetails' data-id='${doc.id}'>View</button></td>
     </tr>`;
  });
  html += "</table>";
  document.getElementById("dashboardContent").innerHTML = html;
  document.querySelectorAll(".viewDetails").forEach(btn => {
    btn.addEventListener("click", async () => {
      const resultId = btn.dataset.id;
      const resultDoc = await getDoc(doc(db, "quizResults", resultId));
      const data = resultDoc.data();
      let wrongHtml = "<ul>";
      data.wrongAnswers?.forEach(w => {
        wrongHtml += `<li><strong>${w.question}</strong><br>Your answer: ${w.selectedAnswer}<br>Correct: ${w.correctAnswer}</li>`;
      });
      wrongHtml += "</ul>";
      alert(`Score: ${data.score}\nPenalties: ${data.penalties}\nTab switches: ${data.tabSwitches}\nWrong answers:\n${wrongHtml}\nAI Feedback: ${data.aiFeedback || "None"}`);
    });
  });
}

async function showStudentHistory() {
  const userId = auth.currentUser?.uid;
  const resultsQuery = query(collection(db, "quizResults"), where("userId", "==", userId), orderBy("timestamp", "desc"));
  const resultsSnap = await getDocs(resultsQuery);
  const modal = document.createElement("div");
  modal.id = "historyModal";
  modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:3000; overflow:auto; padding:20px;";
  modal.innerHTML = `
    <div style="background:white; max-width:800px; margin:20px auto; border-radius:20px; padding:20px;">
      <h2>My Quiz History</h2>
      <div id="historyContent">Loading...</div>
      <button id="closeHistory" class="home-btn editor-btn" style="margin-top:20px;">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("closeHistory").onclick = () => modal.remove();
  if (resultsSnap.empty) {
    document.getElementById("historyContent").innerHTML = "<p>No past quizzes found.</p>";
    return;
  }
  let html = "<table style='width:100%; border-collapse: collapse;'><tr><th>Date</th><th>Quiz Code</th><th>Subject</th><th>Score</th><th>Penalties</th><th>Details</th></tr>";
  resultsSnap.forEach(doc => {
    const data = doc.data();
    html += `<tr style='border-bottom:1px solid #ddd;'>
      <td style='padding:8px;'>${new Date(data.timestamp).toLocaleString()}</td>
      <td style='padding:8px;'>${data.code || "manual"}</td>
      <td style='padding:8px;'>${data.subject || "-"}</td>
      <td style='padding:8px;'>${data.score}/100</td>
      <td style='padding:8px;'>${data.penalties}</td>
      <td style='padding:8px;'><button class='viewResult' data-id='${doc.id}'>View</button></td>
     </tr>`;
  });
  html += "</table>";
  document.getElementById("historyContent").innerHTML = html;
  document.querySelectorAll(".viewResult").forEach(btn => {
    btn.addEventListener("click", async () => {
      const resultId = btn.dataset.id;
      const resultDoc = await getDoc(doc(db, "quizResults", resultId));
      const data = resultDoc.data();
      let wrongHtml = "<ul>";
      data.wrongAnswers?.forEach(w => {
        wrongHtml += `<li><strong>${w.question}</strong><br>Your answer: ${w.selectedAnswer}<br>Correct: ${w.correctAnswer}</li>`;
      });
      wrongHtml += "</ul>";
      alert(`Score: ${data.score}\nPenalties: ${data.penalties}\nTab switches: ${data.tabSwitches}\nWrong answers:\n${wrongHtml}\nAI Feedback: ${data.aiFeedback || "None"}`);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = getEl("togglePassword");
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwd = getEl("loginPassword");
      const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
      pwd.setAttribute('type', type);
      toggle.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  getEl("loginBtn")?.addEventListener('click', () => handleLogin(getEl("loginEmail").value, getEl("loginPassword").value));
  getEl("registerBtn")?.addEventListener('click', () => {
    const roleSelect = getEl("registerRole");
    const role = roleSelect ? roleSelect.value : "student";
    handleRegister(getEl("loginEmail").value, getEl("loginPassword").value, role);
  });
  getEl("googleSignInBtn")?.addEventListener('click', handleGoogleSignIn);
  getEl("logoutBtn")?.addEventListener('click', () => signOut(auth));
  getEl("startQuizBtn")?.addEventListener('click', startQuiz);
  getEl("backToHomeBtn")?.addEventListener('click', returnToHome);
  getEl("joinQuizBtn")?.addEventListener('click', async () => {
    const code = getEl("joinCodeInput").value.trim();
    const errorDiv = getEl("joinCodeError");
    if (!code || code.length !== 6) {
      if (errorDiv) errorDiv.innerText = "Please enter a valid 6-digit code.";
      return;
    }
    if (errorDiv) errorDiv.innerText = "";
    await joinQuizByCode(code);
  });
  getEl("teacherDashboardBtn")?.addEventListener('click', showTeacherDashboard);
  getEl("studentHistoryBtn")?.addEventListener('click', showStudentHistory);

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
  getEl("pauseOverlayContinue")?.addEventListener('click', () => {
    document.documentElement.requestFullscreen().catch(err => console.error(err));
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.emailVerified) {
        addLog(`User ${user.email} not verified – signing out.`);
        showAuthMessage("Please verify your email address before logging in.", false);
        await signOut(auth);
        return;
      }
      currentUserId = user.uid;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = "student";
      if (userDoc.exists() && userDoc.data().role) {
        role = userDoc.data().role;
      } else {
        await setDoc(userDocRef, {
          email: user.email,
          role: "student",
          createdAt: new Date().toISOString(),
          emailVerified: user.emailVerified
        });
      }
      currentUserRole = role;
      addLog(`User ${user.email} (${role}) logged in.`);
      await loadQuestionBankFromFirestore();
      updateSubjectDropdowns();
      applyRoleBasedUI(role);
      getEl('authScreen').style.display = 'none';
      getEl('appContainer').style.display = 'block';
    } else {
      currentUserRole = null;
      window.questionBank = getDefaultQuestionBank();
      getEl('authScreen').style.display = 'flex';
      getEl('appContainer').style.display = 'none';
      addLog("Logged out");
    }
  });
});
