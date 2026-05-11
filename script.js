const questionBank = {

  math: [
    {
      question: "What is 12 × 8?",
      answers: ["96", "88", "108", "84"],
      correct: 0
    },
    {
      question: "What is the derivative of x²?",
      answers: ["x", "2x", "x²", "2"],
      correct: 1
    }
  ],

  english: [
    {
      question: "Choose the synonym of rapid.",
      answers: ["Slow", "Fast", "Weak", "Calm"],
      correct: 1
    }
  ],

  computer_science: [
    {
      question: "Which data structure uses FIFO?",
      answers: ["Stack", "Queue", "Tree", "Graph"],
      correct: 1
    }
  ],

  science: [
    {
      question: "What planet is called the Red Planet?",
      answers: ["Mars", "Venus", "Mercury", "Saturn"],
      correct: 0
    }
  ]
};

let questions = [];

let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;

let gameMode = "cups";

const PENALTY_AMOUNT = 0.5;

/* ================================= */
/* HELPER */
/* ================================= */

function getEl(id) {
  return document.getElementById(id);
}

/* ================================= */
/* LOG SYSTEM */
/* ================================= */

function addLog(message) {

  const logArea = getEl("logArea");

  if (!logArea) return;

  const time =
    new Date().toLocaleTimeString();

  const entry =
    document.createElement("div");

  entry.innerHTML =
    `<strong>[${time}]</strong> ${message}`;

  logArea.prepend(entry);

  while (logArea.children.length > 10) {
    logArea.removeChild(logArea.lastChild);
  }
}

/* ================================= */
/* HOME SCREEN */
/* ================================= */

function startQuizApp() {

  const subject =
    getEl("subjectSelect").value;

  const selectedMinigame =
    getEl("minigameSelect").value;

  questions = questionBank[subject];

  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;

  if (selectedMinigame === "random") {

    gameMode =
      Math.random() < 0.5 ? "cups" : "qte";

  } else {

    gameMode = selectedMinigame;
  }

  getEl("homeScreen").style.display = "none";

  getEl("quizApp").style.display = "flex";

  updateStats();

  loadQuestion();

  if (gameMode === "cups") {
    startCupGame();
  } else {
    startQTEGame();
  }

  addLog("Quiz started.");
}

function openQuestionEditor() {

  getEl("homeScreen").style.display = "none";

  getEl("editorScreen").style.display = "block";

  renderQuestionEditor();
}

function closeQuestionEditor() {

  getEl("editorScreen").style.display = "none";

  getEl("homeScreen").style.display = "flex";
}

/* ================================= */
/* QUESTION EDITOR */
/* ================================= */

function renderQuestionEditor() {

  const subject =
    getEl("editorSubjectSelect").value;

  const container =
    getEl("questionEditorList");

  container.innerHTML = "";

  questionBank[subject].forEach((q, index) => {

    const div =
      document.createElement("div");

    div.className =
      "question-edit-card";

    div.innerHTML = `

      <input type="text"
             value="${q.question}"
             onchange="updateQuestion('${subject}', ${index}, 'question', this.value)">

      <input type="text"
             value="${q.answers[0]}"
             onchange="updateAnswer('${subject}', ${index}, 0, this.value)">

      <input type="text"
             value="${q.answers[1]}"
             onchange="updateAnswer('${subject}', ${index}, 1, this.value)">

      <input type="text"
             value="${q.answers[2]}"
             onchange="updateAnswer('${subject}', ${index}, 2, this.value)">

      <input type="text"
             value="${q.answers[3]}"
             onchange="updateAnswer('${subject}', ${index}, 3, this.value)">

      <input type="number"
             value="${q.correct}"
             min="0"
             max="3"
             onchange="updateQuestion('${subject}', ${index}, 'correct', parseInt(this.value))">

    `;

    container.appendChild(div);
  });
}

function updateQuestion(subject, index, field, value) {

  questionBank[subject][index][field] =
    value;

  addLog("Question updated.");
}

function updateAnswer(subject, index, answerIndex, value) {

  questionBank[subject][index]
    .answers[answerIndex] = value;

  addLog("Answer updated.");
}

function addNewQuestion() {

  const subject =
    getEl("editorSubjectSelect").value;

  const question =
    getEl("newQuestionText").value;

  const answers = [

    getEl("answer1").value,
    getEl("answer2").value,
    getEl("answer3").value,
    getEl("answer4").value

  ];

  const correct =
    parseInt(getEl("correctAnswer").value);

  questionBank[subject].push({
    question,
    answers,
    correct
  });

  renderQuestionEditor();

  addLog("New question added.");

  getEl("newQuestionText").value = "";
  getEl("answer1").value = "";
  getEl("answer2").value = "";
  getEl("answer3").value = "";
  getEl("answer4").value = "";
  getEl("correctAnswer").value = "";
}

/* ================================= */
/* QUIZ SYSTEM */
/* ================================= */

