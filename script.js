const questionBank = {

  math: {

    easy: [
      { question: "What is 5 + 7?", answers: ["12", "10", "13", "14"], correct: 0 },
      { question: "What is 9 × 3?", answers: ["18", "27", "21", "24"], correct: 1 },
      { question: "What is 81 ÷ 9?", answers: ["7", "8", "9", "6"], correct: 2 },
      { question: "What is 15 - 6?", answers: ["7", "8", "9", "10"], correct: 2 },
      { question: "What is 14 + 5?", answers: ["18", "19", "20", "21"], correct: 1 }
    ],

    medium: [
      { question: "Solve: 12²", answers: ["124", "132", "144", "154"], correct: 2 },
      { question: "Value of π (2dp)?", answers: ["3.12", "3.14", "3.16", "3.18"], correct: 1 },
      { question: "20% of 250?", answers: ["40", "45", "50", "55"], correct: 2 },
      { question: "7 × 8 - 12?", answers: ["44", "46", "48", "50"], correct: 0 },
      { question: "√169?", answers: ["11", "12", "13", "14"], correct: 2 }
    ],

    hard: [
      { question: "Derivative of x²?", answers: ["x", "2x", "x²", "2"], correct: 1 },
      { question: "Integral of 2x?", answers: ["x² + C", "2x² + C", "x + C", "2 + C"], correct: 0 },
      { question: "Solve: 2x + 6 = 18", answers: ["4", "5", "6", "7"], correct: 2 },
      { question: "sin(90°)?", answers: ["0", "0.5", "1", "-1"], correct: 2 },
      { question: "log₁₀(100)?", answers: ["1", "2", "10", "100"], correct: 1 }
    ]
  },

  english: {
    easy: [
      { question: "Correct spelling?", answers: ["Recieve", "Receive", "Receeve", "Receve"], correct: 1 },
      { question: "Synonym of happy?", answers: ["Sad", "Angry", "Joyful", "Weak"], correct: 2 },
      { question: "Opposite of cold?", answers: ["Warm", "Cool", "Wet", "Soft"], correct: 0 },
      { question: "Which is noun?", answers: ["Run", "Beautiful", "Table", "Quickly"], correct: 2 },
      { question: "___ apple", answers: ["A", "An", "The", "None"], correct: 1 }
    ],
    medium: [
      { question: "Synonym of rapid?", answers: ["Slow", "Fast", "Weak", "Calm"], correct: 1 },
      { question: "Adjective?", answers: ["Quickly", "Blue", "Run", "Jump"], correct: 1 },
      { question: "Correct sentence?", answers: ["She go school", "She goes school", "She goes to school", "She going school"], correct: 2 },
      { question: "Past tense of write?", answers: ["Written", "Writing", "Wrote", "Writes"], correct: 2 },
      { question: "Antonym of expand?", answers: ["Increase", "Stretch", "Shrink", "Grow"], correct: 2 }
    ],
    hard: [
      { question: "‘Time is a thief’ is?", answers: ["Simile", "Metaphor", "Hyperbole", "Irony"], correct: 1 },
      { question: "Ubiquitous means?", answers: ["Rare", "Everywhere", "Dangerous", "Hidden"], correct: 1 },
      { question: "Correct punctuation?", answers: ["Lets eat grandma", "Let's eat grandma", "Lets eat, grandma", "Let's eat, grandma"], correct: 3 },
      { question: "Adverb?", answers: ["Beautiful", "Happiness", "Swiftly", "Bright"], correct: 2 },
      { question: "Command sentence?", answers: ["Declarative", "Interrogative", "Imperative", "Exclamatory"], correct: 2 }
    ]
  },

  computer_science: {
    easy: [
      { question: "CPU stands for?", answers: ["Central Process Unit", "Central Processing Unit", "Computer Unit", "Central Power Unit"], correct: 1 },
      { question: "Input device?", answers: ["Monitor", "Keyboard", "Speaker", "Printer"], correct: 1 },
      { question: "Software?", answers: ["Mouse", "Keyboard", "Windows", "CPU"], correct: 2 },
      { question: "Binary digits?", answers: ["1 and 2", "0 and 1", "2 and 3", "8 and 9"], correct: 1 },
      { question: "Windows created by?", answers: ["Apple", "Google", "Microsoft", "Intel"], correct: 2 }
    ],
    medium: [
      { question: "FIFO structure?", answers: ["Stack", "Queue", "Tree", "Graph"], correct: 1 },
      { question: "HTML used for?", answers: ["Styling", "Logic", "Structure", "Database"], correct: 2 },
      { question: "CSS used for?", answers: ["Structure", "Styling", "Database", "CPU"], correct: 1 },
      { question: "RAM stands for?", answers: ["Random Access Memory", "Read Access Memory", "Run Memory", "Rapid Access"], correct: 0 },
      { question: "JS comment?", answers: ["//", "##", "<!--", "**"], correct: 0 }
    ],
    hard: [
      { question: "Binary search complexity?", answers: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: 1 },
      { question: "Secure protocol?", answers: ["HTTP", "FTP", "HTTPS", "SMTP"], correct: 2 },
      { question: "LIFO structure?", answers: ["Queue", "Stack", "Array", "Tree"], correct: 1 },
      { question: "SQL stands for?", answers: ["Structured Query Language", "Simple Query Language", "System Query Logic", "None"], correct: 0 },
      { question: "Fast sorting?", answers: ["Bubble", "Selection", "Quick Sort", "Insertion"], correct: 2 }
    ]
  },

  science: {
    easy: [
      { question: "Red planet?", answers: ["Mars", "Venus", "Earth", "Jupiter"], correct: 0 },
      { question: "Breathing gas?", answers: ["CO2", "Oxygen", "Hydrogen", "Helium"], correct: 1 },
      { question: "H2O?", answers: ["Salt", "Water", "Gas", "Oxygen"], correct: 1 },
      { question: "Insect legs?", answers: ["4", "6", "8", "10"], correct: 1 },
      { question: "Closest star?", answers: ["Sirius", "Sun", "Moon", "Mars"], correct: 1 }
    ],
    medium: [
      { question: "Gold symbol?", answers: ["Ag", "Au", "Gd", "Go"], correct: 1 },
      { question: "Gravity causes?", answers: ["Orbit", "Noise", "Heat", "Light"], correct: 0 },
      { question: "DNA found in?", answers: ["Nucleus", "Membrane", "Wall", "Skin"], correct: 0 },
      { question: "Universal donor?", answers: ["A", "B", "AB", "O-"], correct: 3 },
      { question: "Water boils at?", answers: ["90", "95", "100", "110"], correct: 2 }
    ],
    hard: [
      { question: "Negative particle?", answers: ["Proton", "Neutron", "Electron", "Photon"], correct: 2 },
      { question: "Newton 3rd law?", answers: ["Inertia", "F=ma", "Action-reaction", "Gravity"], correct: 2 },
      { question: "Speed of light?", answers: ["300k km/s", "150k", "30k", "3k"], correct: 0 },
      { question: "Neutral pH?", answers: ["0", "5", "7", "14"], correct: 2 },
      { question: "Blood pump?", answers: ["Lungs", "Heart", "Brain", "Liver"], correct: 1 }
    ]
  }
};

