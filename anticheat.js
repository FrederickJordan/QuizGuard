import { getEl, addLog } from './utils.js';

let waitingForFullscreen = false;
let waitingForFocus = false;
let quizActive = false;
let quizPaused = false;
let fullscreenExitAttempts = 0;
let shouldFailOnFullscreenResume = false;
let pendingFailureCallback = null;
let minigamePauseCallback = null;
let failureTriggered = false;
let failureQueue = []; // Queue for multiple failures

export function setQuizActive(active) { quizActive = active; }
export function setQuizPaused(paused) { quizPaused = paused; }
export function setPendingFailureCallback(callback) { pendingFailureCallback = callback; }
export function setMinigamePauseCallback(callback) { minigamePauseCallback = callback; }

export function resetFullscreenExitAttempts() {
  fullscreenExitAttempts = 0;
  shouldFailOnFullscreenResume = false;
  waitingForFullscreen = false;
  waitingForFocus = false;
  failureTriggered = false;
  failureQueue = [];
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
  overlay.style.background = showContinueButton ? '#000000' : 'rgba(0, 0, 0, 0.9)';
  overlay.style.display = 'flex';
}

export function hidePauseOverlay() {
  const overlay = getEl('pauseOverlay');
  if (overlay) overlay.style.display = 'none';
}

function triggerFailure(reason) {
  console.log(`🔴 triggerFailure called with reason: ${reason}`);
  console.log(`   pendingFailureCallback exists: ${!!pendingFailureCallback}`);
  console.log(`   failureTriggered: ${failureTriggered}`);
  
  if (pendingFailureCallback && !failureTriggered) {
    failureTriggered = true;
    console.log(`   ✅ Triggering failure callback for: ${reason}`);
    pendingFailureCallback(reason);
    
    // Reset trigger after a short delay to allow for next question
    setTimeout(() => {
      failureTriggered = false;
      console.log(`   🔓 failureTriggered reset after timeout`);
    }, 500);
  } else if (!pendingFailureCallback) {
    console.log(`   ❌ No pendingFailureCallback set!`);
  } else if (failureTriggered) {
    console.log(`   ⚠️ Failure already triggered, queuing for next question`);
    // Queue the failure for the next question
    failureQueue.push(reason);
    setTimeout(() => {
      if (failureQueue.length > 0 && pendingFailureCallback) {
        const queuedReason = failureQueue.shift();
        console.log(`   🔄 Processing queued failure: ${queuedReason}`);
        pendingFailureCallback(queuedReason);
      }
    }, 100);
  }
}

export function handleFullscreenExit() {
  console.log(`🖥️ handleFullscreenExit called. quizActive: ${quizActive}, waitingForFullscreen: ${waitingForFullscreen}, waitingForFocus: ${waitingForFocus}`);
  console.log(`   fullscreenExitAttempts: ${fullscreenExitAttempts}`);
  
  if (!quizActive || waitingForFullscreen || waitingForFocus) {
    console.log(`   ⚠️ Ignoring fullscreen exit - conditions not met`);
    return;
  }
  
  fullscreenExitAttempts++;
  waitingForFullscreen = true;
  console.log(`   fullscreenExitAttempts now: ${fullscreenExitAttempts}`);

  if (fullscreenExitAttempts === 1) {
    if (minigamePauseCallback) minigamePauseCallback(false);
    showPauseOverlay('Warning! Fullscreen is required. This is your first exit. Click continue to re-enter fullscreen and proceed.', true);
    console.log(`   📢 First fullscreen exit - showing warning only`);
    return;
  }

  // For second and subsequent exits, trigger failure
  console.log(`   🚨 Second+ fullscreen exit - triggering failure`);
  quizPaused = true;
  if (minigamePauseCallback) minigamePauseCallback(true);
  shouldFailOnFullscreenResume = true;
  
  // Trigger failure immediately
  triggerFailure('Fullscreen exited twice');
  
  showPauseOverlay('Warning! Fullscreen exited again. The question will be marked wrong. Click continue to re-enter fullscreen and proceed.', true);
}

export function handleTabSwitch() {
  console.log(`📱 handleTabSwitch called. quizActive: ${quizActive}, waitingForFullscreen: ${waitingForFullscreen}, waitingForFocus: ${waitingForFocus}`);
  
  if (!quizActive || waitingForFullscreen || waitingForFocus) return;
  
  waitingForFocus = true;
  quizPaused = true;
  const tabSwitchesSpan = getEl("tabSwitches");
  if (tabSwitchesSpan) {
    let val = parseInt(tabSwitchesSpan.textContent) || 0;
    tabSwitchesSpan.textContent = val + 1;
  }
  
  console.log(`   🚨 Tab switch detected - triggering failure`);
  triggerFailure('Tab switched away');
  showPauseOverlay('Tab switched away from the quiz. Return to this window to continue.', false);
}

export function resumeAfterVisibilityReturn() {
  console.log(`👁️ resumeAfterVisibilityReturn called. waitingForFocus: ${waitingForFocus}`);
  
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
  console.log(`🖥️ resumeAfterFullscreenReturn called. waitingForFullscreen: ${waitingForFullscreen}`);
  console.log(`   document.fullscreenElement: ${!!document.fullscreenElement}`);
  console.log(`   shouldFailOnFullscreenResume: ${shouldFailOnFullscreenResume}`);
  
  if (!waitingForFullscreen) return;
  if (!document.fullscreenElement) return;
  
  waitingForFullscreen = false;
  hidePauseOverlay();
  quizPaused = false;
  if (minigamePauseCallback) minigamePauseCallback(false);
  
  // Trigger failure if needed (but only if not already triggered)
  if (shouldFailOnFullscreenResume && pendingFailureCallback && !failureTriggered) {
    console.log(`   🚨 Resume after failure - triggering failure`);
    triggerFailure('Fullscreen exited twice');
    shouldFailOnFullscreenResume = false;
  } else {
    console.log(`   ✅ Resume without failure`);
    shouldFailOnFullscreenResume = false;
  }
  
  if (typeof window.loadQuestion === 'function') window.loadQuestion();
  addLog('Resumed quiz in fullscreen.');
}

// Attach global listeners
document.addEventListener("visibilitychange", () => {
  console.log(`👁️ visibilitychange: hidden=${document.hidden}, quizApp display=${getEl("quizApp")?.style.display}`);
  if (document.hidden && getEl("quizApp")?.style.display === "flex") {
    handleTabSwitch();
  } else if (!document.hidden) {
    resumeAfterVisibilityReturn();
  }
});

document.addEventListener("fullscreenchange", () => {
  console.log(`🖥️ fullscreenchange: fullscreenElement=${!!document.fullscreenElement}, quizActive=${quizActive}`);
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
