/* ════════════════════════════════════════════════
   EforGla V1.6 — Utility helpers
   ════════════════════════════════════════════════ */

function getAllWords() {
  const all = [];
  for (const key of Object.keys(VOCABULARY_BANKS)) {
    all.push(...WordManager.getAllWords(key));
  }
  return all;
}

function findWord(word) {
  const lower = String(word || "").toLowerCase().trim();
  const found = WordManager.findInAllBanks(lower);
  if (found) return { ...found, vocabularyId: found.vocabularyId };
  return null;
}

function getRandomWords(vocabularyId, count) {
  const bank = WordManager.getAllWords(vocabularyId);
  if (!bank || bank.length === 0) return [];
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count || 5, bank.length));
}

function prepareQuizCards(vocabularyId, count) {
  return getRandomWords(vocabularyId, count).map((word) => ({
    ...word, flipped: false, remembered: null
  }));
}

function prepareTestWords(vocabularyId, count) {
  if (WordManager.ready) {
    return getRandomWords(vocabularyId, count || 5);
  }
  const diff = BANK_TO_DIFFICULTY[vocabularyId] || "medium";
  return WordManager.getFallbackWords(diff).slice(0, count || 5);
}

function normalizeAnswer(value) {
  return String(value || "").trim().replace(/[，。；;,.!?！？\s]/g, "");
}

function checkChineseAnswer(userAnswer, correctAnswer) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  if (!user || !correct) return false;
  return user.includes(correct) || correct.includes(user);
}
