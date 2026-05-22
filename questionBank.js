import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { addLog } from './utils.js';

export let questionBank = null;

export function getDefaultQuestionBank() {
  return {
    math: {
      easy: [
        { question: "What is 3²?", answers: ["9", "6", "8", "12"], correct: 0 },
        { question: "What is 50% of 200?", answers: ["100", "50", "150", "25"], correct: 0 },
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

export async function saveQuestionBankToFirestore() {
  if (!auth.currentUser) return;
  const userDocRef = doc(db, "users", auth.currentUser.uid);
  await setDoc(userDocRef, { questionBank }, { merge: true });
  addLog("Question bank saved.");
}

export async function loadQuestionBankFromFirestore() {
  if (!auth.currentUser) return;
  const userDocRef = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists() && docSnap.data().questionBank) {
    questionBank = docSnap.data().questionBank;
    addLog("Loaded from cloud.");
  } else {
    questionBank = getDefaultQuestionBank();
    await setDoc(userDocRef, { questionBank }, { merge: true });
    addLog("Default bank created.");
  }
}

export function modifyAndSave(callback) {
  callback();
  saveQuestionBankToFirestore();
}
