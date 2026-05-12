// ========== FIREBASE CONFIGURATION (your existing config) ==========
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-aOYS4SxBin4ks17MzX_TVtnxzjPLhD8",
  authDomain: "quizguard-d8c56.firebaseapp.com",
  databaseURL: "https://quizguard-d8c56-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizguard-d8c56",
  storageBucket: "quizguard-d8c56.firebasestorage.app",
  messagingSenderId: "1025907204447",
  appId: "1:1025907204447:web:047dc148e89e49e21456ea",
  measurementId: "G-YBKTDS05H3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========== GLOBAL VARIABLES ==========
let questionBank = null;
let currentUser = null;
let questions = [];
let currentQuestion = 0;
let score = 0;
let penalties = 0;
let failures = 0;
let tabSwitches = 0;
let gameMode = "cups";
let pointsPerCorrect = 10;

// Cup game
let cupTimerInterval = null;
let cupBallIndex = 0;
let cupGauge = 100;
const CUP_GAUGE_DECREMENT = 1;

// QTE game
let qteInterval = null;
let qteGauge = 100;
let targetKey = "A";

// Warning cooldown
let lastWarningTime = 0;
const WARNING_COOLDOWN_MS = 2000;

function getEl(id) { return document.getElementById(id); }

// ========== DEFAULT QUESTION BANK (10 per difficulty, 120 total) ==========
function getDefaultQuestionBank() {
  return {
    math: {
      easy: [
        { question: "What is 12 × 8?", answers: ["96", "88", "108", "84"], correct: 0 },
        { question: "What is 15 + 27?", answers: ["42", "32", "52", "41"], correct: 0 },
        { question: "What is 100 ÷ 4?", answers: ["25", "20", "30", "40"], correct: 0 },
        { question: "What is the square root of 81?", answers: ["9", "7", "8", "10"], correct: 0 },
        { question: "What is 7 × 6?", answers: ["42", "36", "48", "54"], correct: 0 },
        { question: "What is 9 + 4 × 2?", answers: ["17", "26", "22", "13"], correct: 0 },
        { question: "What is 3²?", answers: ["9", "6", "8", "12"], correct: 0 },
        { question: "What is 50% of 200?", answers: ["100", "50", "150", "25"], correct: 0 },
        { question: "What is the next prime after 7?", answers: ["11", "9", "13", "10"], correct: 0 },
        { question: "What is 0.5 as a fraction?", answers: ["1/2", "1/4", "3/4", "2/3"], correct: 0 }
      ],
      medium: [
        { question: "What is the derivative of x³?", answers: ["3x²", "x²", "2x²", "3x"], correct: 0 },
        { question: "If 2x + 5 = 13, what is x?", answers: ["4", "3", "5", "6"], correct: 0 },
        { question: "What is 15% of 200?", answers: ["30", "20", "40", "15"], correct: 0 },
        { question: "What is the area of a circle with radius 3?", answers: ["9π", "6π", "3π", "12π"], correct: 0 },
        { question: "What is the value of 2³ + 3²?", answers: ["17", "13", "15", "19"], correct: 0 },
        { question: "What is the slope of the line y = 4x - 2?", answers: ["4", "-2", "2", "1"], correct: 0 },
        { question: "What is the median of 3, 7, 9, 2, 5?", answers: ["5", "7", "6", "4"], correct: 0 },
        { question: "What is 20% of 250?", answers: ["50", "25", "40", "60"], correct: 0 },
        { question: "What is the volume of a cube with side 4?", answers: ["64", "16", "12", "48"], correct: 0 },
        { question: "If a = 3 and b = 4, what is a² + b²?", answers: ["25", "12", "7", "49"], correct: 0 }
      ],
      hard: [
        { question: "What is the integral of 2x dx?", answers: ["x² + C", "2x² + C", "x + C", "x²"], correct: 0 },
        { question: "Solve for x: log₂(x) + log₂(x-2) = 3", answers: ["4", "2", "6", "8"], correct: 0 },
        { question: "What is the determinant of [[1,2],[3,4]]?", answers: ["-2", "2", "5", "-5"], correct: 0 },
        { question: "What is the sum of the first 10 prime numbers?", answers: ["129", "127", "131", "125"], correct: 0 },
        { question: "What is the limit of (sin x)/x as x → 0?", answers: ["1", "0", "∞", "undefined"], correct: 0 },
        { question: "What is the derivative of ln(x)?", answers: ["1/x", "x", "e^x", "ln(x)"], correct: 0 },
        { question: "What is the value of 5! (5 factorial)?", answers: ["120", "60", "24", "100"], correct: 0 },
        { question: "What is the Pythagorean triple with sides 3 and 4?", answers: ["5", "6", "7", "4.5"], correct: 0 },
        { question: "What is the quadratic formula solution for x² - 5x + 6 = 0?", answers: ["2,3", "1,6", "2,4", "3,4"], correct: 0 },
        { question: "What is the derivative of sin(x)?", answers: ["cos(x)", "-sin(x)", "sec²(x)", "tan(x)"], correct: 0 }
      ]
    },
    english: {
      easy: [
        { question: "Choose the synonym of 'rapid'.", answers: ["Fast", "Slow", "Weak", "Calm"], correct: 0 },
        { question: "What is the antonym of 'begin'?", answers: ["End", "Start", "Open", "Launch"], correct: 0 },
        { question: "Which word is a noun?", answers: ["Happiness", "Run", "Quickly", "Blue"], correct: 0 },
        { question: "What is the past tense of 'go'?", answers: ["Went", "Gone", "Goed", "Going"], correct: 0 },
        { question: "What is the plural of 'child'?", answers: ["Children", "Childs", "Childes", "Child's"], correct: 0 },
        { question: "What is the opposite of 'joy'?", answers: ["Sorrow", "Happiness", "Excitement", "Anger"], correct: 0 },
        { question: "Which word means 'very big'?", answers: ["Enormous", "Tiny", "Quick", "Bright"], correct: 0 },
        { question: "What is the correct spelling?", answers: ["Necessary", "Neccessary", "Necissary", "Necesary"], correct: 0 },
        { question: "What is a verb?", answers: ["Action word", "Person", "Place", "Thing"], correct: 0 },
        { question: "What is the opposite of 'hot'?", answers: ["Cold", "Warm", "Cool", "Icy"], correct: 0 }
      ],
      medium: [
        { question: "Choose the correct spelling:", answers: ["Accommodate", "Acommodate", "Accomodate", "Acomodate"], correct: 0 },
        { question: "What is the meaning of 'benevolent'?", answers: ["Kind", "Cruel", "Angry", "Lazy"], correct: 0 },
        { question: "Which sentence uses the semicolon correctly?", answers: ["I have a test; I need to study.", "I have a test, I need to study.", "I have a test: I need to study.", "I have a test I need to study."], correct: 0 },
        { question: "What is the literary device in 'the wind whispered'?", answers: ["Personification", "Simile", "Metaphor", "Alliteration"], correct: 0 },
        { question: "What is a synonym for 'eloquent'?", answers: ["Persuasive", "Silent", "Boring", "Rude"], correct: 0 },
        { question: "What is the antonym of 'diligent'?", answers: ["Lazy", "Hardworking", "Careful", "Attentive"], correct: 0 },
        { question: "What is the meaning of 'ambiguous'?", answers: ["Unclear", "Clear", "Certain", "Direct"], correct: 0 },
        { question: "Which is a simile?", answers: ["As brave as a lion", "The world is a stage", "Time flies", "Busy as a bee"], correct: 0 },
        { question: "What is the past participle of 'write'?", answers: ["Written", "Wrote", "Writing", "Writes"], correct: 0 },
        { question: "What does 'chronological' mean?", answers: ["Time order", "Random", "Alphabetical", "By size"], correct: 0 }
      ],
      hard: [
        { question: "What is the correct definition of 'obsequious'?", answers: ["Excessively obedient", "Angry", "Indifferent", "Cheerful"], correct: 0 },
        { question: "Which author wrote 'Paradise Lost'?", answers: ["John Milton", "William Shakespeare", "Geoffrey Chaucer", "Jane Austen"], correct: 0 },
        { question: "What is the term for a word that imitates a sound?", answers: ["Onomatopoeia", "Alliteration", "Assonance", "Consonance"], correct: 0 },
        { question: "What is the main theme of 'The Great Gatsby'?", answers: ["The American Dream", "War", "Love", "Revenge"], correct: 0 },
        { question: "What is a 'sonnet'?", answers: ["14-line poem", "5-line poem", "Novel", "Short story"], correct: 0 },
        { question: "What is the meaning of 'ephemeral'?", answers: ["Short-lived", "Eternal", "Strong", "Weak"], correct: 0 },
        { question: "Who wrote 'Pride and Prejudice'?", answers: ["Jane Austen", "Charles Dickens", "Mark Twain", "Virginia Woolf"], correct: 0 },
        { question: "What is a rhetorical question?", answers: ["Question not needing answer", "Question with answer", "Statement", "Exclamation"], correct: 0 },
        { question: "What is the opposite of 'ubiquitous'?", answers: ["Rare", "Everywhere", "Common", "Obvious"], correct: 0 },
        { question: "What does 'pragmatic' mean?", answers: ["Practical", "Idealistic", "Theoretical", "Emotional"], correct: 0 }
      ]
    },
    computer_science: {
      easy: [
        { question: "Which data structure uses FIFO?", answers: ["Queue", "Stack", "Tree", "Graph"], correct: 0 },
        { question: "What does CPU stand for?", answers: ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Core Processing Unit"], correct: 0 },
        { question: "What is the extension of a Python file?", answers: [".py", ".java", ".cpp", ".html"], correct: 0 },
        { question: "Which operator is used for equality in JavaScript?", answers: ["===", "=", "==", "!=="], correct: 0 },
        { question: "What does HTML stand for?", answers: ["HyperText Markup Language", "HighText Markup Language", "Hyper Transfer Markup Language", "HyperText Machine Language"], correct: 0 },
        { question: "What does RAM stand for?", answers: ["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "Run Access Memory"], correct: 0 },
        { question: "What is the output of print(2+2) in Python?", answers: ["4", "2+2", "22", "Error"], correct: 0 },
        { question: "Which symbol is used for single-line comment in Python?", answers: ["#", "//", "/*", "--"], correct: 0 },
        { question: "What does URL stand for?", answers: ["Uniform Resource Locator", "Universal Resource Link", "Uniform Resource Link", "Universal Resource Locator"], correct: 0 },
        { question: "Which is a search engine?", answers: ["Google", "Windows", "Linux", "Python"], correct: 0 }
      ],
      medium: [
        { question: "What does 'HTTP' stand for?", answers: ["HyperText Transfer Protocol", "Hyper Transfer Text Protocol", "High Transfer Text Protocol", "HyperText Transfer Program"], correct: 0 },
        { question: "Which sorting algorithm has the best average time complexity?", answers: ["Quicksort", "Bubble sort", "Insertion sort", "Selection sort"], correct: 0 },
        { question: "What is an example of a NoSQL database?", answers: ["MongoDB", "MySQL", "PostgreSQL", "SQLite"], correct: 0 },
        { question: "What is the time complexity of binary search?", answers: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correct: 0 },
        { question: "What does API stand for?", answers: ["Application Programming Interface", "Application Program Interface", "Applied Programming Interface", "Application Process Interface"], correct: 0 },
        { question: "What is a boolean?", answers: ["True/False", "Number", "String", "Array"], correct: 0 },
        { question: "What does SQL stand for?", answers: ["Structured Query Language", "Simple Query Language", "Standard Query Language", "Sequential Query Language"], correct: 0 },
        { question: "What is a compiler?", answers: ["Converts code to machine language", "Runs code line by line", "Manages memory", "Debugs code"], correct: 0 },
        { question: "What is the default port for HTTP?", answers: ["80", "443", "22", "8080"], correct: 0 },
        { question: "What does CSS stand for?", answers: ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], correct: 0 }
      ],
      hard: [
        { question: "What is the primary purpose of a mutex?", answers: ["Prevent race conditions", "Speed up execution", "Allocate memory", "Handle exceptions"], correct: 0 },
        { question: "What is the worst-case time complexity of quicksort?", answers: ["O(n²)", "O(n log n)", "O(log n)", "O(n)"], correct: 0 },
        { question: "What is a Turing machine?", answers: ["Mathematical model of computation", "A type of computer", "A programming language", "A CPU architecture"], correct: 0 },
        { question: "What is the output of 'print(2**3)' in Python?", answers: ["8", "6", "9", "5"], correct: 0 },
        { question: "What is a closure in JavaScript?", answers: ["Function with access to outer scope", "A loop", "An object", "A class"], correct: 0 },
        { question: "What does CRUD stand for?", answers: ["Create, Read, Update, Delete", "Copy, Run, Update, Delete", "Create, Retrieve, Update, Drop", "Compile, Read, Update, Delete"], correct: 0 },
        { question: "What is a deadlock?", answers: ["Two processes waiting for each other", "Program crash", "Memory leak", "Infinite loop"], correct: 0 },
        { question: "What is the time complexity of accessing an element in a hash table?", answers: ["O(1) average", "O(n)", "O(log n)", "O(n log n)"], correct: 0 },
        { question: "What does IoT stand for?", answers: ["Internet of Things", "Interoperability of Things", "Internet of Technology", "Interface of Things"], correct: 0 },
        { question: "What is a DDoS attack?", answers: ["Distributed denial-of-service", "Direct data off-system", "Dynamic directory operation system", "Data distribution overload service"], correct: 0 }
      ]
    },
    science: {
      easy: [
        { question: "What planet is called the Red Planet?", answers: ["Mars", "Venus", "Mercury", "Saturn"], correct: 0 },
        { question: "What is the hardest natural substance?", answers: ["Diamond", "Gold", "Iron", "Platinum"], correct: 0 },
        { question: "What gas do plants absorb?", answers: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: 0 },
        { question: "What is the boiling point of water at sea level?", answers: ["100°C", "90°C", "110°C", "80°C"], correct: 0 },
        { question: "What is the fastest land animal?", answers: ["Cheetah", "Lion", "Leopard", "Horse"], correct: 0 },
        { question: "What is the largest organ in the human body?", answers: ["Skin", "Heart", "Liver", "Lungs"], correct: 0 },
        { question: "What is the chemical symbol for Oxygen?", answers: ["O", "Ox", "Om", "Oy"], correct: 0 },
        { question: "Which planet is known as the Blue Planet?", answers: ["Earth", "Neptune", "Uranus", "Mars"], correct: 0 },
        { question: "What is the process of a liquid turning into gas?", answers: ["Evaporation", "Condensation", "Freezing", "Melting"], correct: 0 },
        { question: "What is the unit of electric current?", answers: ["Ampere", "Volt", "Ohm", "Watt"], correct: 0 }
      ],
      medium: [
        { question: "What is the pH of pure water?", answers: ["7", "0", "14", "5"], correct: 0 },
        { question: "What is the process by which plants make food?", answers: ["Photosynthesis", "Respiration", "Fermentation", "Digestion"], correct: 0 },
        { question: "Which organ pumps blood throughout the human body?", answers: ["Heart", "Brain", "Liver", "Lungs"], correct: 0 },
        { question: "What is the unit of force?", answers: ["Newton", "Joule", "Watt", "Pascal"], correct: 0 },
        { question: "What is the most abundant gas in Earth's atmosphere?", answers: ["Nitrogen", "Oxygen", "Argon", "Carbon dioxide"], correct: 0 },
        { question: "What is the chemical formula for water?", answers: ["H₂O", "CO₂", "O₂", "NaCl"], correct: 0 },
        { question: "What is the powerhouse of the cell?", answers: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"], correct: 0 },
        { question: "Which vitamin is produced by human skin when exposed to sunlight?", answers: ["Vitamin D", "Vitamin C", "Vitamin B12", "Vitamin A"], correct: 0 },
        { question: "What is the study of rocks called?", answers: ["Petrology", "Geology", "Seismology", "Meteorology"], correct: 0 },
        { question: "What part of the cell contains DNA?", answers: ["Nucleus", "Mitochondria", "Cytoplasm", "Ribosome"], correct: 0 }
      ],
      hard: [
        { question: "What is the first law of thermodynamics?", answers: ["Energy conservation", "Entropy increases", "Absolute zero", "Pressure temperature relation"], correct: 0 },
        { question: "What is the chemical symbol for Gold?", answers: ["Au", "Ag", "Fe", "Pb"], correct: 0 },
        { question: "What is the powerhouse of the cell?", answers: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"], correct: 0 },
        { question: "What is the speed of light in vacuum (approx)?", answers: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10¹⁰ m/s", "3×10⁵ m/s"], correct: 0 },
        { question: "What is the main component of the Sun?", answers: ["Hydrogen", "Helium", "Oxygen", "Carbon"], correct: 0 },
        { question: "What is the second law of thermodynamics?", answers: ["Entropy increases", "Energy is conserved", "Absolute zero is unreachable", "Heat flows from hot to cold"], correct: 0 },
        { question: "What is the atomic number of Carbon?", answers: ["6", "12", "4", "8"], correct: 0 },
        { question: "What type of bond shares electrons?", answers: ["Covalent", "Ionic", "Hydrogen", "Metallic"], correct: 0 },
        { question: "What is the smallest unit of an element?", answers: ["Atom", "Molecule", "Proton", "Electron"], correct: 0 },
        { question: "Which scientist proposed the theory of relativity?", answers: ["Einstein", "Newton", "Galileo", "Darwin"], correct: 0 }
      ]
    }
  };
}

// ========== INITIALIZE QUESTION BANK ==========
function initializeQuestionBank() {
  if (!questionBank) {
    questionBank = getDefaultQuestionBank();
    console.log("Default bank ready");
  }
}
initializeQuestionBank();

// ========== FIRESTORE SAVE / LOAD ==========
async function saveQuestionBankToFirestore() {
  if (!auth.currentUser) return;
  const userDocRef = doc(db, "users", auth.currentUser.uid);
  await setDoc(userDocRef, { questionBank }, { merge: true });
  addLog("Question bank saved.");
}

async function loadQuestionBankFromFirestore() {
  if (!auth.currentUser) return;
  const userDocRef = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists() && docSnap.data().questionBank) {
    const saved = docSnap.data().questionBank;
    const defaultBank = getDefaultQuestionBank();
    // Ensure all default subjects/difficulties exist (merge structure)
    for (let subject in defaultBank) {
      if (!saved[subject]) saved[subject] = {};
      for (let diff in defaultBank[subject]) {
        if (!saved[subject][diff]) saved[subject][diff] = [];
      }
    }
    questionBank = saved;
    addLog("Loaded from cloud.");
  } else {
    questionBank = getDefaultQuestionBank();
    await saveQuestionBankToFirestore();
    addLog("Default bank saved.");
  }
  refreshSubjectDropdowns();
}

function modifyAndSave(callback) {
  callback();
  saveQuestionBankToFirestore();
}

// ========== SUBJECT MANAGEMENT ==========
function renderSubjectsList() {
  const container = document.getElementById('subjectsList');
  if (!container) return;
  if (!questionBank) return;
  const subjects = Object.keys(questionBank);
  if (subjects.length === 0) {
    container.innerHTML = '<i>No subjects. Add one above.</i>';
    return;
  }
  container.innerHTML = subjects.map(subj => `
    <div class="subject-pill">
      <strong>${escapeHtml(subj)}</strong>
      <button class="edit-subject" data-subject="${subj}" title="Edit subject name">✏️</button>
      <button class="delete-subject" data-subject="${subj}" title="Delete subject and all its questions">🗑️</button>
    </div>
  `).join('');

  document.querySelectorAll('.edit-subject').forEach(btn => {
    btn.addEventListener('click', () => {
      const oldName = btn.dataset.subject;
      const newName = prompt('Enter new subject name:', oldName);
      if (newName && newName.trim() && newName !== oldName) {
        editSubject(oldName, newName.trim());
      }
    });
  });
  document.querySelectorAll('.delete-subject').forEach(btn => {
    btn.addEventListener('click', () => {
      const subject = btn.dataset.subject;
      if (confirm(`Delete entire subject "${subject}" and all its questions? This cannot be undone.`)) {
        deleteSubject(subject);
      }
    });
  });
}

async function editSubject(oldName, newName) {
  if (!questionBank[oldName]) return;
  questionBank[newName] = questionBank[oldName];
  delete questionBank[oldName];
  await saveQuestionBankToFirestore();
  renderSubjectsList();
  refreshSubjectDropdowns();
  addLog(`Subject "${oldName}" renamed to "${newName}"`);
}

async function deleteSubject(subject) {
  if (!questionBank[subject]) return;
  delete questionBank[subject];
  await saveQuestionBankToFirestore();
  renderSubjectsList();
  refreshSubjectDropdowns();
  const editorSubject = document.getElementById('editorSubjectSelect');
  if (editorSubject && editorSubject.value === subject) {
    const firstSubj = Object.keys(questionBank)[0];
    if (firstSubj) editorSubject.value = firstSubj;
    renderQuestionEditor();
  }
  addLog(`Subject "${subject}" deleted.`);
}

async function addNewSubject() {
  const input = document.getElementById('newSubjectName');
  const name = input.value.trim();
  if (!name) {
    alert('Please enter a subject name.');
    return;
  }
  if (questionBank[name]) {
    alert('Subject already exists.');
    return;
  }
  questionBank[name] = {
    easy: [],
    medium: [],
    hard: []
  };
  await saveQuestionBankToFirestore();
  input.value = '';
  renderSubjectsList();
  refreshSubjectDropdowns();
  addLog(`New subject "${name}" added.`);
}

function refreshSubjectDropdowns() {
  const subjectSelects = ['subjectSelect', 'editorSubjectSelect'];
  const subjects = Object.keys(questionBank);
  for (let id of subjectSelects) {
    const select = document.getElementById(id);
    if (select) {
      const currentValue = select.value;
      select.innerHTML = subjects.map(subj => `<option value="${subj}">${escapeHtml(subj)}</option>`).join('');
      if (subjects.includes(currentValue)) select.value = currentValue;
      else if (subjects.length > 0) select.value = subjects[0];
    }
  }
}

// ========== LOGGING & UI HELPERS ==========
function addLog(message) {
  const logArea = getEl("logArea");
  if (!logArea) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.innerHTML = `<strong>[${time}]</strong> ${message}`;
  logArea.prepend(entry);
  while (logArea.children.length > 10) logArea.removeChild(logArea.lastChild);
}

function showAuthMessage(message, isSuccess = false) {
  const msgDiv = getEl("authMessage");
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
  setTimeout(() => {
    msgDiv.textContent = '';
    msgDiv.className = 'auth-message';
  }, 4000);
}

function showGaugeWarning(message) {
  const now = Date.now();
  if (now - lastWarningTime < WARNING_COOLDOWN_MS) return;
  lastWarningTime = now;
  let warningDiv = document.getElementById('gaugeWarningPopup');
  if (!warningDiv) {
    warningDiv = document.createElement('div');
    warningDiv.id = 'gaugeWarningPopup';
    warningDiv.className = 'gauge-warning';
    document.body.appendChild(warningDiv);
  }
  warningDiv.textContent = message;
  warningDiv.style.opacity = '1';
  setTimeout(() => {
    if (warningDiv) warningDiv.style.opacity = '0';
  }, 1000);
}

// ========== PENALTY & STATS ==========
function applyPenalty(reason) {
  penalties++;
  failures++;
  score = Math.max(0, score - 5);
  updateStats();
  addLog(`Penalty: ${reason} -5 (now ${Math.floor(score)})`);
}

function updateStats() {
  getEl("score").textContent = Math.floor(score);
  getEl("penalties").textContent = penalties;
  getEl("tabSwitches").textContent = tabSwitches;
}

// ========== ANTI‑CHEAT ==========
document.addEventListener("visibilitychange", () => {
  if (document.hidden && getEl("quizApp")?.style.display === "flex") {
    tabSwitches++;
    applyPenalty("Tab switched/minimised");
    getEl("tabWarning").style.display = "flex";
    setTimeout(() => {
      if (getEl("tabWarning")) getEl("tabWarning").style.display = "none";
    }, 2000);
  } else {
    if (getEl("tabWarning")) getEl("tabWarning").style.display = "none";
  }
});

["copy", "paste", "cut"].forEach(ev => {
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    addLog(`${ev} blocked`);
  });
});

// ========== QUIZ CORE ==========
function startQuizApp() {
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

  if (selected === "random") gameMode = Math.random() < 0.5 ? "cups" : "qte";
  else gameMode = selected;

  getEl("quizContent").style.display = "block";
  getEl("resultsScreen").style.display = "none";
  getEl("homeScreen").style.display = "none";
  getEl("quizApp").style.display = "flex";
  updateStats();
  loadQuestion();

  if (gameMode === "cups") startCupGame();
  else startQTEGame();

  addLog(`Quiz start: ${subject} ${difficulty} (${questions.length} q)`);
}

function loadQuestion() {
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
}

function endQuiz() {
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  if (qteInterval) clearInterval(qteInterval);
  getEl("quizContent").style.display = "none";
  getEl("resultsScreen").style.display = "block";
  getEl("finalScore").textContent = Math.floor(score);
  getEl("finalFailures").textContent = failures;
  getEl("finalTabs").textContent = tabSwitches;
  addLog(`Quiz finished. Score: ${Math.floor(score)}/100`);
}

function returnToHome() {
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  if (qteInterval) clearInterval(qteInterval);
  getEl("quizApp").style.display = "none";
  getEl("homeScreen").style.display = "flex";
  addLog("Returned home.");
}
window.returnToHome = returnToHome;

// ========== CUP GAME (gauge to the right, ball moves on reset) ==========
function startCupGame() {
  getEl("gameTitle").textContent = "Find The Ball";
  getEl("gameDescription").textContent = "Click correct cup before gauge empties! Correct refills and moves ball.";
  getEl("gameArea").innerHTML = `
    <div style="display: flex; flex-direction: row; align-items: center; gap: 30px;">
      <div class="cups-container" id="cupsContainer"></div>
      <div class="gauge-box" style="width: 200px;"><div class="gauge-fill" id="cupGaugeFill"></div></div>
    </div>
  `;
  const container = getEl("cupsContainer");
  for (let i=0; i<3; i++) {
    const cup = document.createElement("div");
    cup.className = "cup";
    cup.addEventListener("click", () => handleCupClick(i));
    container.appendChild(cup);
  }
  resetCupGameRound();
  cupGauge = 100;
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  cupTimerInterval = setInterval(() => {
    if (getEl("quizApp").style.display !== "flex") return;
    cupGauge -= CUP_GAUGE_DECREMENT;
    if (cupGauge < 0) cupGauge = 0;
    const fill = getEl("cupGaugeFill");
    if (fill) fill.style.width = cupGauge + "%";
    if (cupGauge <= 20 && cupGauge > 0) showGaugeWarning("⚠️ Cup low! Click cup!");
    if (cupGauge <= 0) {
      applyPenalty("Cup gauge emptied");
      resetCupGameRound();
    }
  }, 100);
}

function resetCupGameRound() {
  const cups = document.querySelectorAll(".cup");
  cups.forEach(cup => cup.innerHTML = "");
  cupBallIndex = Math.floor(Math.random() * 3);
  const ball = document.createElement("div");
  ball.className = "ball";
  cups[cupBallIndex].appendChild(ball);
  addLog(`Ball moved to cup ${cupBallIndex+1}`);
  cupGauge = 100;
  const fill = getEl("cupGaugeFill");
  if (fill) fill.style.width = "100%";
}

function handleCupClick(index) {
  if (index === cupBallIndex) {
    addLog("Correct cup! Ball moves, gauge refills.");
    resetCupGameRound();
  } else {
    applyPenalty("Wrong cup");
    resetCupGameRound();
  }
}

// ========== QTE GAME ==========
function startQTEGame() {
  getEl("gameTitle").textContent = "QTE Pressure Gauge";
  getEl("gameDescription").textContent = "Press the correct key to keep gauge alive!";
  getEl("gameArea").innerHTML = `
    <div class="qte-container" style="display: flex; flex-direction: column; align-items: center; width: 300px;">
      <div class="target-key" id="targetKey">A</div>
      <div class="gauge-box" style="width: 100%;"><div class="gauge-fill" id="qteGaugeFill"></div></div>
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
    qteGauge -= 1;
    if (qteGauge < 0) qteGauge = 0;
    const fillEl = getEl("qteGaugeFill");
    if (fillEl) fillEl.style.width = qteGauge + "%";
    if (qteGauge <= 20 && qteGauge > 0) showGaugeWarning("⚠️ QTE low! Press key!");
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

// ========== EDITOR FUNCTIONS (questions) ==========
function openQuestionEditor() {
  if (!questionBank) {
    alert("Question bank not ready.");
    return;
  }
  getEl("homeScreen").style.display = "none";
  getEl("editorScreen").style.display = "block";
  renderSubjectsList();
  renderQuestionEditor();
}
function closeQuestionEditor() {
  getEl("editorScreen").style.display = "none";
  getEl("homeScreen").style.display = "flex";
}
function renderQuestionEditor() {
  if (!questionBank) {
    alert("Question bank not loaded yet.");
    return;
  }
  const subject = getEl("editorSubjectSelect").value;
  const difficulty = getEl("editorDifficultySelect").value;
  const container = getEl("questionEditorList");
  container.innerHTML = "";
  const qs = questionBank[subject]?.[difficulty];
  if (!qs || qs.length === 0) {
    container.innerHTML = "<p>No questions found. Add some below.</p>";
    return;
  }
  qs.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "question-edit-card";
    div.style.marginBottom = "20px";
    div.style.padding = "15px";
    div.style.border = "1px solid #ccc";
    div.style.borderRadius = "12px";
    div.innerHTML = `
      <input type="text" value="${escapeHtml(q.question)}" class="edit-question-text" style="width:100%; margin-bottom:8px; padding:8px;">
      <input type="text" value="${escapeHtml(q.answers[0])}" class="edit-answer" data-ans="0" style="width:100%; margin-bottom:4px; padding:8px;">
      <input type="text" value="${escapeHtml(q.answers[1])}" class="edit-answer" data-ans="1" style="width:100%; margin-bottom:4px; padding:8px;">
      <input type="text" value="${escapeHtml(q.answers[2])}" class="edit-answer" data-ans="2" style="width:100%; margin-bottom:4px; padding:8px;">
      <input type="text" value="${escapeHtml(q.answers[3])}" class="edit-answer" data-ans="3" style="width:100%; margin-bottom:8px; padding:8px;">
      <input type="number" value="${q.correct}" min="0" max="3" class="edit-correct" style="width:100%; margin-bottom:12px; padding:8px;">
      <div style="display: flex; gap: 10px;">
        <button class="save-question-btn" data-subject="${subject}" data-difficulty="${difficulty}" data-index="${idx}" style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">Save Changes</button>
        <button class="delete-question-btn" data-subject="${subject}" data-difficulty="${difficulty}" data-index="${idx}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">Delete Question</button>
      </div>
    `;
    container.appendChild(div);
    
    const saveBtn = div.querySelector('.save-question-btn');
    saveBtn.addEventListener('click', () => {
      const idx = parseInt(saveBtn.dataset.index);
      const subject = saveBtn.dataset.subject;
      const difficulty = saveBtn.dataset.difficulty;
      const questionText = div.querySelector('.edit-question-text').value;
      const answers = Array.from(div.querySelectorAll('.edit-answer')).map(inp => inp.value);
      const correct = parseInt(div.querySelector('.edit-correct').value);
      if (!questionText || answers.some(a => !a) || isNaN(correct)) {
        alert("All fields must be filled.");
        return;
      }
      modifyAndSave(() => {
        questionBank[subject][difficulty][idx] = {
          question: questionText,
          answers: answers,
          correct: correct
        };
      });
      addLog("Question saved.");
      renderQuestionEditor();
    });
    
    const deleteBtn = div.querySelector('.delete-question-btn');
    deleteBtn.addEventListener('click', () => {
      const idx = parseInt(deleteBtn.dataset.index);
      const subject = deleteBtn.dataset.subject;
      const difficulty = deleteBtn.dataset.difficulty;
      if (confirm("Delete this question permanently?")) {
        modifyAndSave(() => {
          questionBank[subject][difficulty].splice(idx, 1);
        });
        addLog("Question deleted.");
        renderQuestionEditor();
      }
    });
  });
}
function addNewQuestion() {
  if (!questionBank) return;
  const subject = getEl("editorSubjectSelect").value;
  const difficulty = getEl("editorDifficultySelect").value;
  const qText = getEl("newQuestionText").value;
  const answers = [
    getEl("answer1").value,
    getEl("answer2").value,
    getEl("answer3").value,
    getEl("answer4").value
  ];
  const correct = parseInt(getEl("correctAnswer").value);
  if (!qText || answers.some(a => !a) || isNaN(correct)) {
    alert("Fill all fields.");
    return;
  }
  modifyAndSave(() => {
    if (!questionBank[subject]) questionBank[subject] = {};
    if (!questionBank[subject][difficulty]) questionBank[subject][difficulty] = [];
    questionBank[subject][difficulty].push({ question: qText, answers, correct });
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
function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

// ========== AUTH HANDLERS ==========
async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Welcome back, ${userCredential.user.email}!`, true);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  } catch (error) {
    let errorMsg = "Login failed. ";
    if (error.code === 'auth/user-not-found') errorMsg += "No account found.";
    else if (error.code === 'auth/wrong-password') errorMsg += "Incorrect password.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}
async function handleRegister(email, password) {
  if (!email || !password) return showAuthMessage("Enter email and password.", false);
  if (password.length < 6) return showAuthMessage("Password must be ≥6 characters.", false);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    showAuthMessage(`Account created for ${userCredential.user.email}!`, true);
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  } catch (error) {
    let errorMsg = "Registration failed. ";
    if (error.code === 'auth/email-already-in-use') errorMsg += "Email already registered.";
    else if (error.code === 'auth/invalid-email') errorMsg += "Invalid email.";
    else errorMsg += error.message;
    showAuthMessage(errorMsg, false);
  }
}

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      await loadQuestionBankFromFirestore();
    } catch (err) { console.error(err); }
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    addLog(`Logged in as ${user.email}`);
  } else {
    currentUser = null;
    questionBank = getDefaultQuestionBank();
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    addLog("Logged out");
  }
});

