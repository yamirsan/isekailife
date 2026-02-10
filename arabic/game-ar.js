/* ============================================
   إسيكاي لايف - تهيئة اللعبة
   ============================================ */

// إنشاء نسخة اللعبة العامة
const game = new GameEngine();

// التهيئة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    game.checkForSave();
});

// وظيفة تبديل اللغة
function setLanguage(lang) {
    if (lang === 'en') {
        window.location.href = '../index.html';
    }
}
