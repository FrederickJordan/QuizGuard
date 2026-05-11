/* ==========================================
   QuizGuard – Final Version
   – No back button during active quiz
   – Quiz reset properly hides results screen
   – Tab minimize/switch applies penalty
   ========================================== */

// ---------- QUESTION BANK (full 5 per difficulty) ----------
const questionBank = {
  math: {
    easy: [
      { question: "What is 12 × 8?", answers: ["96", "88", "108", "84"], correct: 0 },
      { question: "What is 15 + 27?", answers: ["42", "32", "52", "41"], correct: 0 },
      { question: "What is 100 ÷ 4?", answers: ["25", "20", "30", "40"], correct: 0 },
      { question: "What is the square root of 81?", answers: ["9", "7", "8", "10"], correct: 0 },
      { question: "What is 7 × 6?", answers: ["42", "36", "48", "54"], correct: 0 }
    ],
    medium: [
      { question: "What is the derivative of x³?", answers: ["3x²", "x²", "2x²", "3x"], correct: 0 },
      { question: "If 2x + 5 = 13, what is x?", answers: ["4", "3", "5", "6"], correct: 0 },
      { question: "What is 15% of 200?", answers: ["30", "20", "40", "15"], correct: 0 },
      { question: "What is the area of a circle with radius 3?", answers: ["9π", "6π", "3π", "12π"], correct: 0 },
      { question: "What is the value of 2³ + 3²?", answers: ["17", "13", "15", "19"], correct: 0 }
    ],
    hard: [
      { question: "What is the integral of 2x dx?", answers: ["x² + C", "2x² + C", "x + C", "x²"], correct: 0 },
      { question: "Solve for x: log₂(x) + log₂(x-2) = 3", answers: ["4", "2", "6", "8"], correct: 0 },
      { question: "What is the determinant of [[1,2],[3,4]]?", answers: ["-2", "2", "5", "-5"], correct: 0 },
      { question: "What is the sum of the first 10 prime numbers?", answers: ["129", "127", "131", "125"], correct: 0 },
      { question: "What is the limit of (sin x)/x as x → 0?", answers: ["1", "0", "∞", "undefined"], correct: 0 }
    ]
  },
  english: {
    easy: [
      { question: "Choose the synonym of 'rapid'.", answers: ["Fast", "Slow", "Weak", "Calm"], correct: 0 },
      { question: "What is the antonym of 'begin'?", answers: ["End", "Start", "Open", "Launch"], correct: 0 },
      { question: "Which word is a noun?", answers: ["Happiness", "Run", "Quickly", "Blue"], correct: 0 },
      { question: "What is the past tense of 'go'?", answers: ["Went", "Gone", "Goed", "Going"], correct: 0 },
      { question: "What is the plural of 'child'?", answers: ["Children", "Childs", "Childes", "Child's"], correct: 0 }
    ],
    medium: [
      { question: "Choose the correct spelling:", answers: ["Accommodate", "Acommodate", "Accomodate", "Acomodate"], correct: 0 },
      { question: "What is the meaning of 'benevolent'?", answers: ["Kind", "Cruel", "Angry", "Lazy"], correct: 0 },
      { question: "Which sentence uses the semicolon correctly?", answers: ["I have a test; I need to study.", "I have a test, I need to study.", "I have a test: I need to study.", "I have a test I need to study."], correct: 0 },
      { question: "What is the literary device in 'the wind whispered'?", answers: ["Personification", "Simile", "Metaphor", "Alliteration"], correct: 0 },
      { question: "What is a synonym for 'eloquent'?", answers: ["Persuasive", "Silent", "Boring", "Rude"], correct: 0 }
    ],
    hard: [
      { question: "What is the correct definition of 'obsequious'?", answers: ["Excessively obedient", "Angry", "Indifferent", "Cheerful"], correct: 0 },
      { question: "Which author wrote 'Paradise Lost'?", answers: ["John Milton", "William Shakespeare", "Geoffrey Chaucer", "Jane Austen"], correct: 0 },
      { question: "What is the term for a word that imitates a sound?", answers: ["Onomatopoeia", "Alliteration", "Assonance", "Consonance"], correct: 0 },
      { question: "What is the main theme of 'The Great Gatsby'?", answers: ["The American Dream", "War", "Love", "Revenge"], correct: 0 },
      { question: "What is a 'sonnet'?", answers: ["14-line poem", "5-line poem", "Novel", "Short story"], correct: 0 }
    ]
  },
  computer_science: {
    easy: [
      { question: "Which data structure uses FIFO?", answers: ["Queue", "Stack", "Tree", "Graph"], correct: 0 },
      { question: "What does CPU stand for?", answers: ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Core Processing Unit"], correct: 0 },
      { question: "What is the extension of a Python file?", answers: [".py", ".java", ".cpp", ".html"], correct: 0 },
      { question: "Which operator is used for equality in JavaScript?", answers: ["===", "=", "==", "!=="], correct: 0 },
      { question: "What does HTML stand for?", answers: ["HyperText Markup Language", "HighText Markup Language", "Hyper Transfer Markup Language", "HyperText Machine Language"], correct: 0 }
    ],
    medium: [
      { question: "What does 'HTTP' stand for?", answers: ["HyperText Transfer Protocol", "Hyper Transfer Text Protocol", "High Transfer Text Protocol", "HyperText Transfer Program"], correct: 0 },
      { question: "Which sorting algorithm has the best average time complexity?", answers: ["Quicksort", "Bubble sort", "Insertion sort", "Selection sort"], correct: 0 },
      { question: "What is an example of a NoSQL database?", answers: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"], correct: 0 },
      { question: "What is the time complexity of binary search?", answers: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correct: 0 },
      { question: "What does API stand for?", answers: ["Application Programming Interface", "Application Program Interface", "Applied Programming Interface", "Application Process Interface"], correct: 0 }
    ],
    hard: [
      { question: "What is the primary purpose of a mutex?", answers: ["Prevent race conditions", "Speed up execution", "Allocate memory", "Handle exceptions"], correct: 0 },
      { question: "What is the worst-case time complexity of quicksort?", answers: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], correct: 0 },
      { question: "What is a Turing machine?", answers: ["Mathematical model of computation", "A type of computer", "A programming language", "A CPU architecture"], correct: 0 },
      { question: "What is the output of 'print(2**3)' in Python?", answers: ["8", "6", "9", "5"], correct: 0 },
      { question: "What is a closure in JavaScript?", answers: ["Function with access to outer scope", "A loop", "An object", "A class"], correct: 0 }
    ]
  },
  science: {
    easy: [
      { question: "What planet is called the Red Planet?", answers: ["Mars", "Venus", "Mercury", "Saturn"], correct: 0 },
      { question: "What is the hardest natural substance?", answers: ["Diamond", "Gold", "Iron", "Platinum"], correct: 0 },
      { question: "What gas do plants absorb?", answers: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: 0 },
      { question: "What is the boiling point of water at sea level?", answers: ["100°C", "90°C", "110°C", "80°C"], correct: 0 },
      { question: "What is the fastest land animal?", answers: ["Cheetah", "Lion", "Leopard", "Horse"], correct: 0 }
    ],
    medium: [
      { question: "What is the pH of pure water?", answers: ["7", "0", "14", "5"], correct: 0 },
      { question: "What is the process by which plants make food?", answers: ["Photosynthesis", "Respiration", "Fermentation", "Digestion"], correct: 0 },
      { question: "Which organ pumps blood throughout the human body?", answers: ["Heart", "Brain", "Liver", "Lungs"], correct: 0 },
      { question: "What is the unit of force?", answers: ["Newton", "Joule", "Watt", "Pascal"], correct: 0 },
      { question: "What is the most abundant gas in Earth's atmosphere?", answers: ["Nitrogen", "Oxygen", "Argon", "Carbon dioxide"], correct: 0 }
    ],
    hard: [
      { question: "What is the first law of thermodynamics?", answers: ["Energy conservation", "Entropy increases", "Absolute zero", "Pressure temperature relation"], correct: 0 },
      { question: "What is the chemical symbol for Gold?", answers: ["Au", "Ag", "Fe", "Pb"], correct: 0 },
      { question: "What is the powerhouse of the cell?", answers: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"], correct: 0 },
      { question: "What is the speed of light in vacuum (approx)?", answers: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁵ m/s"], correct: 0 },
      { question: "What is the main component of the Sun?", answers: ["Hydrogen", "Helium", "Oxygen", "Carbon"], correct: 0 }
    ]
  }
};

// GLOBALS
let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let gameMode = "cups";
const PENALTY_AMOUNT = 0.5;

// Cup game
let cupShuffleInterval = null;
let cupTimerInterval = null;
let cupBallIndex = 0;
let cupGauge = 100;
let cupGaugeDecrement = 2;

// QTE game
let qteInterval = null;
let qteGauge = 100;
let targetKey = "A";

// Helper
function getEl(id) { return document.getElementById(id); }

// Logging
function addLog(message) {
  const logArea = getEl("logArea");
  if (!logArea) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.innerHTML = `<strong>[${time}]</strong> ${message}`;
  logArea.prepend(entry);
  while (logArea.children.length > 10) logArea.removeChild(logArea.lastChild);
}

// Cleanup & return home
function cleanupAndReturnHome() {
  if (cupShuffleInterval) clearInterval(cupShuffleInterval);
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  if (qteInterval) clearInterval(qteInterval);
  getEl("quizApp").style.display = "none";
  getEl("homeScreen").style.display = "flex";
  addLog("Returned to home screen.");
}
window.returnToHome = cleanupAndReturnHome;

// Apply penalty
function applyPenalty(reason) {
  penalties += PENALTY_AMOUNT;
  failures++;
  updateStats();
  addLog(`Penalty applied: ${reason}`);
}

function updateStats() {
  getEl("score").textContent = Math.max(score - penalties, 0).toFixed(1);
  getEl("penalties").textContent = penalties.toFixed(1);
  getEl("tabSwitches").textContent = tabSwitches;
}

// Tab switch detection – now applies penalty when hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden && getEl("quizApp").style.display === "flex") {
    tabSwitches++;
    applyPenalty("Tab switched/minimised");
    getEl("tabWarning").style.display = "flex";
    addLog("Tab switch detected – penalty applied.");
    setTimeout(() => {
      if (getEl("tabWarning")) getEl("tabWarning").style.display = "none";
    }, 2000);
  } else {
    if (getEl("tabWarning")) getEl("tabWarning").style.display = "none";
  }
});

