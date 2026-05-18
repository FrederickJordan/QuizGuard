import { getEl, addLog, shuffleArray } from './utils.js';
import { questionBank } from './questionBank.js';
import { stopMinigames, startCupGame, startQTEGame, setMinigameQuizPaused, setApplyPenaltyCallback } from './minigames.js';
import { requestFullscreenMode, setQuizActive, setQuizPaused, hidePauseOverlay, setPendingFailureCallback, setMinigamePauseCallback, resetFullscreenExitAttempts } from './anticheat.js';

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

function showAiFeedback(text) {
  const feedbackBox = getEl("aiFeedback");
  if (!feedbackBox) return;
  feedbackBox.style.display = "block";
  feedbackBox.textContent = text;
}

function clearAiFeedback() {
  const feedbackBox = getEl("aiFeedback");
  if (!feedbackBox) return;
  feedbackBox.style.display = "none";
  feedbackBox.textContent = "";
}

async function requestAiFeedback(wrongAnswers) {
  const response = await fetch("https://quizguardslave.17fjsetiawan.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ wrongAnswers })
  });

  if (!response.ok) {
    throw new Error(`AI endpoint error ${response.status}`);
  }

  const data = await response.json();
  return data.feedback || "AI feedback is unavailable right now.";
}

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
  if (currentQuestion >= questions.length) return;
  failures++;
  pendingFailure = true;
  addLog(`Question failed: ${reason}`);
}

export function startQuiz() {
  if (!questionBank) {
    alert("Question bank not ready. Please wait.");
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
  questions = shuffleArray(qlist);
  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;
  wrongAnswers = [];
  pointsPerCorrect = 100 / questions.length;
  if (isNaN(pointsPerCorrect)) pointsPerCorrect = 10;
  resetFullscreenExitAttempts();

  let gameMode;
  if (selected === "random") gameMode = Math.random() < 0.5 ? "cups" : "qte";
  else gameMode = selected;

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
  addLog(`Quiz start: ${subject} ${difficulty} (${questions.length} q)`);
}

export function loadQuestion() {
  if (pendingFailure) {
    pendingFailure = false;
    currentQuestion++;
  }
  if (currentQuestion >= questions.length) {
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
      // Remove previous selection
      const prevSelected = container.querySelector(".selected-answer");
      if (prevSelected) prevSelected.classList.remove("selected-answer");
      // Mark this answer as selected
      btn.classList.add("selected-answer");
      selectedAnswerIndex = idx;
      // Enable submit button
      getEl("submitAnswerBtn").disabled = false;
    });
    container.appendChild(btn);
  });

  // Setup submit button
  const submitBtn = getEl("submitAnswerBtn");
  submitBtn.disabled = true;
  submitBtn.onclick = () => {
    if (selectedAnswerIndex === null) return;
    
        if (selectedAnswerIndex === correctIndex) {
      score += pointsPerCorrect;
      if (score > 100) score = 100;
      addLog(`Correct +${pointsPerCorrect.toFixed(1)} → ${Math.floor(score)}`);
    } else {
      addLog("Wrong answer.");
      wrongAnswers.push({
        question: q.question,
        selectedAnswer: answerOptions[selectedAnswerIndex].text,
        correctAnswer: answerOptions[correctIndex].text
      });
    }
    updateStats();
    currentQuestion++;
    loadQuestion();
  };

  window.loadQuestion = loadQuestion;
}

export function endQuiz() {
  stopMinigames();
  quizActive = false;
  setQuizActive(false);
  hidePauseOverlay();
  getEl("quizContent").style.display = "none";
  getEl("resultsScreen").style.display = "block";
  getEl("finalScore").textContent = Math.floor(score);
  getEl("finalFailures").textContent = failures;
  getEl("finalTabs").textContent = tabSwitches;

  if (wrongAnswers.length > 0) {
    showAiFeedback("Generating AI feedback for your incorrect answers...");
    requestAiFeedback(wrongAnswers)
      .then((text) => showAiFeedback(text))
      .catch(() => showAiFeedback("Unable to fetch AI feedback right now."));
  } else {
    clearAiFeedback();
  }

  addLog(`Quiz finished. Score: ${Math.floor(score)}/100`);
}

export function returnToHome() {
  stopMinigames();
  quizActive = false;
  setQuizActive(false);
  hidePauseOverlay();
  getEl("quizApp").style.display = "none";
  getEl("homeScreen").style.display = "flex";
  addLog("Returned home.");
}