// ========== INITIALIZE UI ==========
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = getEl("loginBtn");
  const registerBtn = getEl("registerBtn");
  const logoutBtn = getEl("logoutBtn");
  const startBtn = getEl("startQuizBtn");
  const openEditorBtn = getEl("openEditorBtn");
  const closeEditorBtn = getEl("closeEditorBtn");
  const loadQuestionsBtn = getEl("loadQuestionsBtn");
  const addQuestionBtn = getEl("addQuestionBtn");
  const backToHomeBtn = getEl("backToHomeBtn");
  const togglePassword = getEl("togglePassword");
  const googleSignInBtn = getEl("googleSignInBtn");
  const addSubjectBtn = getEl("addSubjectBtn");

  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const pwd = getEl("loginPassword");
      const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
      pwd.setAttribute('type', type);
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
  if (loginBtn) loginBtn.addEventListener('click', () => handleLogin(getEl("loginEmail").value, getEl("loginPassword").value));
  if (registerBtn) registerBtn.addEventListener('click', () => handleRegister(getEl("loginEmail").value, getEl("loginPassword").value));
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        showAuthMessage(`Welcome, ${result.user.displayName || result.user.email}!`, true);
      } catch (err) {
        let msg = "Google sign-in failed. ";
        if (err.code === 'auth/popup-blocked') msg += "Pop‑up blocked. Allow pop-ups.";
        else if (err.code === 'auth/unauthorized-domain') msg += "Domain not authorized in Firebase.";
        else msg += err.message;
        showAuthMessage(msg, false);
      }
    });
  }
  if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));
  if (startBtn) startBtn.addEventListener('click', startQuizApp);
  if (openEditorBtn) openEditorBtn.addEventListener('click', openQuestionEditor);
  if (closeEditorBtn) closeEditorBtn.addEventListener('click', closeQuestionEditor);
  if (loadQuestionsBtn) loadQuestionsBtn.addEventListener('click', renderQuestionEditor);
  if (addQuestionBtn) addQuestionBtn.addEventListener('click', addNewQuestion);
  if (backToHomeBtn) backToHomeBtn.addEventListener('click', returnToHome);
  if (addSubjectBtn) addSubjectBtn.addEventListener('click', addNewSubject);
});