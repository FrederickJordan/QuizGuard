import { getEl, escapeHtml, addLog } from './utils.js';
import { questionBank, modifyAndSave } from './questionBank.js';
import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export function renderSubjectsList() {
  const container = getEl('subjectsList');
  if (!container || !questionBank) return;
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
  await modifyAndSave(() => {});
  renderSubjectsList();
  updateSubjectDropdowns();
  addLog(`Subject "${oldName}" renamed to "${newName}"`);
}

async function deleteSubject(subject) {
  if (!questionBank[subject]) return;
  delete questionBank[subject];
  await modifyAndSave(() => {});
  renderSubjectsList();
  updateSubjectDropdowns();
  const editorSubject = getEl('editorSubjectSelect');
  if (editorSubject && editorSubject.value === subject) {
    const firstSubj = Object.keys(questionBank)[0];
    if (firstSubj) editorSubject.value = firstSubj;
    renderQuestionEditor();
  }
  addLog(`Subject "${subject}" deleted and saved to cloud.`);
}

export async function addNewSubject() {
  const input = getEl('newSubjectName');
  const name = input.value.trim();
  if (!name) {
    alert('Please enter a subject name.');
    return;
  }
  if (questionBank[name]) {
    alert('Subject already exists.');
    return;
  }
  questionBank[name] = { easy: [], medium: [], hard: [] };
  await modifyAndSave(() => {});
  input.value = '';
  renderSubjectsList();
  updateSubjectDropdowns();
  addLog(`New subject "${name}" added.`);
}

export function updateSubjectDropdowns() {
  if (!questionBank) return;
  const subjects = Object.keys(questionBank);
  const subjectSelects = ['subjectSelect', 'editorSubjectSelect'];
  for (let id of subjectSelects) {
    const select = getEl(id);
    if (select) {
      const current = select.value;
      select.innerHTML = subjects.map(s => `<option value="${s}">${escapeHtml(s)}</option>`).join('');
      if (subjects.includes(current)) select.value = current;
      else if (subjects.length) select.value = subjects[0];
    }
  }
}

export function renderQuestionEditor() {
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

    div.querySelector('.save-question-btn').addEventListener('click', () => {
      const idx = parseInt(div.querySelector('.save-question-btn').dataset.index);
      const subject = div.querySelector('.save-question-btn').dataset.subject;
      const difficulty = div.querySelector('.save-question-btn').dataset.difficulty;
      const newText = div.querySelector('.edit-question-text').value;
      const newAnswers = Array.from(div.querySelectorAll('.edit-answer')).map(inp => inp.value);
      const newCorrect = parseInt(div.querySelector('.edit-correct').value);
      if (!newText || newAnswers.some(a => !a) || isNaN(newCorrect)) {
        alert("All fields must be filled.");
        return;
      }
      modifyAndSave(() => {
        questionBank[subject][difficulty][idx] = {
          question: newText,
          answers: newAnswers,
          correct: newCorrect
        };
      });
      addLog("Question saved.");
      renderQuestionEditor();
    });

    div.querySelector('.delete-question-btn').addEventListener('click', () => {
      const idx = parseInt(div.querySelector('.delete-question-btn').dataset.index);
      const subject = div.querySelector('.delete-question-btn').dataset.subject;
      const difficulty = div.querySelector('.delete-question-btn').dataset.difficulty;
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

// Publish quiz (teacher only)
const publishBtn = getEl("publishQuizBtn");
if (publishBtn) {
  publishBtn.addEventListener('click', async () => {
    const subject = getEl("editorSubjectSelect").value;
    const difficulty = getEl("editorDifficultySelect").value;
    const questions = questionBank[subject]?.[difficulty];
    if (!questions || questions.length === 0) {
      alert("No questions in this quiz to publish.");
      return;
    }
    const teacherUid = auth.currentUser?.uid;
    if (!teacherUid) {
      alert("You must be logged in as a teacher.");
      return;
    }
    let code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeQuery = query(collection(db, "quizCodes"), where("code", "==", code));
    const existing = await getDocs(codeQuery);
    if (!existing.empty) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }
    await addDoc(collection(db, "quizCodes"), {
      code: code,
      creatorUid: teacherUid,
      subject: subject,
      difficulty: difficulty,
      questions: questions,
      createdAt: new Date().toISOString()
    });
    const msgDiv = getEl("publishMessage");
    if (msgDiv) {
      msgDiv.innerHTML = `✅ Quiz published! Code: <strong>${code}</strong> (share with students)`;
      setTimeout(() => msgDiv.innerHTML = "", 8000);
    }
    addLog(`Quiz published with code ${code}`);
  });
}

export function addNewQuestion() {
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