/* ================= STATE ================= */

let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let gameMode = "cups";

const PENALTY = 0.5;

/* ================= HELPERS ================= */

const $ = (id) => document.getElementById(id);

/* ================= HOME ================= */

function startQuizApp() {

  const subject = $("subjectSelect").value;
  const difficulty = $("difficultySelect").value;
  const minigame = $("minigameSelect").value;

  questions = questionBank[subject][difficulty];

  currentQuestion = 0;
  score = 0;
  penalties = 0;
  failures = 0;
  tabSwitches = 0;

  gameMode = (minigame === "random")
    ? (Math.random() < 0.5 ? "cups" : "qte")
    : minigame;

  $("homeScreen").style.display = "none";
  $("quizApp").style.display = "flex";

  updateUI();
  loadQuestion();

  (gameMode === "cups") ? startCupGame() : startQTE();

  log("Quiz started");
}

/* ================= QUIZ ================= */

function loadQuestion() {

  if (currentQuestion >= questions.length) return endQuiz();

  const q = questions[currentQuestion];

  $("questionNumber").textContent =
    `Question ${currentQuestion + 1}/${questions.length}`;

  $("questionText").textContent = q.question;
  $("answersContainer").innerHTML = "";

  q.answers.forEach((a, i) => {

    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = a;

    btn.onclick = () => {

      if (i === q.correct) {
        score += 2;
        log("Correct");
      } else {
        log("Wrong");
      }

      currentQuestion++;
      updateUI();
      loadQuestion();
    };

    $("answersContainer").appendChild(btn);
  });
}

