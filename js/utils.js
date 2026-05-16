export function getEl(id) {
  return document.getElementById(id);
}

export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
}

export function addLog(message) {
  const logArea = getEl("logArea");
  if (!logArea) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.innerHTML = `<strong>[${time}]</strong> ${message}`;
  logArea.prepend(entry);
  while (logArea.children.length > 10) logArea.removeChild(logArea.lastChild);
}

let lastWarningTime = 0;
const WARNING_COOLDOWN_MS = 2000;

export function showGaugeWarning(message) {
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