import { getEl, addLog, shuffleArray } from './utils.js';
import { questionBank } from './questionBank.js';
import { stopMinigames, startCupGame, startQTEGame, setMinigameQuizPaused, setApplyPenaltyCallback } from './minigames.js';
import { requestFullscreenMode, setQuizActive, setQuizPaused, hidePauseOverlay, setPendingFailureCallback, setMinigamePauseCallback, resetFullscreenExitAttempts } from './anticheat.js';
import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let pointsPerCorrect = 10;
let quizActive = false;
let pendingFailure = false;
let selectedAnswerIndex = null;
let wrongAnswers = [];
let currentQuizCode = null;
let currentQuizSubject = null;
let currentQuizDifficulty = null;
let isEndingQuiz = false; // Prevent multiple endQuiz calls

// ========== AI FEEDBACK FUNCTIONS ==========

function showAiFeedback(text) {
  const feedbackBox = getEl("aiFeedbackResults");
  if (!feedbackBox) return;
  
  feedbackBox.style.display = "block";
  
  const formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/Question \d+:/g, match => `<strong style="color: #2563eb;">${match}</strong>`)
    .replace(/🎉/g, '<span style="font-size: 20px;">🎉</span>');
  
  feedbackBox.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border-radius: 16px; padding: 20px; color: white;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px;">🤖</span>
        <h3 style="margin: 0; font-size: 20px;">AI Review - What You Missed</h3>
      </div>
      <div style="line-height: 1.8; font-size: 15px;">${formattedText}</div>
    </div>
  `;
}

function clearAiFeedback() {
  const feedbackBox = getEl("aiFeedbackResults");
  if (!feedbackBox) return;
  feedbackBox.style.display = "none";
  feedbackBox.innerHTML = "";
}

function buildManualFeedback(wrongAnswersList) {
  if (!wrongAnswersList || wrongAnswersList.length === 0) {
    return "No wrong answers recorded.";
  }
  
  let feedback = "📝 Review Your Mistakes\n\n";
  wrongAnswersList.forEach((wa, i) => {
    feedback += `${i+1}. ${wa.question}\n`;
    feedback += `   ❌ Your answer: ${wa.selectedAnswer}\n`;
    feedback += `   ✅ Correct: ${wa.correctAnswer}\n\n`;
  });
  return feedback;
}

async function requestAiFeedback(wrongAnswersList) {
  const WORKER_URL = "https://quizguardslave.17fjsetiawan.workers.dev";
  
  console.log(`📤 Sending ${wrongAnswersList.length} wrong answers to AI:`, wrongAnswersList);
  
  if (!wrongAnswersList || wrongAnswersList.length === 0) {
    return "No wrong answers to analyze.";
  }
  
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ wrongAnswers: wrongAnswersList })
    });
    
    console.log(`📥 Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ AI Response received:", data);
    return data.feedback || buildManualFeedback(wrongAnswersList);
    
  } catch (error) {
    console.error("❌ AI fetch error:", error);
    return buildManualFeedback(wrongAnswersList);
  }
}

// ========== EXISTING QUIZ FUNCTIONS ==========

export function updateStats() {
  getEl("score").textContent = Math.floor(score);
  getEl("penalties").textContent = penalties;
  getEl("tabSwitches").textContent = tabSwitches;
}

export function applyPenalty(reason) {
  penalties++;
  failures++;
  score = Math.max(0, score - 5);
  updateStats();
  addLog(`Penalty: ${reason} -5 (now ${Math.floor(score)})`);
}

export function failCurrentQuestion(reason) {
  console.log(`🔴 failCurrentQuestion called with reason: ${reason}`);
  console.log(`   currentQuestion: ${currentQuestion}, questions length: ${questions.length}`);
  console.log(`   quizActive: ${quizActive}, isEndingQuiz: ${isEndingQuiz}`);
  
  // Don't process if quiz is already ending
  if (isEndingQuiz) {
    console.log(`   ⚠️ Quiz is already ending, skipping failure`);
    return;
  }
  
  if (currentQuestion >= questions.length) {
    console.log(`   ❌ currentQuestion out of range, returning`);
    return;
  }
  
  const currentQ = questions[currentQuestion];
  console.log(`   Current question:`, currentQ?.question);
  
  if (!currentQ) {
    console.log(`   ❌ No current question found!`);
    return;
  }
  
  // Record the failure
  failures++;
  
  // Get correct answer text
  const correctAnswerText = currentQ.answers[currentQ.correct];
  console.log(`   Correct answer: ${correctAnswerText}`);
  
  // IMPORTANT: Always add to wrongAnswers array for AI analysis
  const wrongAnswerEntry = {
    question: currentQ.question,
    selectedAnswer: `[FAILED - ${reason}]`,
    correctAnswer: correctAnswerText
  };
  
  wrongAnswers.push(wrongAnswerEntry);
  
  console.log(`   ✅ Added to wrongAnswers. Total wrongAnswers now: ${wrongAnswers.length}`);
  console.log(`   Wrong answer entry:`, wrongAnswerEntry);
  addLog(`❌ Question failed: ${reason} - Added to wrongAnswers (total: ${wrongAnswers.length})`);
  
  // Move to next question
  currentQuestion++;
  console.log(`   Moved to next question: ${currentQuestion}`);
  
  // Load next question if quiz is still active
  if (quizActive && currentQuestion < questions.length) {
    console.log(`   Loading next question...`);
    loadQuestion();
  } else if (currentQuestion >= questions.length) {
    console.log(`   Quiz complete, calling endQuiz...`);
    console.log(`   Final wrongAnswers count: ${wrongAnswers.length}`);
    endQuiz();
  }
}

