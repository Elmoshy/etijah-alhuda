// ════════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════════
function toggleTheme() {
  APP.theme = APP.theme==="dark"?"light":"dark";
  document.body.className = APP.theme;
  localStorage.setItem("theme",APP.theme);
}
