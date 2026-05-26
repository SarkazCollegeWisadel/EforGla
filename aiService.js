class OfflineAIProvider {
  async explainWord({ word, character, difficulty, aiMode }) {
    const wordData = findWord(word);
    const resolved = wordData || this.createFallbackWord(word, difficulty);
    const result = await AIProvider.explainWord({
      word: resolved.english,
      meaning: resolved.chinese,
      phonetic: resolved.phonetic,
      example: resolved.example,
      exampleChinese: resolved.exampleChinese,
      character,
      difficulty,
      wordData: resolved,
      aiMode: Boolean(aiMode)
    });
    return { ...result, found: Boolean(wordData), difficulty: resolved.difficulty || difficulty };
  }

  createFallbackWord(word, difficulty) {
    const clean = String(word || "word").trim() || "word";
    return {
      english: clean,
      chinese: "待查词：请结合词典确认准确释义",
      phonetic: `/${clean.toLowerCase()}/`,
      example: `${clean} is a word I want to remember.`,
      exampleChinese: `${clean} 是我想记住的一个词。`,
      difficulty,
      found: false
    };
  }
}

class RemoteAIProvider {
  async explainWord(payload) {
    console.warn("[RemoteAIProvider] 尚未配置远程 API，回退到离线讲解。");
    return new OfflineAIProvider().explainWord(payload);
  }
}

const AIService = {
  provider: new OfflineAIProvider(),

  setProvider(provider) {
    this.provider = provider || new OfflineAIProvider();
  },

  explainWord(payload) {
    return this.provider.explainWord(payload);
  }
};

function getAIResponse(word, character, difficulty) {
  return AIService.explainWord({ word, character, difficulty, aiMode: true });
}
