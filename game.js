/* ============================================
   IsekaiLife - Game Initialization
   ============================================ */

// Create global game instance
const game = new GameEngine();

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    game.checkForSave();
});

// Language switching function
function setLanguage(lang) {
    // Redirect to the appropriate version
    if (lang === 'ar') {
        window.location.href = 'arabic/index.html';
    }
    // If already on English, do nothing (we're already here)
}
