import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Close button
  const closeBtn = document.getElementById('closeHistoryLog');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const overlay = document.getElementById('historyLogOverlay');
      if (overlay) overlay.style.display = 'none';
    });
  }

  // Click outside to close
  const overlay = document.getElementById('historyLogOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
});

// Function to load history
async function loadHistory() {
  const container = document.getElementById('historyLogContainer');
  if (!container) return;

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = `<div style="text-align:center; padding:40px;">Please log in to view history.</div>`;
    return;
  }

  try {
    const q = query(
      collection(db, "quizResults"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      container.innerHTML = `<div style="text-align:center; padding:40px;">No quiz history found.</div>`;
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.timestamp).toLocaleString();
      const scoreColor = data.score >= 70 ? '#22c55e' : (data.score >= 40 ? '#f59e0b' : '#ef4444');
      html += `
        <div style="background:white; border-radius:16px; padding:20px; margin-bottom:15px; border-left:4px solid ${scoreColor};">
          <div style="display:flex; justify-content:space-between;">
            <strong>${escapeHtml(data.subject || 'Quiz')}</strong>
            <span style="font-size:24px;">${data.score}/100</span>
          </div>
          <div style="color:#64748b; font-size:13px;">${date}</div>
          <div>Penalties: ${data.penalties || 0} | Tab switches: ${data.tabSwitches || 0}</div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="text-align:center; padding:40px;">Error loading history.</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Load history when the overlay becomes visible (optional: load every time)
// But we can load immediately
loadHistory();