async function saveQuizResults() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Get the AI feedback text from the displayed element
  const feedbackElement = getEl("aiFeedbackResults");
  let aiFeedbackText = "";
  if (feedbackElement) {
    aiFeedbackText = feedbackElement.textContent || "";
  }
  
  console.log(`💾 Saving quiz results with ${wrongAnswers.length} wrong answers`);
  console.log(`   Wrong answers:`, wrongAnswers);
  
  await addDoc(collection(db, "quizResults"), {
    userId: user.uid,
    userEmail: user.email,
    code: currentQuizCode || "manual",
    subject: currentQuizSubject,
    difficulty: currentQuizDifficulty,
    score: Math.floor(score),
    penalties: penalties,
    failures: failures,
    tabSwitches: tabSwitches,
    wrongAnswers: wrongAnswers,
    aiFeedback: aiFeedbackText,
    timestamp: new Date().toISOString()
  });
  addLog("Quiz results saved.");
}

function startQuizWithQuestions(qlist, selectedMinigame, code = null, subject = null, difficulty = null) {
  if (!qlist || qlist.length === 0) {
    alert("No questions available.");
    return;
  }
  questions = shuffleArray(qlist);
  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;
  wrongAnswers = [];
  currentQuizCode = code;
  currentQuizSubject = subject;
  currentQuizDifficulty = difficulty;
  pointsPerCorrect = 100 / questions.length;
  if (isNaN(pointsPerCorrect)) pointsPerCorrect = 10;
  resetFullscreenExitAttempts();
  isEndingQuiz = false;

  let gameMode;
  if (selectedMinigame === "random") gameMode = Math.random() < 0.5 ? "cups" : "qte";
  else gameMode = selectedMinigame;

  getEl("quizContent").style.display = "block";
  getEl("resultsScreen").style.display = "none";
  getEl("homeScreen").style.display = "none";
  getEl("quizApp").style.display = "flex";
  quizActive = true;
  pendingFailure = false;
  
  setQuizActive(true);
  setQuizPaused(false);
  setMinigameQuizPaused(false);
  setMinigamePauseCallback(setMinigameQuizPaused);
  setApplyPenaltyCallback(applyPenalty);
  setPendingFailureCallback(failCurrentQuestion);
  
  updateStats();

  if (gameMode === "cups") startCupGame();
  else startQTEGame();

  requestFullscreenMode().catch(err => addLog(`Fullscreen request failed: ${err.message}`));
  loadQuestion();
  addLog(`Quiz started (${questions.length} questions)`);
}

export function startQuiz() {
  if (!questionBank) {
    alert("Question bank not ready.");
    return;
  }
  const subject = getEl("subjectSelect").value;
  const difficulty = getEl("difficultySelect").value;
  const selected = getEl("minigameSelect").value;
  const subjectData = questionBank[subject];
  if (!subjectData) {
    alert(`No questions for subject: ${subject}`);
    return;
  }
  const qlist = subjectData[difficulty];
  if (!qlist || qlist.length === 0) {
    alert(`No questions for ${subject} - ${difficulty}. Try adding some.`);
    return;
  }
  startQuizWithQuestions(qlist, selected, null, subject, difficulty);
}

export async function joinQuizByCode(code) {
  const q = query(collection(db, "quizCodes"), where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    const errDiv = getEl("joinCodeError");
    if (errDiv) errDiv.innerText = "Invalid code. No quiz found.";
    return;
  }
  const data = snapshot.docs[0].data();
  const selected = getEl("minigameSelect").value;
  startQuizWithQuestions(data.questions, selected, code, data.subject, data.difficulty);
  addLog(`Joined quiz via code ${code}`);
}

