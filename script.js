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

/* DOM */

const questionText =
  document.getElementById("questionText");

const questionNumber =
  document.getElementById("questionNumber");

const answersContainer =
  document.getElementById("answersContainer");

const scoreEl =
  document.getElementById("score");

const penaltiesEl =
  document.getElementById("penalties");

const tabSwitchEl =
  document.getElementById("tabSwitches");

const gameArea =
  document.getElementById("gameArea");

const logArea =
  document.getElementById("logArea");

const tabWarning =
  document.getElementById("tabWarning");

/* LOG */

function addLog(message) {

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

/* HOME */

function startQuizApp() {

  const subject =
    document.getElementById("subjectSelect").value;

  const selectedMinigame =
    document.getElementById("minigameSelect").value;

  questions = questionBank[subject];

  if (selectedMinigame === "random") {

    gameMode =
      Math.random() < 0.5 ? "cups" : "qte";

  } else {

    gameMode = selectedMinigame;
  }

  document.getElementById("homeScreen")
    .style.display = "none";

  document.getElementById("quizApp")
    .style.display = "flex";

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

  document.getElementById("homeScreen")
    .style.display = "none";

  document.getElementById("editorScreen")
    .style.display = "block";

  renderQuestionEditor();
}

function closeQuestionEditor() {

  document.getElementById("editorScreen")
    .style.display = "none";

  document.getElementById("homeScreen")
    .style.display = "flex";
}

/* QUESTION EDITOR */

function renderQuestionEditor() {

  const subject =
    document.getElementById("editorSubjectSelect").value;

  const container =
    document.getElementById("questionEditorList");

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
    document.getElementById("editorSubjectSelect").value;

  const question =
    document.getElementById("newQuestionText").value;

  const answers = [

    document.getElementById("answer1").value,
    document.getElementById("answer2").value,
    document.getElementById("answer3").value,
    document.getElementById("answer4").value

  ];

  const correct =
    parseInt(document.getElementById("correctAnswer").value);

  questionBank[subject].push({
    question,
    answers,
    correct
  });

  renderQuestionEditor();

  addLog("New question added.");
}

/* QUIZ */

function loadQuestion() {

  if (currentQuestion >= questions.length) {

    endQuiz();

    return;
  }

  const q =
    questions[currentQuestion];

  questionNumber.textContent =
    `Question ${currentQuestion + 1} / ${questions.length}`;

  questionText.textContent =
    q.question;

  answersContainer.innerHTML = "";

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

        addLog("Correct answer.");

      } else {

        addLog("Wrong answer.");
      }

      updateStats();

      currentQuestion++;

      loadQuestion();
    });

    answersContainer.appendChild(btn);
  });
}

function updateStats() {

  scoreEl.textContent =
    Math.max(score - penalties, 0).toFixed(1);

  penaltiesEl.textContent =
    penalties.toFixed(1);

  tabSwitchEl.textContent =
    tabSwitches;
}

function applyPenalty(reason) {

  penalties += PENALTY_AMOUNT;

  failures++;

  updateStats();

  addLog(`Penalty: ${reason}`);
}

function endQuiz() {

  document.getElementById("quizContent")
    .style.display = "none";

  document.getElementById("resultsScreen")
    .style.display = "block";

  document.getElementById("finalScore")
    .textContent =
    Math.max(score - penalties, 0).toFixed(1);

  document.getElementById("finalFailures")
    .textContent = failures;

  document.getElementById("finalTabs")
    .textContent = tabSwitches;
}

/* BLOCK COPY */

["copy","paste","cut"].forEach(eventName => {

  document.addEventListener(eventName, (e) => {

    e.preventDefault();

    addLog(`${eventName} blocked`);
  });
});

/* TAB SWITCH */

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    tabSwitches++;

    updateStats();

    tabWarning.style.display = "flex";

    addLog("Tab switch detected.");

  } else {

    tabWarning.style.display = "none";
  }
});

/* CUP GAME */

let cupBallIndex = 0;

function startCupGame() {

  document.getElementById("gameTitle")
    .textContent = "Find The Ball";

  document.getElementById("gameDescription")
    .textContent =
    "Track the ball continuously while answering.";

  gameArea.innerHTML = `

    <div>

      <div class="cups-container"
           id="cupsContainer">
      </div>

    </div>

  `;

  const container =
    document.getElementById("cupsContainer");

  for (let i = 0; i < 3; i++) {

    const cup =
      document.createElement("div");

    cup.className = "cup";

    cup.addEventListener("click",
      () => handleCupClick(i));

    container.appendChild(cup);
  }

  shuffleBall();
}

function shuffleBall() {

  const cups =
    document.querySelectorAll(".cup");

  cups.forEach(c => {
    c.innerHTML = "";
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

    applyPenalty("Wrong cup");
  }

  shuffleBall();
}

/* QTE GAME */

let gauge = 100;
let targetKey = "A";

function startQTEGame() {

  document.getElementById("gameTitle")
    .textContent =
    "QTE Pressure Gauge";

  document.getElementById("gameDescription")
    .textContent =
    "Press the correct key continuously.";

  gameArea.innerHTML = `

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

  document.getElementById("targetKey")
    .textContent = targetKey;

  setInterval(() => {

    gauge -= 1;

    document.getElementById("gaugeFill")
      .style.width = gauge + "%";

    if (gauge <= 0) {

      gauge = 100;

      applyPenalty("Gauge emptied");
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

    gauge += 10;

    if (gauge > 100) {
      gauge = 100;
    }

    targetKey = randomLetter();

    document.getElementById("targetKey")
      .textContent = targetKey;
  }
});
