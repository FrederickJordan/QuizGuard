const questions = [
  {
    question: "Which data structure provides FIFO behavior?",
    answers: ["Stack", "Queue", "Tree", "Graph"],
    correct: 1
  },
  {
    question: "Which protocol is primarily used for secure web communication?",
    answers: ["HTTP", "FTP", "SMTP", "HTTPS"],
    correct: 3
  },
  {
    question: "What is the time complexity of binary search?",
    answers: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: 1
  }
];

let currentQuestion = 0;
let score = 0;
let penalties = 0;
let tabSwitches = 0;
let failures = 0;

const PENALTY_AMOUNT = 0.5;

const gameMode = Math.random() < 0.5 ? "cups" : "qte";

const questionText = document.getElementById("questionText");
const questionNumber = document.getElementById("questionNumber");
const answersContainer = document.getElementById("answersContainer");

const scoreEl = document.getElementById("score");
const penaltiesEl = document.getElementById("penalties");
const tabSwitchEl = document.getElementById("tabSwitches");

const gameArea = document.getElementById("gameArea");
const logArea = document.getElementById("logArea");
const tabWarning = document.getElementById("tabWarning");

function addLog(message) {
  const time = new Date().toLocaleTimeString();

  const entry = document.createElement("div");
  entry.innerHTML = `<strong>[${time}]</strong> ${message}`;

  logArea.prepend(entry);

  while (logArea.children.length > 10) {
    logArea.removeChild(logArea.lastChild);
  }
}

function loadQuestion() {

  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }

  const q = questions[currentQuestion];

  questionNumber.textContent =
    `Question ${currentQuestion + 1} / ${questions.length}`;

  questionText.textContent = q.question;

  answersContainer.innerHTML = "";

  q.answers.forEach((answer, index) => {

    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = answer;

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

    answersContainer.appendChild(btn);
  });
}

function updateStats() {
  scoreEl.textContent = Math.max(score - penalties, 0).toFixed(1);
  penaltiesEl.textContent = penalties.toFixed(1);
  tabSwitchEl.textContent = tabSwitches;
}

function applyPenalty(reason) {
  penalties += PENALTY_AMOUNT;
  failures++;

  updateStats();
  addLog(`Penalty: ${reason}`);
}

function endQuiz() {
  document.getElementById("quizContent").style.display = "none";
  document.getElementById("resultsScreen").style.display = "block";

  document.getElementById("finalScore").textContent =
    Math.max(score - penalties, 0).toFixed(1);

  document.getElementById("finalFailures").textContent = failures;
  document.getElementById("finalTabs").textContent = tabSwitches;
  document.getElementById("finalPenalty").textContent = penalties.toFixed(1);
}

["copy", "paste", "cut"].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    e.preventDefault();
    addLog(`${eventName.toUpperCase()} blocked.`);
  });
});

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

// CUP GAME
let cupBallIndex = 0;
let cupTimeout;

function startCupGame() {

  gameArea.innerHTML = `
    <div>
      <h2>Find the Ball</h2>
      <div class="cups-container" id="cupsContainer"></div>
    </div>
  `;

  const container = document.getElementById("cupsContainer");

  for (let i = 0; i < 3; i++) {

    const cup = document.createElement("div");
    cup.className = "cup";

    cup.addEventListener("click", () => handleCupClick(i));

    container.appendChild(cup);
  }

  shuffleBall();
}

function shuffleBall() {

  const cups = document.querySelectorAll(".cup");

  cups.forEach(c => {
    c.innerHTML = "";
  });

  cupBallIndex = Math.floor(Math.random() * 3);

  const ball = document.createElement("div");
  ball.className = "ball";

  cups[cupBallIndex].appendChild(ball);

  clearTimeout(cupTimeout);

  cupTimeout = setTimeout(() => {
    applyPenalty("Missed cup response");
    shuffleBall();
  }, 5000);
}

function handleCupClick(index) {

  if (index === cupBallIndex) {
    addLog("Cup game success.");
  } else {
    applyPenalty("Wrong cup selected");
  }

  shuffleBall();
}

// QTE GAME
let gauge = 100;
let targetKey = "A";
let qteLoop;
let qteSuccessCount = 0;

function startQTEGame() {

  gameArea.innerHTML = `
    <div class="qte-container">

      <div class="target-key" id="targetKey">A</div>

      <div class="gauge-box">
        <div class="gauge-fill" id="gaugeFill"></div>
      </div>

    </div>
  `;

  targetKey = randomLetter();
  document.getElementById("targetKey").textContent = targetKey;

  qteLoop = setInterval(() => {

    gauge -= 1.2;

    document.getElementById("gaugeFill").style.width = gauge + "%";

    if (gauge <= 0) {
      gauge = 100;
      applyPenalty("QTE gauge emptied");
    }

  }, 100);
}

function randomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

document.addEventListener("keydown", (e) => {

  if (gameMode !== "qte") return;

  if (e.key.toUpperCase() === targetKey) {

    gauge += 10;

    if (gauge > 100) gauge = 100;

    qteSuccessCount++;

    if (qteSuccessCount >= 5) {

      qteSuccessCount = 0;

      targetKey = randomLetter();

      document.getElementById("targetKey").textContent = targetKey;
    }
  }
});

updateStats();
loadQuestion();

if (gameMode === "cups") {
  startCupGame();
} else {
  startQTEGame();
}
