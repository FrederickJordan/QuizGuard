// Legacy shim — data log logic is in app.js. Calls window helpers set by app.js.
export function openDataLogScreen() {
  if (typeof window.openDataLogScreen === 'function') window.openDataLogScreen();
  else console.error('app.js not loaded — cannot open data log');
}

export function closeDataLogScreen() {
  if (typeof window.closeDataLogScreen === 'function') window.closeDataLogScreen();
}
