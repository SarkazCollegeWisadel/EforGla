function getAllWords() {
  const all = [];
  for (const diff of WordManager.getAvailableDifficulties()) {
    all.push(...WordManager.getAllWords(diff.id));
  }
  return all;
}

function findWord(word) {
  const lower = String(word || "").toLowerCase().trim();
  const found = WordManager.findInAllBanks(lower);
  if (found) return { ...found, difficulty: found.difficulty };
  return null;
}

function getRandomWords(difficulty, count) {
  return WordManager.getRandomWords(difficulty, count || 5);
}

function prepareQuizCards(difficulty, count) {
  return getRandomWords(difficulty, count).map((word) => ({
    ...word, flipped: false, remembered: null
  }));
}

function prepareTestWords(difficulty, count) {
  if (WordManager.ready) {
    return WordManager.getRandomWords(difficulty, count || 5);
  }
  return WordManager.getFallbackWords(difficulty).slice(0, count || 5);
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
