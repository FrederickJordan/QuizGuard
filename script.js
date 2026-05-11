const questionBank = {

  math: {

    easy: [
      {
        question: "What is 5 + 7?",
        answers: ["12", "10", "13", "14"],
        correct: 0
      },
      {
        question: "What is 9 × 3?",
        answers: ["18", "27", "21", "24"],
        correct: 1
      },
      {
        question: "What is 81 ÷ 9?",
        answers: ["7", "8", "9", "6"],
        correct: 2
      },
      {
        question: "What is 15 - 6?",
        answers: ["7", "8", "9", "10"],
        correct: 2
      },
      {
        question: "What is 14 + 5?",
        answers: ["18", "19", "20", "21"],
        correct: 1
      }
    ],

    medium: [
      {
        question: "Solve: 12²",
        answers: ["124", "132", "144", "154"],
        correct: 2
      },
      {
        question: "What is the value of π rounded to 2 decimals?",
        answers: ["3.12", "3.14", "3.16", "3.18"],
        correct: 1
      },
      {
        question: "What is 20% of 250?",
        answers: ["40", "45", "50", "55"],
        correct: 2
      },
      {
        question: "Solve: 7 × 8 - 12",
        answers: ["44", "46", "48", "50"],
        correct: 0
      },
      {
        question: "What is the square root of 169?",
        answers: ["11", "12", "13", "14"],
        correct: 2
      }
    ],

    hard: [
      {
        question: "What is the derivative of x²?",
        answers: ["x", "2x", "x²", "2"],
        correct: 1
      },
      {
        question: "What is the integral of 2x?",
        answers: ["x² + C", "2x² + C", "x + C", "2 + C"],
        correct: 0
      },
      {
        question: "Solve for x: 2x + 6 = 18",
        answers: ["4", "5", "6", "7"],
        correct: 2
      },
      {
        question: "What is sin(90°)?",
        answers: ["0", "0.5", "1", "-1"],
        correct: 2
      },
      {
        question: "What is the value of log₁₀(100)?",
        answers: ["1", "2", "10", "100"],
        correct: 1
      }
    ]
  },

  english: {

    easy: [
      {
        question: "Choose the correct spelling.",
        answers: ["Recieve", "Receive", "Receeve", "Receve"],
        correct: 1
      },
      {
        question: "Choose the synonym of 'happy'.",
        answers: ["Sad", "Angry", "Joyful", "Weak"],
        correct: 2
      },
      {
        question: "What is the opposite of 'cold'?",
        answers: ["Warm", "Cool", "Wet", "Soft"],
        correct: 0
      },
      {
        question: "Which is a noun?",
        answers: ["Run", "Beautiful", "Table", "Quickly"],
        correct: 2
      },
      {
        question: "Choose the correct article: ___ apple",
        answers: ["A", "An", "The", "No article"],
        correct: 1
      }
    ],

    medium: [
      {
        question: "Choose the synonym of 'rapid'.",
        answers: ["Slow", "Fast", "Weak", "Calm"],
        correct: 1
      },
      {
        question: "Identify the adjective.",
        answers: ["Quickly", "Blue", "Run", "Jump"],
        correct: 1
      },
      {
        question: "Which sentence is grammatically correct?",
        answers: [
          "She go to school.",
          "She goes to school.",
          "She going to school.",
          "She gone to school."
        ],
        correct: 1
      },
      {
        question: "What is the past tense of 'write'?",
        answers: ["Written", "Writing", "Wrote", "Writes"],
        correct: 2
      },
      {
        question: "Choose the antonym of 'expand'.",
        answers: ["Increase", "Stretch", "Shrink", "Grow"],
        correct: 2
      }
    ],

    hard: [
      {
        question: "Identify the literary device: 'Time is a thief.'",
        answers: ["Simile", "Metaphor", "Hyperbole", "Irony"],
        correct: 1
      },
      {
        question: "What is the meaning of 'ubiquitous'?",
        answers: ["Rare", "Everywhere", "Dangerous", "Hidden"],
        correct: 1
      },
      {
        question: "Choose the correctly punctuated sentence.",
        answers: [
          "Lets eat grandma!",
          "Let's eat grandma!",
          "Lets eat, grandma!",
          "Let's eat, grandma!"
        ],
        correct: 3
      },
      {
        question: "Which word is an adverb?",
        answers: ["Beautiful", "Happiness", "Swiftly", "Bright"],
        correct: 2
      },
      {
        question: "What type of sentence gives a command?",
        answers: ["Declarative", "Interrogative", "Imperative", "Exclamatory"],
        correct: 2
      }
    ]
  },

  computer_science: {

    easy: [
      {
        question: "What does CPU stand for?",
        answers: [
          "Central Process Unit",
          "Central Processing Unit",
          "Computer Personal Unit",
          "Central Power Unit"
        ],
        correct: 1
      },
      {
        question: "Which device is used for input?",
        answers: ["Monitor", "Keyboard", "Speaker", "Projector"],
        correct: 1
      },
      {
        question: "Which one is software?",
        answers: ["Mouse", "Keyboard", "Windows", "CPU"],
        correct: 2
      },
      {
        question: "Binary uses which two digits?",
        answers: ["1 and 2", "0 and 1", "2 and 3", "8 and 9"],
        correct: 1
      },
      {
        question: "Which company created Windows?",
        answers: ["Apple", "Google", "Microsoft", "Intel"],
        correct: 2
      }
    ],

    medium: [
      {
        question: "Which data structure uses FIFO?",
        answers: ["Stack", "Queue", "Tree", "Graph"],
        correct: 1
      },
      {
        question: "HTML is mainly used for?",
        answers: ["Styling", "Programming", "Structuring webpages", "Databases"],
        correct: 2
      },
      {
        question: "Which language is primarily used for web styling?",
        answers: ["HTML", "Java", "CSS", "Python"],
        correct: 2
      },
      {
        question: "What does RAM stand for?",
        answers: [
          "Random Access Memory",
          "Read Access Memory",
          "Rapid Access Module",
          "Run Access Memory"
        ],
        correct: 0
      },
      {
        question: "Which symbol is used for comments in JavaScript?",
        answers: ["//", "##", "<!--", "**"],
        correct: 0
      }
    ],

    hard: [
      {
        question: "What is the time complexity of binary search?",
        answers: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
        correct: 1
      },
      {
        question: "Which protocol is used for secure web browsing?",
        answers: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correct: 2
      },
      {
        question: "Which data structure uses LIFO?",
        answers: ["Queue", "Stack", "Array", "Tree"],
        correct: 1
      },
      {
        question: "What does SQL stand for?",
        answers: [
          "Structured Query Language",
          "Simple Query Language",
          "Sequential Query Logic",
          "Structured Queue Logic"
        ],
        correct: 0
      },
      {
        question: "Which sorting algorithm is generally fastest for large datasets?",
        answers: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"],
        correct: 2
      }
    ]
  },

  science: {

    easy: [
      {
        question: "What planet is called the Red Planet?",
        answers: ["Mars", "Venus", "Mercury", "Saturn"],
        correct: 0
      },
      {
        question: "What gas do humans breathe in?",
        answers: ["Carbon Dioxide", "Nitrogen", "Oxygen", "Helium"],
        correct: 2
      },
      {
        question: "What is H2O commonly known as?",
        answers: ["Salt", "Hydrogen", "Water", "Oxygen"],
        correct: 2
      },
      {
        question: "How many legs does an insect have?",
        answers: ["4", "6", "8", "10"],
        correct: 1
      },
      {
        question: "Which star is closest to Earth?",
        answers: ["Sirius", "Polaris", "The Sun", "Betelgeuse"],
        correct: 2
      }
    ],

    medium: [
      {
        question: "What is the chemical symbol for gold?",
        answers: ["Ag", "Au", "Gd", "Go"],
        correct: 1
      },
      {
        question: "What force keeps planets in orbit?",
        answers: ["Magnetism", "Gravity", "Friction", "Electricity"],
        correct: 1
      },
      {
        question: "What part of the cell contains DNA?",
        answers: ["Nucleus", "Membrane", "Cytoplasm", "Ribosome"],
        correct: 0
      },
      {
        question: "Which blood type is known as the universal donor?",
        answers: ["A", "B", "AB", "O negative"],
        correct: 3
      },
      {
        question: "What is the boiling point of water at sea level?",
        answers: ["90°C", "95°C", "100°C", "110°C"],
        correct: 2
      }
    ],

    hard: [
      {
        question: "What particle has a negative charge?",
        answers: ["Proton", "Neutron", "Electron", "Photon"],
        correct: 2
      },
      {
        question: "Which law states that every action has an equal and opposite reaction?",
        answers: [
          "Newton's First Law",
          "Newton's Second Law",
          "Newton's Third Law",
          "Law of Gravity"
        ],
        correct: 2
      },
      {
        question: "What is the speed of light approximately?",
        answers: [
          "300,000 km/s",
          "150,000 km/s",
          "30,000 km/s",
          "3,000 km/s"
        ],
        correct: 0
      },
      {
        question: "What is the pH value of a neutral substance?",
        answers: ["0", "5", "7", "14"],
        correct: 2
      },
      {
        question: "Which organ pumps blood around the body?",
        answers: ["Lungs", "Liver", "Brain", "Heart"],
        correct: 3
      }
    ]
  }
};

/* ================================ */
/* VARIABLES */
/* ================================ */

let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let gameMode = "cups";

const PENALTY_AMOUNT = 0.5;

/* ================================ */
/* HELPER */
/* ================================ */

function getEl(id) {
  return document.getElementById(id);
}

/* ================================ */
/* LOG */
/* ================================ */

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

/* ================================ */
/* HOME */
/* ================================ */

function startQuizApp() {

  const subject =
    getEl("subjectSelect").value;

  const difficulty =
    getEl("difficultySelect").value;

  const selectedMinigame =
    getEl("minigameSelect").value;

  questions =
    questionBank[subject][difficulty];

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