// Block copy/paste
["copy", "paste", "cut"].forEach(ev => {
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    addLog(`${ev} blocked`);
  });
});

// ---------- QUIZ CORE ----------
function startQuizApp() {
  const subject = getEl("subjectSelect").value;
  const difficulty = getEl("difficultySelect").value;
  const selected = getEl("minigameSelect").value;

  questions = questionBank[subject][difficulty];
  if (!questions || questions.length === 0) {
    alert("No questions for this subject/difficulty.");
    return;
  }

  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;

  if (selected === "random") gameMode = Math.random() < 0.5 ? "cups" : "qte";
  else gameMode = selected;

  // Reset UI: hide results, show quiz content
  getEl("quizContent").style.display = "block";
  getEl("resultsScreen").style.display = "none";

  getEl("homeScreen").style.display = "none";
  getEl("quizApp").style.display = "flex";
  updateStats();
  loadQuestion();

  if (gameMode === "cups") startCupGame();
  else startQTEGame();

  addLog(`Quiz started: ${subject} - ${difficulty} | ${gameMode}`);
}

function loadQuestion() {
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }
  const q = questions[currentQuestion];
  getEl("questionNumber").textContent = `Question ${currentQuestion+1} / ${questions.length}`;
  getEl("questionText").textContent = q.question;
  const container = getEl("answersContainer");
  container.innerHTML = "";
  q.answers.forEach((ans, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = ans;
    btn.addEventListener("click", () => {
      if (idx === q.correct) {
        score += 2;
        addLog("Correct answer.");
      } else {
        addLog("Wrong answer.");
      }
      updateStats();
      currentQuestion++;
      loadQuestion();
    });
    container.appendChild(btn);
  });
}

