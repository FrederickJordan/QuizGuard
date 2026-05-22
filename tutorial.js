// tutorial.js - Quiz Tutorial Guide
import { startQuiz } from './quiz.js';

// Tutorial content data
const tutorialSections = [
  {
    icon: "🛡️",
    title: "Anti-Cheat Rules",
    content: `
      <div style="margin-bottom: 20px;">
        <div style="background: #fef2f2; padding: 15px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
          <strong style="color: #dc2626;">⚠️ Fullscreen Required</strong>
          <p style="margin-top: 8px; color: #475569;">When you start a quiz, the browser will enter fullscreen mode. This ensures you stay focused on the quiz.</p>
        </div>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
          <strong style="color: #d97706;">⚠️ First Offense - Warning</strong>
          <p style="margin-top: 8px; color: #475569;">If you exit fullscreen or switch tabs the FIRST time, you'll get a warning. You can continue, but the current question will be SKIPPED and a new question will be provided.</p>
        </div>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid #dc2626;">
          <strong style="color: #dc2626;">⚠️ Second Offense - Penalty</strong>
          <p style="margin-top: 8px; color: #475569;">If you exit fullscreen or switch tabs a SECOND time during the same quiz, you'll receive an automatic PENALTY (-5 points) and the question will be skipped.</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 16px; border-left: 4px solid #22c55e;">
          <strong style="color: #16a34a;">✅ Fair Play</strong>
          <p style="margin-top: 8px; color: #475569;">The system tracks tab switches and fullscreen exits. Stay in fullscreen mode throughout the quiz for the best experience!</p>
        </div>
      </div>
    `
  },
  {
    icon: "🎮",
    title: "Minigames",
    content: `
      <div style="margin-bottom: 20px;">
        <p style="margin-bottom: 20px; color: #475569;">While answering questions, you must keep playing an active minigame. Ignoring the minigame will cause penalties!</p>
        
        <div style="background: #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <div style="font-size: 40px;">🎭</div>
            <div>
              <strong style="font-size: 18px;">Find The Ball</strong>
              <p style="color: #64748b; margin-top: 5px;">A ball is hidden under one of three cups. Click the correct cup to refill the gauge!</p>
            </div>
          </div>
          <ul style="margin-left: 20px; color: #475569;">
            <li>Gauge drains over time - click the correct cup to refill it</li>
            <li>If gauge reaches 0, you get a penalty</li>
            <li>Correct cup refills gauge and ball moves to a new random cup</li>
            <li>Wrong cup = penalty and ball resets</li>
          </ul>
        </div>
        
        <div style="background: #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
            <div style="font-size: 40px;">⌨️</div>
            <div>
              <strong style="font-size: 18px;">QTE Pressure Gauge</strong>
              <p style="color: #64748b; margin-top: 5px;">Press the correct key on your keyboard to keep the gauge from emptying!</p>
            </div>
          </div>
          <ul style="margin-left: 20px; color: #475569;">
            <li>A random letter (A-Z) will appear on screen</li>
            <li>Press that key on your keyboard to refill the gauge</li>
            <li>Gauge drains over time - press the correct key before it reaches 0</li>
            <li>If gauge reaches 0, you get a penalty and a new key appears</li>
            <li>Each correct key press gives +35% gauge and changes the target key</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    icon: "📝",
    title: "Quiz Rules",
    content: `
      <div style="margin-bottom: 20px;">
        <ul style="margin-left: 20px; color: #475569;">
          <li style="margin-bottom: 12px;">You have to answer all questions to complete the quiz</li>
          <li style="margin-bottom: 12px;">Each correct answer gives points toward your final score (max 100)</li>
          <li style="margin-bottom: 12px;">Wrong answers will be recorded and AI feedback will be provided at the end</li>
          <li style="margin-bottom: 12px;">Each penalty reduces your score by 5 points</li>
          <li style="margin-bottom: 12px;">Copy, paste, and cut actions are blocked during the quiz</li>
          <li style="margin-bottom: 12px;">Your quiz results are saved and can be viewed in "My History"</li>
        </ul>
      </div>
    `
  },
  {
    icon: "👨‍🏫",
    title: "For Teachers",
    content: `
      <div style="margin-bottom: 20px;">
        <ul style="margin-left: 20px; color: #475569;">
          <li style="margin-bottom: 12px;">Register as a "Teacher" to access the Question Editor</li>
          <li style="margin-bottom: 12px;">Add subjects and questions by difficulty (Easy, Medium, Hard)</li>
          <li style="margin-bottom: 12px;">Publish a quiz to generate a 6-digit code</li>
          <li style="margin-bottom: 12px;">Share the code with your students</li>
          <li style="margin-bottom: 12px;">View student results in the "Quiz Results" dashboard</li>
          <li style="margin-bottom: 12px;">Search individual student history by email</li>
        </ul>
      </div>
    `
  }
];

let currentPage = 0;

function renderTutorial() {
  const container = document.getElementById('tutorialContent');
  const section = tutorialSections[currentPage];
  
  if (!container) return;
  
  // Progress indicators
  let progressHtml = '<div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">';
  for (let i = 0; i < tutorialSections.length; i++) {
    progressHtml += `
      <div style="width: 40px; height: 4px; background: ${i === currentPage ? '#2563eb' : '#e2e8f0'}; border-radius: 2px;"></div>
    `;
  }
  progressHtml += '</div>';
  
  container.innerHTML = progressHtml + `
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 48px; margin-bottom: 10px;">${section.icon}</div>
      <h2 style="color: #1e293b;">${section.title}</h2>
    </div>
    ${section.content}
  `;
  
  // Update navigation buttons
  const prevBtn = document.getElementById('tutorialPrev');
  const nextBtn = document.getElementById('tutorialNext');
  const startBtn = document.getElementById('startQuizFromTutorial');
  
  if (prevBtn) {
    prevBtn.style.display = currentPage === 0 ? 'none' : 'inline-flex';
  }
  
  if (nextBtn) {
    nextBtn.style.display = currentPage === tutorialSections.length - 1 ? 'none' : 'inline-flex';
  }
  
  if (startBtn) {
    startBtn.style.display = currentPage === tutorialSections.length - 1 ? 'inline-flex' : 'none';
  }
}

function nextPage() {
  if (currentPage < tutorialSections.length - 1) {
    currentPage++;
    renderTutorial();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderTutorial();
  }
}

function closeTutorial() {
  document.getElementById('tutorialModal').style.display = 'none';
}

function openTutorial(startQuizAfterClose = false) {
  currentPage = 0;
  renderTutorial();
  document.getElementById('tutorialModal').style.display = 'block';
  
  // Store if we should start quiz after tutorial
  if (startQuizAfterClose) {
    window.startQuizAfterTutorial = true;
  }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check if first time user (no tutorial viewed)
  const hasSeenTutorial = localStorage.getItem('quizguard_tutorial_seen');
  
  // Tutorial navigation buttons
  const prevBtn = document.createElement('button');
  prevBtn.id = 'tutorialPrev';
  prevBtn.className = 'home-btn editor-btn';
  prevBtn.innerHTML = '← Previous';
  prevBtn.onclick = prevPage;
  
  const nextBtn = document.createElement('button');
  nextBtn.id = 'tutorialNext';
  nextBtn.className = 'home-btn start-btn';
  nextBtn.innerHTML = 'Next →';
  nextBtn.onclick = nextPage;
  
  const closeBtn = document.getElementById('closeTutorialBtn');
  if (closeBtn) closeBtn.onclick = closeTutorial;
  
  const closeX = document.getElementById('closeTutorial');
  if (closeX) closeX.onclick = closeTutorial;
  
  const startBtn = document.getElementById('startQuizFromTutorial');
  if (startBtn) {
    startBtn.onclick = () => {
      closeTutorial();
      // Trigger start quiz
      const startQuizBtn = document.getElementById('startQuizBtn');
      if (startQuizBtn) startQuizBtn.click();
    };
  }
  
  // Add navigation buttons to modal
  const buttonContainer = document.querySelector('#tutorialModal .home-buttons, #tutorialModal > div > div:last-child');
  const modalDiv = document.querySelector('#tutorialModal > div');
  if (modalDiv && !document.getElementById('tutorialNavButtons')) {
    const navDiv = document.createElement('div');
    navDiv.id = 'tutorialNavButtons';
    navDiv.style.display = 'flex';
    navDiv.style.gap = '15px';
    navDiv.style.justifyContent = 'center';
    navDiv.style.marginTop = '30px';
    navDiv.style.paddingTop = '20px';
    navDiv.style.borderTop = '1px solid #e2e8f0';
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);
    
    // Insert before the close button row
    const closeRow = modalDiv.querySelector('#tutorialModal > div > div:last-child');
    if (closeRow) {
      modalDiv.insertBefore(navDiv, closeRow);
    } else {
      modalDiv.appendChild(navDiv);
    }
  }
  
  // Show tutorial automatically for first-time users
  if (!hasSeenTutorial) {
    setTimeout(() => {
      openTutorial();
      localStorage.setItem('quizguard_tutorial_seen', 'true');
    }, 500);
  }
  
  // Tutorial button handler
  const tutorialBtn = document.getElementById('tutorialBtn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => openTutorial(false));
  }
});

export { openTutorial };