/* ================= MINIGAMES ================= */

let cupIndex = 0;

function startCupGame() {

  $("gameTitle").textContent = "Find Ball";
  $("gameDescription").textContent = "Click correct cup";

  $("gameArea").innerHTML = `
    <div class="cups-container">
      <div class="cup"></div>
      <div class="cup"></div>
      <div class="cup"></div>
    </div>
  `;

  document.querySelectorAll(".cup").forEach((c, i) => {
    c.onclick = () => {
      if (i === cupIndex) log("Cup correct");
      else penalty("Cup wrong");
      shuffle();
    };
  });

  setInterval(shuffle, 4000);
  shuffle();
}

function shuffle() {

  const cups = document.querySelectorAll(".cup");
  cups.forEach(c => c.innerHTML = "");

  cupIndex = Math.floor(Math.random() * 3);

  const ball = document.createElement("div");
  ball.className = "ball";

  cups[cupIndex].appendChild(ball);
}

/* QTE */

let key = "A";
let gauge = 100;

function startQTE() {

  $("gameTitle").textContent = "QTE";
  $("gameDescription").textContent = "Press key fast";

  $("gameArea").innerHTML = `
    <div class="qte-container">
      <div class="target-key" id="tk"></div>
      <div class="gauge-box"><div class="gauge-fill" id="gf"></div></div>
    </div>
  `;

  key = randomKey();
  $("tk").textContent = key;

  setInterval(() => {

    gauge -= 1;

    $("gf").style.width = gauge + "%";

    if (gauge <= 0) {
      gauge = 100;
      penalty("Gauge empty");
    }

  }, 120);
}

function randomKey() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
}

document.addEventListener("keydown", e => {

  if (gameMode !== "qte") return;

  if (e.key.toUpperCase() === key) {

    gauge = Math.min(100, gauge + 10);
    key = randomKey();
    $("tk").textContent = key;
  }
});

/* ================= PENALTY ================= */

function penalty(reason) {
  penalties += PENALTY;
  failures++;
  log("Penalty: " + reason);
  updateUI();
}

/* ================= UI ================= */

function updateUI() {

  $("score").textContent = Math.max(score - penalties, 0).toFixed(1);
  $("penalties").textContent = penalties.toFixed(1);
  $("tabSwitches").textContent = tabSwitches;
}

function endQuiz() {

  $("quizContent").style.display = "none";
  $("resultsScreen").style.display = "block";

  $("finalScore").textContent = Math.max(score - penalties, 0).toFixed(1);
  $("finalFailures").textContent = failures;
  $("finalTabs").textContent = tabSwitches;
}

/* ================= LOG ================= */

function log(msg) {

  const logArea = $("logArea");
  if (!logArea) return;

  const div = document.createElement("div");
  div.textContent = msg;

  logArea.prepend(div);

  if (logArea.children.length > 10)
    logArea.removeChild(logArea.lastChild);
}

/* ================= ANTI CHEAT ================= */

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {
    tabSwitches++;
    $("tabWarning").style.display = "flex";
  } else {
    $("tabWarning").style.display = "none";
  }

  updateUI();
});

["copy", "paste", "cut"].forEach(ev => {
  document.addEventListener(ev, e => {
    e.preventDefault();
    log(ev + " blocked");
  });
});

/* ================= EDITOR (simple placeholder hooks) ================= */

function openQuestionEditor() {
  $("homeScreen").style.display = "none";
  $("editorScreen").style.display = "block";
}

function closeQuestionEditor() {
  $("editorScreen").style.display = "none";
  $("homeScreen").style.display = "flex";
}