function endQuiz() {
  if (cupShuffleInterval) clearInterval(cupShuffleInterval);
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  if (qteInterval) clearInterval(qteInterval);
  getEl("quizContent").style.display = "none";
  getEl("resultsScreen").style.display = "block";
  getEl("finalScore").textContent = Math.max(score - penalties, 0).toFixed(1);
  getEl("finalFailures").textContent = failures;
  getEl("finalTabs").textContent = tabSwitches;
  addLog("Quiz finished.");
}

// ---------- CUP GAME (gauge bar) ----------
function startCupGame() {
  getEl("gameTitle").textContent = "Find The Ball (Pressure Gauge)";
  getEl("gameDescription").textContent = "Click the correct cup before the gauge empties! Correct click refills gauge.";
  getEl("gameArea").innerHTML = `
    <div class="cups-container" id="cupsContainer"></div>
    <div class="gauge-box"><div class="gauge-fill" id="cupGaugeFill"></div></div>
    <div style="text-align:center; margin-top:5px;">Pressure Gauge</div>
  `;
  const container = getEl("cupsContainer");
  for (let i=0; i<3; i++) {
    const cup = document.createElement("div");
    cup.className = "cup";
    cup.addEventListener("click", () => handleCupClick(i));
    container.appendChild(cup);
  }
  shuffleBall();
  if (cupShuffleInterval) clearInterval(cupShuffleInterval);
  cupShuffleInterval = setInterval(() => shuffleBall(), 5000);
  cupGauge = 100;
  const fill = getEl("cupGaugeFill");
  if (fill) fill.style.width = "100%";
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  cupTimerInterval = setInterval(() => {
    if (getEl("quizApp").style.display !== "flex") return;
    cupGauge -= cupGaugeDecrement;
    if (cupGauge < 0) cupGauge = 0;
    const fillEl = getEl("cupGaugeFill");
    if (fillEl) fillEl.style.width = cupGauge + "%";
    if (cupGauge <= 0) {
      applyPenalty("Cup gauge emptied (no correct click)");
      cupGauge = 100;
      if (fillEl) fillEl.style.width = "100%";
      shuffleBall();
    }
  }, 100);
}

