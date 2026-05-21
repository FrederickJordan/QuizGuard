// historyLog.js - Student Quiz History Log
import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Wait for auth state and load history
onAuthStateChanged(auth, async (user) => {
  const container = document.getElementById('historyLogContainer');
  
  if (!user) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
        <p style="font-size: 18px; color: #64748b;">Please log in to view your quiz history.</p>
        <button class="home-btn start-btn" onclick="window.location.href='index.html'" style="margin-top: 20px;">Go to Login</button>
      </div>
    `;
    return;
  }
  
  try {
    // Fetch user's quiz results
    const q = query(
      collection(db, "quizResults"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
          <p style="font-size: 18px; color: #64748b;">You haven't taken any quizzes yet.</p>
          <p style="color: #9ca3af; margin-top: 8px;">Join a quiz using a code from your teacher to get started!</p>
          <button class="home-btn start-btn" onclick="window.location.href='index.html'" style="margin-top: 20px;">Take a Quiz</button>
        </div>
      `;
      return;
    }
    
    // Calculate statistics
    let totalScore = 0;
    let quizCount = 0;
    let totalPenalties = 0;
    let totalTabSwitches = 0;
    let bestScore = 0;
    
    let historyHtml = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.timestamp).toLocaleString();
      const scoreColor = data.score >= 70 ? '#22c55e' : (data.score >= 40 ? '#f59e0b' : '#ef4444');
      
      totalScore += data.score;
      quizCount++;
      totalPenalties += data.penalties || 0;
      totalTabSwitches += data.tabSwitches || 0;
      if (data.score > bestScore) bestScore = data.score;
      
      historyHtml += `
        <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; border-left: 4px solid ${scoreColor}; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
            <div>
              <strong style="font-size: 18px; color: #1e293b;">${escapeHtml(data.subject || 'Unknown Subject')}</strong>
              <span style="background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 10px;">${escapeHtml(data.difficulty || 'Unknown')}</span>
              ${data.code ? `<span style="background: #dbeafe; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-left: 5px;">Code: ${data.code}</span>` : ''}
            </div>
            <div style="font-size: 28px; font-weight: bold; color: ${scoreColor};">${data.score}/100</div>
          </div>
          
          <div style="display: flex; gap: 25px; flex-wrap: wrap; color: #64748b; font-size: 13px; margin-bottom: 12px;">
            <div>📅 ${date}</div>
            <div>⚠️ Penalties: ${data.penalties || 0}</div>
            <div>🔄 Tab Switches: ${data.tabSwitches || 0}</div>
            <div>❌ Wrong: ${data.wrongAnswers?.length || 0}</div>
          </div>
          
          ${data.wrongAnswers && data.wrongAnswers.length > 0 ? `
            <details style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <summary style="cursor: pointer; color: #2563eb; font-size: 14px; font-weight: 500;">📝 Show Wrong Answers (${data.wrongAnswers.length})</summary>
              <div style="margin-top: 12px; padding-left: 12px; border-left: 3px solid #ef4444;">
                ${data.wrongAnswers.map((item, idx) => `
                  <div style="margin-bottom: 15px;">
                    <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">Q${idx + 1}: ${escapeHtml(item.question)}</div>
                    <div style="color: #dc2626; font-size: 13px;">❌ Your answer: ${escapeHtml(item.selectedAnswer)}</div>
                    <div style="color: #16a34a; font-size: 13px;">✅ Correct: ${escapeHtml(item.correctAnswer)}</div>
                  </div>
                `).join('')}
              </div>
            </details>
          ` : ''}
        </div>
      `;
    });
    
    const avgScore = (totalScore / quizCount).toFixed(1);
    
    const finalHtml = `
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; border-radius: 20px; padding: 25px; margin-bottom: 25px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; text-align: center;">
          <div>
            <div style="font-size: 13px; opacity: 0.9;">Average Score</div>
            <div style="font-size: 32px; font-weight: bold;">${avgScore}</div>
          </div>
          <div>
            <div style="font-size: 13px; opacity: 0.9;">Best Score</div>
            <div style="font-size: 32px; font-weight: bold;">${bestScore}</div>
          </div>
          <div>
            <div style="font-size: 13px; opacity: 0.9;">Quizzes Taken</div>
            <div style="font-size: 32px; font-weight: bold;">${quizCount}</div>
          </div>
          <div>
            <div style="font-size: 13px; opacity: 0.9;">Total Penalties</div>
            <div style="font-size: 32px; font-weight: bold;">${totalPenalties}</div>
          </div>
        </div>
      </div>
      ${historyHtml}
    `;
    
    container.innerHTML = finalHtml;
    
  } catch (error) {
    console.error('Error loading history:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <p style="font-size: 18px; color: #dc2626;">Error loading your history.</p>
        <button class="home-btn start-btn" onclick="location.reload()" style="margin-top: 20px;">Retry</button>
      </div>
    `;
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Close history log
document.getElementById('closeHistoryLog')?.addEventListener('click', () => {
  document.getElementById('historyLogOverlay').style.display = 'none';
});

document.getElementById('historyLogOverlay')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('historyLogOverlay')) {
    document.getElementById('historyLogOverlay').style.display = 'none';
  }
});
