/* ============================================
   IsekaiLife Arabic - Game Initialization
   ============================================ */

let game;

window.onload = function() {
    game = new GameEngine();
    
    // تحقق من وجود حفظ
    const hasSave = localStorage.getItem('isekailife_save_ar');
    if (hasSave) {
        document.getElementById('continue-game-btn')?.classList.remove('hidden');
    }
};

// Language switching function
function setLanguage(lang) {
    // Redirect to the appropriate version
    if (lang === 'en') {
        window.location.href = '../index.html';
    }
    // If already on Arabic, do nothing (we're already here)
}

// الدوال العامة للواجهة
function startNewGame() {
    game.startNewGame();
}

function continueGame() {
    game.loadGame();
}

function showReincarnation() {
    game.showCharacterCreation();
}

function selectGender(gender) {
    game.selectGenderAndGenerate(gender);
}

function backToGenderSelect() {
    game.backToGenderSelect();
}

function rerollCharacters() {
    game.generateNewChoices();
}

function selectCharacter(index) {
    game.selectCharacter(index);
}

function switchTab(tab) {
    game.switchTab(tab);
}

function toggleMenu() {
    game.toggleMenu();
}

function showStatus() {
    game.showStatus();
}

function showQuestLog() {
    game.showQuestLog();
}

function showAchievements() {
    game.showAchievements();
}

function saveGame() {
    game.saveGame();
}

function showCredits() {
    game.showCredits();
}

function restartGame() {
    game.showScreen('title-screen');
    game.state = null;
}
