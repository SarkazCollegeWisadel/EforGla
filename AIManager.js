const AI_PROVIDER_LIST = [
  { id: "mock", label: "本地离线 (Mock)" },
  { id: "openai", label: "OpenAI" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" }
];

const AIManager = {
  config: {
    provider: "mock",
    apiKey: "",
    endpoint: "",
    model: ""
  },

  /* ── Configuration ── */

  setConfig(config = {}) {
    this.config = { ...this.config, ...config };
    if (window.AIProvider) {
      AIProvider.setConfig(this.config);
    }
  },

  getConfig() {
    return { ...this.config };
  },

  getProviderLabel(providerId) {
    const p = AI_PROVIDER_LIST.find((p) => p.id === providerId);
    return p ? p.label : providerId;
  },

  getAvailableProviders() {
    return AI_PROVIDER_LIST;
  },

  isOnline() {
    return this.config.provider !== "mock";
  },

  /* ── Lesson generation ── */

  async generateLesson({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    const name = character?.name || "角色";
    const prompt = this.buildLessonPrompt({ word, meaning, character, difficulty });
    const comment = this.makeCharacterComment({ word, meaning, character, example });
    const memoryTip = this.makeMemoryTip({ word, meaning });

    if (this.isOnline() && window.AIProvider) {
      try {
        const result = await AIProvider.explainWord({
          word, meaning, phonetic, example, exampleChinese, character, difficulty, wordData: { english: word, chinese: meaning }
        });
        return {
          word: result.word || word,
          meaning: result.meaning || meaning,
          phonetic: result.phonetic || phonetic,
          example: result.example || example,
          exampleChinese: result.exampleChinese || exampleChinese,
          characterComment: result.characterComment || comment,
          memoryTip: result.memoryTip || memoryTip,
          followUp: result.followUpQuestion || ""
        };
      } catch {
        return this.offlineLesson({ word, meaning, phonetic, example, exampleChinese, characterComment: comment, memoryTip });
      }
    }
    return this.offlineLesson({ word, meaning, phonetic, example, exampleChinese, characterComment: comment, memoryTip });
  },

  offlineLesson({ word, meaning, phonetic, example, exampleChinese, characterComment, memoryTip }) {
    return {
      word, meaning, phonetic: phonetic || "", example: example || "", exampleChinese: exampleChinese || "",
      characterComment,
      memoryTip
    };
  },

  buildLessonPrompt({ word, meaning, character, difficulty }) {
    return `你正在一个 Galgame 英语学习应用中扮演 ${character?.name || "角色"}。请解释单词 "${word}"（${meaning}）。`;
  },

  /* ── Character comments ── */

  makeCharacterComment({ word, meaning, character, example }) {
    const name = character?.name || "角色";
    if (character?.id?.includes("griseo")) {
      return `${word} 是 ${meaning}。想象它是一抹淡蓝，轻轻涂在黑板角落。${example ? `例句：${example}` : ""}`;
    }
    if (character?.id === "rei") {
      return `${word}，${meaning}。先读三遍，再写一遍。${example ? `顺带记下这句：${example}` : ""}`;
    }
    if (character?.id === "sakura") {
      return `${word} 是 ${meaning}！跟我读一遍！${example ? `${example} — 这句也一起记住吧！` : ""}`;
    }
    if (character?.id === "ayano") {
      return `${word} 的意思是 ${meaning}。别着急，先把它放在今天要记住的清单里。${example ? `例句：${example}` : ""}`;
    }
    return `“${word}” 是“${meaning}”。${example ? `例句：${example}` : ""}先记住意思，再感受它在句子里的颜色。`;
  },

  /* ── Memory hints ── */

  makeMemoryTip({ word, meaning }) {
    if (!word) return "";
    const first = word.slice(0, 1).toUpperCase();
    return `${first} — 像粉笔落下的第一点。把「${word}」和「${meaning}」一起写在黑板上。`;
  },

  async generateMemoryHint({ word, meaning, character }) {
    return this.makeMemoryTip({ word, meaning });
  },

  /* ── Character reply ── */

  async generateCharacterReply({ character, userInput, context }) {
    const name = character?.name || "角色";
    const prompt = `[${character?.personality || "温柔陪伴"}] 用户说：${userInput}。请用一句话回应，保持角色性格。`;
    if (this.isOnline() && window.AIProvider) {
      try {
        const result = await AIProvider.chat([
          { role: "system", content: prompt },
          { role: "user", content: userInput }
        ]);
        return result.content || this.defaultReply(name);
      } catch {
        return this.defaultReply(name);
      }
    }
    return this.defaultReply(name);
  },

  defaultReply(name) {
    const replies = [
      "嗯，我在听。",
      "好，记下来了。",
      "继续，不要停。",
      "今天的颜色很安静。",
      "你的进度很好。"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
};