function handleCupClick(index) {
  if (index === cupBallIndex) {
    cupGauge = 100;
    const fill = getEl("cupGaugeFill");
    if (fill) fill.style.width = "100%";
    addLog("Correct cup – gauge refilled.");
    shuffleBall();
  } else {
    applyPenalty("Wrong cup selected");
    cupGauge = 100;
    const fill = getEl("cupGaugeFill");
    if (fill) fill.style.width = "100%";
    shuffleBall();
  }
}

function shuffleBall() {
  const cups = document.querySelectorAll(".cup");
  cups.forEach(cup => cup.innerHTML = "");
  cupBallIndex = Math.floor(Math.random() * 3);
  const ball = document.createElement("div");
  ball.className = "ball";
  cups[cupBallIndex].appendChild(ball);
  addLog(`Ball moved to cup ${cupBallIndex+1}`);
}

// ---------- QTE GAME ----------
function startQTEGame() {
  getEl("gameTitle").textContent = "QTE Pressure Gauge";
  getEl("gameDescription").textContent = "Press the correct key to keep the gauge alive!";
  getEl("gameArea").innerHTML = `
    <div class="qte-container">
      <div class="target-key" id="targetKey">A</div>
      <div class="gauge-box"><div class="gauge-fill" id="qteGaugeFill"></div></div>
    </div>
  `;
  targetKey = randomLetter();
  getEl("targetKey").textContent = targetKey;
  qteGauge = 100;
  const fill = getEl("qteGaugeFill");
  if (fill) fill.style.width = "100%";
  if (qteInterval) clearInterval(qteInterval);
  qteInterval = setInterval(() => {
    if (getEl("quizApp").style.display !== "flex") return;
    qteGauge -= 0.2;
    if (qteGauge < 0) qteGauge = 0;
    const fillEl = getEl("qteGaugeFill");
    if (fillEl) fillEl.style.width = qteGauge + "%";
    if (qteGauge <= 0) {
      applyPenalty("QTE gauge emptied");
      qteGauge = 100;
      if (fillEl) fillEl.style.width = "100%";
      targetKey = randomLetter();
      const targetEl = getEl("targetKey");
      if (targetEl) targetEl.textContent = targetKey;
    }
  }, 100);
}

