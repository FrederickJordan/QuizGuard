import { getEl, addLog } from './utils.js';

let waitingForFullscreen = false;
let waitingForFocus = false;
let quizActive = false;
let quizPaused = false;
let fullscreenExitAttempts = 0;
let shouldFailOnFullscreenResume = false;
let pendingFailureCallback = null;
let minigamePauseCallback = null;

export function setQuizActive(active) { quizActive = active; }
export function setQuizPaused(paused) { quizPaused = paused; }
export function setPendingFailureCallback(callback) { pendingFailureCallback = callback; }
export function setMinigamePauseCallback(callback) { minigamePauseCallback = callback; }
export function resetFullscreenExitAttempts() {
  fullscreenExitAttempts = 0;
  shouldFailOnFullscreenResume = false;
  waitingForFullscreen = false;
  waitingForFocus = false;
}

export function requestFullscreenMode() {
  const element = document.documentElement;
  if (!element.requestFullscreen) return Promise.reject(new Error("Fullscreen unsupported"));
  return element.requestFullscreen();
}

export function showPauseOverlay(message, showContinueButton = false) {
  const overlay = getEl('pauseOverlay');
  const title = getEl('pauseOverlayTitle');
  const msg = getEl('pauseOverlayMessage');
  const continueBtn = getEl('pauseOverlayContinue');
  if (!overlay || !title || !msg || !continueBtn) return;
  title.textContent = showContinueButton ? 'Warning!' : 'Quiz Paused';
  msg.textContent = message;
  continueBtn.style.display = showContinueButton ? 'inline-flex' : 'none';
  overlay.style.display = 'flex';
}

export function hidePauseOverlay() {
  const overlay = getEl('pauseOverlay');
  if (overlay) overlay.style.display = 'none';
}

export function handleFullscreenExit() {
  if (!quizActive || waitingForFullscreen || waitingForFocus) return;
  fullscreenExitAttempts++;
  waitingForFullscreen = true;

  if (fullscreenExitAttempts === 1) {
    if (minigamePauseCallback) minigamePauseCallback(false);
    showPauseOverlay('Warning! Fullscreen is required. This is your first exit. Click continue to re-enter fullscreen and proceed.', true);
    return;
  }

  quizPaused = true;
  if (minigamePauseCallback) minigamePauseCallback(true);
  shouldFailOnFullscreenResume = true;
  showPauseOverlay('Warning! Fullscreen exited again. The question will be marked wrong. Click continue to re-enter fullscreen and proceed.', true);
}

export function handleTabSwitch() {
  if (!quizActive || waitingForFullscreen || waitingForFocus) return;
  waitingForFocus = true;
  quizPaused = true;
  const tabSwitchesSpan = getEl("tabSwitches");
  if (tabSwitchesSpan) {
    let val = parseInt(tabSwitchesSpan.textContent) || 0;
    tabSwitchesSpan.textContent = val + 1;
  }
  if (pendingFailureCallback) pendingFailureCallback('Tab switched away');
  showPauseOverlay('Tab switched away from the quiz. Return to this window to continue.', false);
}

export function resumeAfterVisibilityReturn() {
  if (!waitingForFocus) return;
  waitingForFocus = false;
  hidePauseOverlay();
  if (!document.fullscreenElement) {
    waitingForFullscreen = true;
    showPauseOverlay('You returned to the quiz, but fullscreen is required. Click continue to enter fullscreen and proceed.', true);
    return;
  }
  quizPaused = false;
  if (typeof window.loadQuestion === 'function') window.loadQuestion();
  addLog('Resumed quiz after returning to tab.');
}

export function resumeAfterFullscreenReturn() {
  if (!waitingForFullscreen) return;
  if (!document.fullscreenElement) return;
  waitingForFullscreen = false;
  hidePauseOverlay();
  quizPaused = false;
  if (minigamePauseCallback) minigamePauseCallback(false);
  if (shouldFailOnFullscreenResume && pendingFailureCallback) {
    pendingFailureCallback('Fullscreen exited twice');
    shouldFailOnFullscreenResume = false;
  }
  if (typeof window.loadQuestion === 'function') window.loadQuestion();
  addLog('Resumed quiz in fullscreen.');
}

// Attach global listeners
document.addEventListener("visibilitychange", () => {
  if (document.hidden && getEl("quizApp")?.style.display === "flex") {
    handleTabSwitch();
  } else if (!document.hidden) {
    resumeAfterVisibilityReturn();
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!quizActive) return;
  if (!document.fullscreenElement) {
    if (!waitingForFocus && !waitingForFullscreen && getEl("quizApp")?.style.display === "flex") {
      handleFullscreenExit();
    }
  } else {
    resumeAfterFullscreenReturn();
  }
});

["copy", "paste", "cut"].forEach(ev => {
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    addLog(`${ev} blocked`);
  });
});