function loadQuestion() {

  if (currentQuestion >= questions.length) {

    endQuiz();

    return;
  }

  const q =
    questions[currentQuestion];

  getEl("questionNumber").textContent =
    `Question ${currentQuestion + 1} / ${questions.length}`;

  getEl("questionText").textContent =
    q.question;

  getEl("answersContainer").innerHTML = "";

  q.answers.forEach((answer, index) => {

    const btn =
      document.createElement("button");

    btn.className =
      "answer-btn";

    btn.textContent =
      answer;

    btn.addEventListener("click", () => {

      if (index === q.correct) {

        score += 2;

        addLog("Correct answer selected.");

      } else {

        addLog("Wrong answer selected.");
      }

      updateStats();

      currentQuestion++;

      loadQuestion();
    });

    getEl("answersContainer")
      .appendChild(btn);
  });
}

function updateStats() {

  getEl("score").textContent =
    Math.max(score - penalties, 0).toFixed(1);

  getEl("penalties").textContent =
    penalties.toFixed(1);

  getEl("tabSwitches").textContent =
    tabSwitches;
}

function applyPenalty(reason) {

  penalties += PENALTY_AMOUNT;

  failures++;

  updateStats();

  addLog(`Penalty applied: ${reason}`);
}

function endQuiz() {

  getEl("quizContent").style.display =
    "none";

  getEl("resultsScreen").style.display =
    "block";

  getEl("finalScore").textContent =
    Math.max(score - penalties, 0).toFixed(1);

  getEl("finalFailures").textContent =
    failures;

  getEl("finalTabs").textContent =
    tabSwitches;

  addLog("Quiz completed.");
}

/* ================================= */
/* BLOCK COPY PASTE */
/* ================================= */

["copy", "paste", "cut"].forEach(eventName => {

  document.addEventListener(eventName, (e) => {

    e.preventDefault();

    addLog(`${eventName} blocked`);
  });
});

/* ================================= */
/* TAB SWITCH DETECTION */
/* ================================= */

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    tabSwitches++;

    updateStats();

    getEl("tabWarning").style.display =
      "flex";

    addLog("Tab switch detected.");

  } else {

    getEl("tabWarning").style.display =
      "none";
  }
});

/* ================================= */
/* CUP GAME */
/* ================================= */

let cupBallIndex = 0;

function startCupGame() {

  getEl("gameTitle").textContent =
    "Find The Ball";

  getEl("gameDescription").textContent =
    "Track the correct cup continuously while answering questions.";

  getEl("gameArea").innerHTML = `

    <div>

      <div class="cups-container"
           id="cupsContainer">
      </div>

    </div>

  `;

  const container =
    getEl("cupsContainer");

  for (let i = 0; i < 3; i++) {

    const cup =
      document.createElement("div");

    cup.className = "cup";

    cup.addEventListener("click",
      () => handleCupClick(i));

    container.appendChild(cup);
  }

  shuffleBall();

  setInterval(() => {

    shuffleBall();

  }, 5000);
}

function shuffleBall() {

  const cups =
    document.querySelectorAll(".cup");

  cups.forEach(cup => {
    cup.innerHTML = "";
  });

  cupBallIndex =
    Math.floor(Math.random() * 3);

  const ball =
    document.createElement("div");

  ball.className = "ball";

  cups[cupBallIndex]
    .appendChild(ball);
}

function handleCupClick(index) {

  if (index === cupBallIndex) {

    addLog("Correct cup clicked.");

  } else {

    applyPenalty("Wrong cup selected");
  }

  shuffleBall();
}

/* ================================= */
/* QTE GAME */
/* ================================= */

let gauge = 100;
let targetKey = "A";

function startQTEGame() {

  getEl("gameTitle").textContent =
    "QTE Pressure Gauge";

  getEl("gameDescription").textContent =
    "Press the correct key continuously to keep the gauge alive.";

  getEl("gameArea").innerHTML = `

    <div class="qte-container">

      <div class="target-key"
           id="targetKey">
      </div>

      <div class="gauge-box">

        <div class="gauge-fill"
             id="gaugeFill">
        </div>

      </div>

    </div>

  `;

  targetKey = randomLetter();

  getEl("targetKey").textContent =
    targetKey;

  gauge = 100;

  setInterval(() => {

    gauge -= 1;

    getEl("gaugeFill").style.width =
      gauge + "%";

    if (gauge <= 0) {

      gauge = 100;

      applyPenalty("Gauge emptied");

      targetKey = randomLetter();

      getEl("targetKey").textContent =
        targetKey;
    }

  }, 100);
}

function randomLetter() {

  const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return letters[
    Math.floor(Math.random() * letters.length)
  ];
}

document.addEventListener("keydown", (e) => {

  if (gameMode !== "qte") return;

  if (e.key.toUpperCase() === targetKey) {

    gauge += 12;

    if (gauge > 100) {
      gauge = 100;
    }

    targetKey = randomLetter();

    getEl("targetKey").textContent =
      targetKey;

    addLog(`Correct key pressed: ${e.key.toUpperCase()}`);
  }
});
