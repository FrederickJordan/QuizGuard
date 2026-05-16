import { getEl, addLog } from './utils.js';
import { questionBank } from './questionBank.js';
import { stopMinigames, startCupGame, startQTEGame, setMinigameQuizPaused, setApplyPenaltyCallback } from './minigames.js';
import { requestFullscreenMode, setQuizActive, setQuizPaused, hidePauseOverlay, setPendingFailureCallback } from './anticheat.js';

let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let pointsPerCorrect = 10;
let quizActive = false;
let pendingFailure = false;

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
  questions = [...qlist];
  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;
  pointsPerCorrect = 100 / questions.length;
  if (isNaN(pointsPerCorrect)) pointsPerCorrect = 10;

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
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }
  const q = questions[currentQuestion];
  getEl("questionNumber").textContent = `Q${currentQuestion+1}/${questions.length}`;
  getEl("questionText").textContent = q.question;
  const container = getEl("answersContainer");
  container.innerHTML = "";
  q.answers.forEach((ans, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = ans;
    btn.addEventListener("click", () => {
      if (getEl("quizApp").style.display !== "flex") return;
      if (idx === q.correct) {
        score += pointsPerCorrect;
        if (score > 100) score = 100;
        addLog(`Correct +${pointsPerCorrect.toFixed(1)} → ${Math.floor(score)}`);
      } else {
        addLog("Wrong answer.");
      }
      updateStats();
      currentQuestion++;
      loadQuestion();
    });
    container.appendChild(btn);
  });
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