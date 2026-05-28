/* ════════════════════════════════════════════════
   EforGla V1.6 — AI Manager
   Orchestrates: lesson plans, character hints, conversation, teaching
   ════════════════════════════════════════════════ */

const AIManager = {
  config: {
    provider: "deepseek",
    apiKey: "",
    endpoint: "",
    model: "deepseek-v4-flash"
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

  isOnline() {
    return AIProvider.isOnline();
  },

  getAvailableProviders() {
    return AIProvider.getAvailableProviders();
  },

  /* ════════════════════════════════════════════════
     LESSON PLAN — AI generates today's learning outline
     ════════════════════════════════════════════════ */

  async generateLessonPlan({ words, vocabularyLabel, character }) {
    if (this.isOnline()) {
      try {
        const name = character?.name || "角色";
        const personality = character?.personality || "";
        const wordList = words.slice(0, 20).map((w) => w.english).join("、");
        const messages = [
          {
            role: "system",
            content: `你是 Galgame 英语学习应用中的角色「${name}」。性格：${personality}。你正在为学生安排今天的英语课。用中文回复，保持角色语气，像老师在黑板上写课程大纲。`
          },
          {
            role: "user",
            content: `今天的词库是「${vocabularyLabel}」，包含这些词：${wordList}（共${words.length}个）。请生成今日学习大纲，包含：1) 今日范围概括 2) 重点类型（如高频副词、基础学术词等）3) 难度评估。用角色语气写，约80-120字，像在黑板上写课程介绍。`
          }
        ];
        const result = await AIProvider.chat(messages);
        if (result?.content) return result.content;
      } catch (e) {
        console.warn("[AIManager] Lesson plan generation failed", e);
      }
    }
    return this.offlineLessonPlan(words, vocabularyLabel);
  },

  offlineLessonPlan(words, vocabularyLabel) {
    const count = words.length;
    const first = words[0]?.english || "—";
    const last = words[count - 1]?.english || "—";
    return [
      `今日范围：「${first}」→「${last}」`,
      `共 ${count} 个词，来自「${vocabularyLabel}」`,
      "慢慢来，像在黑板上一笔一笔画线条。"
    ].join("\n");
  },

  async generateWordCategories({ words, vocabularyLabel, userPrompt, character }) {
    if (this.isOnline() && words.length > 0) {
      try {
        const name = character?.name || "角色";
        const personality = character?.personality || "";
        const wordList = words.slice(0, 50).map((w) => `${w.english}(${w.chinese})`).join("、");
        const promptContext = userPrompt ? `用户自定义分类要求：${userPrompt}` : "请按主题/场景/词性等自然维度分类";
        const messages = [
          {
            role: "system",
            content: `你是 Galgame 英语学习应用中的角色「${name}」。性格：${personality}。你正在帮学生整理词库分类。用中文回复，保持角色语气。`
          },
          {
            role: "user",
            content: `词库「${vocabularyLabel}」共 ${words.length} 个词，前50个：${wordList}。${promptContext}。请将这组词分成 3-6 个类别，每个类别给出一个简短的名字（4-8字）和包含的词列表。用 JSON 格式返回：{"categories":[{"name":"类别名","words":["word1","word2"]}]}。只返回 JSON，不要其他内容。`
          }
        ];
        const result = await AIProvider.chat(messages);
        if (result?.content) {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.categories) return parsed.categories;
          }
        }
      } catch (e) {
        console.warn("[AIManager] Word category generation failed", e);
      }
    }
    // Offline fallback: group by first letter
    const groups = {};
    words.forEach((w) => {
      const key = w.english[0].toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(w.english);
    });
    return Object.entries(groups).slice(0, 6).map(([name, list]) => ({ name: `字母 ${name}`, words: list.slice(0, 10) }));
  },

  /* ════════════════════════════════════════════════
     PROGRESSIVE CHARACTER HINTS — Level 0 → 3
     ════════════════════════════════════════════════ */

  /* Level 0: Light association / imagery hint */
  makeHintLevel0(word) {
    if (!word) return "";
    const meaning = word.chinese || "";
    const english = word.english || "";
    const templates = [
      `像"${meaning}"的感觉……可以想象一个画面。`,
      `"${english}"——试着感受它的形状。`,
      `这个词有一种特别的质感，像"${meaning}"。`,
      `闭上眼睛，想一想"${meaning}"的颜色。`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  },

  /* Level 1: Etymology, word type, root hint */
  makeHintLevel1(word) {
    if (!word) return "";
    const english = word.english || "";
    const pos = word.pos || "";
    const root = word.root || "";
    const parts = [];
    if (pos) parts.push(`词性：${pos}`);
    if (root) parts.push(`词根：${root}`);
    if (parts.length) return parts.join("。");
    const firstLetter = english.slice(0, 1).toUpperCase();
    return `首字母是 ${firstLetter}。试着拆开它的音节读一读。`;
  },

  /* Level 2: Collocations, common phrases */
  makeHintLevel2(word) {
    if (!word) return "";
    const english = word.english || "";
    const meaning = word.chinese || "";
    const example = word.example || "";
    const collocations = word.collocations || "";
    const parts = [];
    if (collocations) {
      parts.push(`常见搭配：${collocations}`);
    }
    if (example) {
      parts.push(`例句：${example}`);
    }
    if (parts.length) return parts.join("\n");
    // Generate from phrases
    const phrases = word.phrases || [];
    if (phrases.length > 0) {
      return phrases.slice(0, 3).map((p) => p.phrase).join("\n");
    }
    return `"${english}"可以和很多词搭配。比如和"${meaning}"相关的场景。`;
  },

  /* Level 3: Full memory technique */
  makeHintLevel3(word, record) {
    if (!word) return "";
    const english = word.english || "";
    const meaning = word.chinese || "";
    const example = word.example || "";
    const exampleChinese = word.exampleChinese || "";
    const synonyms = word.synonyms || [];
    const antonyms = word.antonyms || [];

    const lines = [];
    lines.push(`"${english}"——${meaning}`);
    if (synonyms.length) lines.push(`近义：${synonyms.slice(0, 3).join("、")}`);
    if (antonyms.length) lines.push(`反义：${antonyms.slice(0, 3).join("、")}`);
    if (example) {
      lines.push(`例句：${example}`);
      if (exampleChinese) lines.push(`（${exampleChinese}）`);
    }
    if (record?.wrongCount > 0) {
      lines.push(`你之前错过 ${record.wrongCount} 次，这次一定会记住。`);
    }
    return lines.join("\n");
  },

  /* ════════════════════════════════════════════════
     CHARACTER COMMENT — Personality-driven, NOT hardcoded
     ════════════════════════════════════════════════ */

  makeCharacterComment({ word, meaning, character, example }) {
    const name = character?.name || "角色";
    const personality = character?.personality || "";
    const style = this.inferTeachingStyle(personality);

    if (style === "gentle") {
      return `${word} 的意思是 ${meaning}。别着急，先把它放在今天要记住的清单里。${example ? `例句：${example}` : ""}`;
    }
    if (style === "quiet") {
      return `${word} 是 ${meaning}。想象它是一抹淡彩，轻轻留在黑板角落。${example ? `例句：${example}` : ""}`;
    }
    if (style === "direct") {
      return `${word}，${meaning}。先读三遍，再写一遍。${example ? `顺带记下这句：${example}` : ""}`;
    }
    if (style === "energetic") {
      return `${word} 是 ${meaning}！跟我读一遍！${example ? `${example} — 这句也一起记住吧！` : ""}`;
    }
    return `"${word}" 是"${meaning}"。${example ? `例句：${example}` : ""}先记住意思，再感受它在句子里的颜色。`;
  },

  inferTeachingStyle(personality) {
    const text = (personality || "").toLowerCase();
    if (/安静|细腻|画|颜色|线条|色彩/.test(text)) return "quiet";
    if (/温柔|鼓励|慢慢|学姐/.test(text)) return "gentle";
    if (/冷静|直接|监督|话少/.test(text)) return "direct";
    if (/元气|活泼|快|同桌|活跃/.test(text)) return "energetic";
    return "gentle";
  },

  /* ════════════════════════════════════════════════
     WORD ADVICE — AI-generated personalized opening
     ════════════════════════════════════════════════ */

  async generateWordAdvice({ word, meaning, character, example, wordHistory }) {
    if (this.isOnline()) {
      try {
        const name = character?.name || "角色";
        const personality = character?.personality || "";
        const history = wordHistory || {};
        const record = history[word?.toLowerCase?.()];
        const wrongCount = record?.wrongCount || 0;
        const isNew = !record;
        const context = [
          isNew ? "这是学生第一次学这个词。" : `学生已经学过这个词，之前错过 ${wrongCount} 次。`,
          example ? `例句：${example}` : ""
        ].filter(Boolean).join(" ");

        const messages = [
          {
            role: "system",
            content: `你是 Galgame 英语学习应用中的角色「${name}」。性格：${personality}。你正在教室里陪学生学英语。用中文回复，保持角色语气，温柔、简短（1-3句话），像老师在黑板边轻声讲解。`
          },
          {
            role: "user",
            content: `今天的单词是「${word}」（${meaning}）。${context}请给出一个个性化的学习建议或开场白，帮助学生记住这个词。不要列点，像聊天一样自然。`
          }
        ];
        const result = await AIProvider.chat(messages);
        if (result?.content) return result.content;
      } catch (e) {
        console.warn("[AIManager] Word advice generation failed", e);
      }
    }
    return this.makeCharacterComment({ word, meaning, character, example });
  },

  /* ════════════════════════════════════════════════
     MEMORY TIPS
     ════════════════════════════════════════════════ */

  makeMemoryTip({ word, meaning }) {
    if (!word) return "";
    const first = word.slice(0, 1).toUpperCase();
    return `${first} — 像粉笔落下的第一点。把「${word}」和「${meaning}」一起写在黑板上。`;
  },

  /* ════════════════════════════════════════════════
     CONVERSATION — AI sentence practice
     ════════════════════════════════════════════════ */

  async generateConversationFirstMessage({ character, word }) {
    if (this.isOnline()) {
      try {
        const name = character?.name || "角色";
        const personality = character?.personality || "温柔陪伴";
        const messages = [
          {
            role: "system",
            content: `你是 Galgame 英语学习应用中的角色「${name}」。性格：${personality}。你正在教室里，准备和学生用「${word?.english || ""}」练习英语对话。用中文回复，保持角色语气，简短（1-2句话），自然地引导学生开始造句。`
          },
          {
            role: "user",
            content: `请用「${word?.english || ""}」(${word?.chinese || ""}) 给我一个开场，引导学生开始造句练习。可以是一个简单的问题、一个示范句子，或一个场景提示。`
          }
        ];
        const result = await AIProvider.chat(messages);
        if (result?.content) return result.content;
      } catch (e) {
        console.warn("[AIManager] Conversation first message failed", e);
      }
    }
    return `今天我们来练习「${word?.english || ""}」。试着用它造一个句子？`;
  },

  async generateConversationReply({ character, word, userInput, history }) {
    const name = character?.name || "角色";
    const personality = character?.personality || "温柔陪伴";
    const systemPrompt = character?.systemPrompt || "";

    const contextMessages = (history || []).slice(-6).map((h) => ({
      role: h.role === "character" ? "assistant" : "user",
      content: h.text
    }));

    const messages = [
      {
        role: "system",
        content: [
          `你是 Galgame 英语学习应用中的角色「${name}」。`,
          `性格：${personality}`,
          `场景：教室里，正在和学生练习英语。`,
          `当前练习词汇：「${word?.english || ""}」(${word?.chinese || ""})`,
          systemPrompt,
          "规则：",
          "1. 用中文+少量英文回应，保持角色语气",
          "2. 如果学生造句有语法错误，温柔地纠正",
          "3. 鼓励学生多造句、多使用目标单词",
          "4. 回复控制在1-3句话，不要太长",
          "5. 像聊天一样自然，不要像批改作业"
        ].filter(Boolean).join("\n")
      },
      ...contextMessages,
      { role: "user", content: userInput }
    ];

    const result = await AIProvider.conversation({ messages, character, word });
    if (result?.content) return result.content;

    return this.offlineConversationReply(name, word, userInput);
  },

  offlineConversationReply(name, word, userInput) {
    const replies = [
      "嗯，我在听。再试一个句子？",
      "差不多。不过还可以更自然一点。",
      "好的，记下来了。继续。",
      "有意思。试着把" + (word?.english || "这个词") + "放在句首看看。"
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  },

  /* ── Grammar / sentence check ── */

  async checkSentence({ character, word, sentence }) {
    const name = character?.name || "角色";
    const messages = [
      {
        role: "system",
        content: `你是英语老师角色「${name}」。检查学生用"${word?.english || ""}"造的句子。如果语法正确且自然，简单鼓励。如果有小问题，温柔纠正并给出更好的说法。用中文回复，1-2句话。`
      },
      { role: "user", content: `我的句子：${sentence}` }
    ];

    if (this.isOnline()) {
      try {
        const result = await AIProvider.chat(messages);
        if (result?.content) return result.content;
      } catch (e) {
        console.warn("[AIManager] Sentence check failed", e);
      }
    }

    // Offline basic check
    if (!sentence || sentence.length < 3) return "再写长一点？一个完整的句子会更好。";
    const hasWord = sentence.toLowerCase().includes((word?.english || "").toLowerCase());
    if (!hasWord) return `试试在句子里用上"${word?.english || "这个词"}"？`;
    return "看起来不错。你满意这个句子吗？";
  },

  /* ════════════════════════════════════════════════
     LEGACY COMPAT
     ════════════════════════════════════════════════ */

  async generateLesson(params) {
    return this.generateLessonPlan({
      words: params.word ? [params] : [],
      vocabularyLabel: params.difficulty || "",
      character: params.character
    });
  },

  defaultReply(name) {
    const replies = ["嗯，我在听。", "好，记下来了。", "继续，不要停。", "今天的颜色很安静。", "你的进度很好。"];
    return replies[Math.floor(Math.random() * replies.length)];
  }
};
