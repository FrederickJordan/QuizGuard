import { getEl, addLog, showGaugeWarning } from './utils.js';

let cupTimerInterval = null;
let cupGauge = 100;
let cupBallIndex = 0;
let qteInterval = null;
let qteGauge = 100;
let targetKey = "A";
let currentGameMode = "cups";
let quizPaused = false;
let applyPenaltyCallback = null;

export function setMinigameQuizPaused(paused) { quizPaused = paused; }
export function setApplyPenaltyCallback(callback) { applyPenaltyCallback = callback; }

export function stopMinigames() {
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  if (qteInterval) clearInterval(qteInterval);
}

export function startCupGame() {
  currentGameMode = "cups";
  getEl("gameTitle").textContent = "Find The Ball";
  getEl("gameDescription").textContent = "Click correct cup before gauge empties! Correct refills and moves ball.";
  getEl("gameArea").innerHTML = `
    <div style="display: flex; flex-direction: row; align-items: center; gap: 30px;">
      <div class="cups-container" id="cupsContainer"></div>
      <div class="gauge-box" style="width: 200px;"><div class="gauge-fill" id="cupGaugeFill"></div></div>
    </div>
  `;
  const container = getEl("cupsContainer");
  for (let i = 0; i < 3; i++) {
    const cup = document.createElement("div");
    cup.className = "cup";
    cup.addEventListener("click", () => handleCupClick(i));
    container.appendChild(cup);
  }
  resetCupGameRound();
  cupGauge = 100;
  if (cupTimerInterval) clearInterval(cupTimerInterval);
  cupTimerInterval = setInterval(() => {
    if (quizPaused || getEl("quizApp").style.display !== "flex") return;
    cupGauge -= 1;
    if (cupGauge < 0) cupGauge = 0;
    const fill = getEl("cupGaugeFill");
    if (fill) fill.style.width = cupGauge + "%";
    if (cupGauge <= 20 && cupGauge > 0) showGaugeWarning("⚠️ Cup low! Click cup!");
    if (cupGauge <= 0) {
      if (applyPenaltyCallback) applyPenaltyCallback("Cup gauge emptied");
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
  if (quizPaused) return;
  if (index === cupBallIndex) {
    addLog("Correct cup! Ball moves, gauge refills.");
    resetCupGameRound();
  } else {
    if (applyPenaltyCallback) applyPenaltyCallback("Wrong cup");
    resetCupGameRound();
  }
}

export function startQTEGame() {
  currentGameMode = "qte";
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
    if (quizPaused || getEl("quizApp").style.display !== "flex") return;
    qteGauge -= 1;
    if (qteGauge < 0) qteGauge = 0;
    const fillEl = getEl("qteGaugeFill");
    if (fillEl) fillEl.style.width = qteGauge + "%";
    if (qteGauge <= 20 && qteGauge > 0) showGaugeWarning("⚠️ QTE low! Press key!");
    if (qteGauge <= 0) {
      if (applyPenaltyCallback) applyPenaltyCallback("QTE gauge emptied");
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
  if (quizPaused) return;
  if (getEl("quizApp").style.display !== "flex") return;
  if (currentGameMode !== "qte") return;
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