function randomLetter() {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

document.addEventListener("keydown", (e) => {
  if (getEl("quizApp").style.display !== "flex") return;
  if (gameMode !== "qte") return;
  if (e.key.toUpperCase() === targetKey) {
    qteGauge = Math.min(100, qteGauge + 35);
    const fill = getEl("qteGaugeFill");
    if (fill) fill.style.width = qteGauge + "%";
    targetKey = randomLetter();
    const targetEl = getEl("targetKey");
    if (targetEl) targetEl.textContent = targetKey;
    addLog(`Correct key: ${e.key.toUpperCase()}`);
  }
});

// ---------- EDITOR (unchanged, works with difficulty) ----------
function openQuestionEditor() {
  getEl("homeScreen").style.display = "none";
  getEl("editorScreen").style.display = "block";
  renderQuestionEditor();
}
function closeQuestionEditor() {
  getEl("editorScreen").style.display = "none";
  getEl("homeScreen").style.display = "flex";
}
function renderQuestionEditor() {
  const subject = getEl("editorSubjectSelect").value;
  const difficulty = getEl("editorDifficultySelect").value;
  const container = getEl("questionEditorList");
  container.innerHTML = "";
  const qs = questionBank[subject][difficulty];
  if (!qs) return;
  qs.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "question-edit-card";
    div.innerHTML = `
      <input type="text" value="${escapeHtml(q.question)}" data-field="question" data-index="${idx}">
      <input type="text" value="${escapeHtml(q.answers[0])}" data-answer="0" data-index="${idx}">
      <input type="text" value="${escapeHtml(q.answers[1])}" data-answer="1" data-index="${idx}">
      <input type="text" value="${escapeHtml(q.answers[2])}" data-answer="2" data-index="${idx}">
      <input type="text" value="${escapeHtml(q.answers[3])}" data-answer="3" data-index="${idx}">
      <input type="number" value="${q.correct}" min="0" max="3" data-correct data-index="${idx}">
    `;
    container.appendChild(div);
  });
  attachEditorEvents(subject, difficulty);
}
function attachEditorEvents(subject, difficulty) {
  document.querySelectorAll('[data-field]').forEach(inp => {
    inp.removeEventListener('change', () => {});
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.index);
      questionBank[subject][difficulty][idx].question = inp.value;
      addLog("Question updated");
    });
  });
  document.querySelectorAll('[data-answer]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.index);
      const ansIdx = parseInt(inp.dataset.answer);
      questionBank[subject][difficulty][idx].answers[ansIdx] = inp.value;
      addLog("Answer updated");
    });
  });
  document.querySelectorAll('[data-correct]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.index);
      questionBank[subject][difficulty][idx].correct = parseInt(inp.value);
      addLog("Correct answer index updated");
    });
  });
}
function addNewQuestion() {
  const subject = getEl("editorSubjectSelect").value;
  const difficulty = getEl("editorDifficultySelect").value;
  const qText = getEl("newQuestionText").value;
  const answers = [getEl("answer1").value, getEl("answer2").value, getEl("answer3").value, getEl("answer4").value];
  const correct = parseInt(getEl("correctAnswer").value);
  if (!qText || answers.some(a => !a) || isNaN(correct)) { alert("Fill all fields"); return; }
  questionBank[subject][difficulty].push({ question: qText, answers, correct });
  renderQuestionEditor();
  addLog("New question added");
  getEl("newQuestionText").value = "";
  getEl("answer1").value = ""; getEl("answer2").value = ""; getEl("answer3").value = ""; getEl("answer4").value = "";
  getEl("correctAnswer").value = "";
}
function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m])); }