export function loadQuestion() {
  console.log(`📖 loadQuestion called, currentQuestion: ${currentQuestion}, questions.length: ${questions.length}`);
  console.log(`   Current wrongAnswers count: ${wrongAnswers.length}`);

  if (currentQuestion >= questions.length) {
    console.log(`   Quiz complete, calling endQuiz...`);
    console.log(`   Final wrongAnswers count before endQuiz: ${wrongAnswers.length}`);
    endQuiz();
    return;
  }
  
  selectedAnswerIndex = null;
  clearAiFeedback();
  const q = questions[currentQuestion];
  getEl("questionNumber").textContent = `Q${currentQuestion+1}/${questions.length}`;
  getEl("questionText").textContent = q.question;
  const container = getEl("answersContainer");
  container.innerHTML = "";

  const answerOptions = shuffleArray(q.answers.map((text, index) => ({ text, index })));
  const correctIndex = answerOptions.findIndex(option => option.index === q.correct);

  answerOptions.forEach((option, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = option.text;
    btn.addEventListener("click", () => {
      if (getEl("quizApp").style.display !== "flex") return;
      const prevSelected = container.querySelector(".selected-answer");
      if (prevSelected) prevSelected.classList.remove("selected-answer");
      btn.classList.add("selected-answer");
      selectedAnswerIndex = idx;
      const submitBtn = getEl("submitAnswerBtn");
      if (submitBtn) submitBtn.disabled = false;
    });
    container.appendChild(btn);
  });

  const submitBtn = getEl("submitAnswerBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.onclick = () => {
      if (selectedAnswerIndex === null) return;
      if (selectedAnswerIndex === correctIndex) {
        score += pointsPerCorrect;
        if (score > 100) score = 100;
        addLog(`Correct +${pointsPerCorrect.toFixed(1)} → ${Math.floor(score)}`);
      } else {
        addLog("Wrong answer recorded.");
        wrongAnswers.push({
          question: q.question,
          selectedAnswer: answerOptions[selectedAnswerIndex].text,
          correctAnswer: answerOptions[correctIndex].text
        });
        console.log(`   Wrong answer added via submit. Total: ${wrongAnswers.length}`);
      }
      updateStats();
      currentQuestion++;
      loadQuestion();
    };
  }
  window.loadQuestion = loadQuestion;
}

export async function endQuiz() {
  // Prevent multiple calls to endQuiz
  if (isEndingQuiz) {
    console.log("⚠️ endQuiz already in progress, skipping");
    return;
  }
  isEndingQuiz = true;
  
  console.log(`🏁 endQuiz called. Final wrongAnswers count: ${wrongAnswers.length}`);
  console.log(`   Final wrongAnswers list:`, JSON.stringify(wrongAnswers, null, 2));
  
  stopMinigames();
  quizActive = false;
  setQuizActive(false);
  hidePauseOverlay();
  getEl("quizContent").style.display = "none";
  getEl("resultsScreen").style.display = "block";
  getEl("finalScore").textContent = Math.floor(score);
  getEl("finalFailures").textContent = failures;
  getEl("finalTabs").textContent = tabSwitches;

  console.log(`🎯 Quiz ended. Wrong answers count: ${wrongAnswers.length}`);
  
  let aiFeedbackText = "";
  if (wrongAnswers.length > 0) {
    const feedbackBox = getEl("aiFeedbackResults");
    if (feedbackBox) {
      feedbackBox.style.display = "block";
      feedbackBox.innerHTML = "🤔 AI is analyzing your answers... Please wait.";
    }
    
    try {
      aiFeedbackText = await requestAiFeedback(wrongAnswers);
      console.log("🎉 AI feedback generated successfully");
      showAiFeedback(aiFeedbackText);
    } catch (error) {
      console.error("AI failed:", error);
      const manualFeedback = buildManualFeedback(wrongAnswers);
      showAiFeedback(manualFeedback);
    }
  } else {
    console.log("⚠️ No wrong answers recorded!");
    // Double-check: If score is not 100 but no wrong answers, something is wrong
    if (Math.floor(score) < 100) {
      console.warn("⚠️ Score is not 100 but no wrong answers recorded - this shouldn't happen!");
      showAiFeedback("⚠️ Quiz completed. Please check your results carefully. Contact support if you see this message.");
    } else {
      showAiFeedback("🎉 PERFECT SCORE! 🎉\n\nExcellent work! You answered every question correctly.");
    }
  }
  
  await saveQuizResults();
  addLog(`Quiz finished. Score: ${Math.floor(score)}/100, Wrong answers: ${wrongAnswers.length}`);
  
  // Reset flag for next quiz
  setTimeout(() => {
    isEndingQuiz = false;
  }, 1000);
}

export function returnToHome() {
  stopMinigames();
  quizActive = false;
  setQuizActive(false);
  hidePauseOverlay();
  getEl("quizApp").style.display = "none";
  getEl("homeScreen").style.display = "flex";
  isEndingQuiz = false;
  addLog("Returned home.");
}
