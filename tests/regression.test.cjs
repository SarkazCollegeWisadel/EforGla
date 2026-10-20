const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 每例使用独立的浏览器全局作用域，不加载外部服务或真实 API Key。
function setup() {
  const storage = new Map();
  const context = vm.createContext({
    console: { warn() {} },
    document: { addEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  vm.runInContext("var window = globalThis;", context);
  for (const file of ["data.js", "aiProvider.js", "AIManager.js", "MCPClient.js", "WordManager.js",
    "LearningState.js", "SaveManager.js", "learning.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file });
  }
  return { storage, run: (code) => vm.runInContext(code, context) };
}

test("AI 配置传递给顶层 const Provider，无需 window 属性", () => {
  const { run } = setup();
  assert.equal(run("window.AIProvider"), undefined);
  run('AIManager.setConfig({ provider: "openai", apiKey: "test-only", model: "test-model" })');
  assert.equal(run("AIProvider.isOnline()"), true);
  assert.equal(run("AIProvider.getProvider().model"), "test-model");
});

test("50 词选项不受初始 20 词预览范围限制", () => {
  const { run } = setup();
  run(`WordManager.normalized.cet4 = Array.from({ length: 70 }, (_, i) => ({ english: "word" + i }));
    LearningState.init("cet4"); LearningState.setCountPreset("50"); LearningState.generateLessonPlan({});`);
  assert.equal(run("LearningState.rangeWords.length"), 50);
  run("LearningState.setLearnCount(-1)");
  assert.equal(run("LearningState.learnCount"), 1);
});

test("读档恢复原课程词序及超过默认范围的学习位置", () => {
  const { run } = setup();
  run(`WordManager.normalized.cet4 = Array.from({ length: 60 }, (_, i) => ({ english: "word" + i }));
    LearningState.rangeWords = WordManager.getAllWords("cet4").slice().reverse();
    LearningState.currentIndex = 40; LearningState.inSession = true;
    const saved = JSON.parse(JSON.stringify(LearningState.serialize()));
    LearningState.rangeWords = []; LearningState.currentIndex = 0;
    LearningState.deserialize(saved);`);
  assert.equal(run("LearningState.getCurrentWord().english"), "word19");
  assert.equal(run("LearningState.currentIndex"), 40);
  assert.equal(run("LearningState.rangeWords.length"), 60);
});

test("旧存档利用大纲中的单词顺序恢复课程", () => {
  const { run } = setup();
  run(`WordManager.normalized.cet4 = [{english: "apple"}, {english: "book"}];
    LearningState.deserialize({ vocabularyId: "cet4", currentIndex: 1, lessonPlan: { words: ["book", "apple"] } });`);
  assert.equal(run("LearningState.getCurrentWord().english"), "apple");
});

test("到期复习仅包含已学单词，与到期统计一致", () => {
  const { run } = setup();
  run(`WordManager.normalized.cet4 = ["new", "seen", "due", "future"].map(english => ({english}));
    const history = { seen: { learned: true }, due: { learned: true, nextReviewAt: "2000-01-01" },
      future: { learned: true, nextReviewAt: "2999-01-01" } };`);
  assert.equal(run('WordManager.getDueWords(history, "cet4").map(w => w.english).join(",")'), "seen,due");
  assert.equal(run("WordManager.getReviewStats(history).dueCount"), 2);
});

test("首次正确复习一天后再次出现，然后两天，错误重置到一天", () => {
  const { run } = setup();
  run("const history = {}; WordManager.recordReview(history, 'apple', true)");
  const interval = () => run("Math.round((Date.parse(history.apple.nextReviewAt) - Date.parse(history.apple.lastReviewed)) / 86400000)");
  assert.equal(interval(), 1);
  run("WordManager.recordReview(history, 'apple', true)");
  assert.equal(interval(), 2);
  run("WordManager.recordReview(history, 'apple', false)");
  assert.equal(interval(), 1);
});

test("删除固定槽位不会挪动其他存档，导入复用空槽", () => {
  const { run } = setup();
  run('SaveManager.save(0, { character: { name: "A" } }); SaveManager.save(1, { character: { name: "B" } }); SaveManager.deleteSlot(0)');
  assert.equal(run("SaveManager.load(0)"), null);
  assert.equal(run("SaveManager.load(1).characterName"), "B");
  assert.equal(run('SaveManager.importSlot({version: 3, settings: {}}).index'), 0);
});

test("满槽时导入失败，不静默覆盖第六个存档", () => {
  const { run } = setup();
  run("for (let i = 0; i < 6; i++) SaveManager.save(i, {});");
  assert.equal(run('SaveManager.importSlot({version: 3, settings: {}})'), false);
});

test("损坏的槽位列表退回空数组，非法导入被拒绝", () => {
  const { run, storage } = setup();
  storage.set("galgameEnglish_saveSlots", '{"invalid":true}');
  run("SaveManager.init()");
  assert.equal(run("SaveManager.getSlots().length"), 0);
  assert.equal(run("SaveManager.importSlot(null)"), false);
  assert.equal(run("SaveManager.importSlot({version: 99, settings: {}})"), false);
});

test("存档不携带 Key，加载旧存档保留本机 Key 和缺省语音配置", () => {
  const { run } = setup();
  run(`const state = { settings: { ai: { apiKey: "device-only", provider: "openai" }, voice: { rate: 1 } } };
    const save = SaveManager.save(0, state);
    SaveManager.restoreToState({settings: {ai: {apiKey: "old-secret", model: "new-model"}, voice: {pitch: 1.2}}}, state);`);
  assert.equal(run("save.settings.ai.apiKey"), undefined);
  assert.equal(run("state.settings.ai.apiKey"), "device-only");
  assert.equal(run("state.settings.ai.model"), "new-model");
  assert.equal(run("state.settings.voice.rate"), 1);
});

test("存储失败报告失败并回滚内存槽位", () => {
  const { run } = setup();
  run('SaveManager.save(0, { character: {name: "before"} }); localStorage.setItem = () => { throw new Error("quota"); };');
  assert.equal(run('SaveManager.save(0, {character: {name: "after"}})'), null);
  assert.equal(run("SaveManager.load(0).characterName"), "before");
  assert.equal(run("SaveManager.deleteSlot(0)"), false);
  assert.equal(run("SaveManager.load(0).characterName"), "before");
  run('App.setDialogue = () => {};');
  assert.equal(run("App.saveData()"), false);
});

test("HTML 特殊字符被转义，答案必须匹配一个完整释义", () => {
  const { run } = setup();
  assert.equal(run(`App.escapeHtml('<img src=x onerror="alert(1)">&')`), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;");
  assert.equal(run('checkChineseAnswer("美", "美丽的")'), false);
  assert.equal(run('checkChineseAnswer("不是美丽的", "美丽的")'), false);
  assert.equal(run('checkChineseAnswer("漂亮的", "美丽的；漂亮的")'), true);
});

test("用户输入不会在发送给 AI 的上下文中重复", async () => {
  const { run } = setup();
  run('AIProvider.conversation = async ({messages}) => ({content: JSON.stringify(messages)});');
  const result = JSON.parse(await run(`AIManager.generateConversationReply({userInput: "hello", history: [{role: "user", text: "hello"}]})`));
  assert.equal(result.filter((m) => m.content === "hello").length, 1);
});

test("AI 分类结构错误时使用离线分类", async () => {
  const { run } = setup();
  run(`AIManager.isOnline = () => true; AIProvider.chat = async () => ({content: '{"categories":[{"name":"bad","words":null}]}'});`);
  const result = await run('AIManager.generateWordCategories({words: [{english: "apple", chinese: "苹果"}]})');
  assert.equal(result[0].words[0], "apple");
});

test("较早返回的 AI 请求不能覆盖新单词的讲解", async () => {
  const { run } = setup();
  run(`const a = {english: "a"}; const b = {english: "b"};
    LearningState.rangeWords = [a, b]; App.state.settings.aiMode = true;
    AIManager.isOnline = () => true; const pending = {};
    AIManager.generateWordAdvice = ({word}) => new Promise(resolve => pending[word] = resolve);
    let shown = ""; App.updateLearnCharDialogue = text => { shown = text; };
    const first = App.setLearnCharacterDialogue(a);
    LearningState.currentIndex = 1; const second = App.setLearnCharacterDialogue(b);
    pending.b("new");`);
  await run("second");
  run('pending.a("stale")');
  await run("first");
  assert.equal(run("shown"), "new");
});

test("确认相同词库不会重置已恢复的学习会话", () => {
  const { run } = setup();
  run('LearningState.inSession = true; LearningState.learnPhase = "k0"; LearningState.setVocabulary("cet4");');
  assert.equal(run("LearningState.inSession"), true);
  assert.equal(run("LearningState.learnPhase"), "k0");
});

test("MCP 工具列表失败时不能显示连接成功", async () => {
  const { run } = setup();
  run(`let request = 0; fetch = async () => {
    const current = ++request;
    return {ok: true, headers: { get: () => "application/json" }, json: async () =>
      current === 3 ? {error: {message: "tools denied"}} : {result: {}}};
  };`);
  const result = await run('MCPClient.connect("http://example.invalid/mcp")');
  assert.equal(result.ok, false);
  assert.equal(run("MCPClient.connected"), false);
  assert.equal(run("MCPClient.sessionId"), null);
});

test("MCP 不支持的 SSE 响应明确报告失败并关闭响应流", async () => {
  const { run } = setup();
  run(`let cancelled = false; fetch = async () => ({ok: true,
    headers: {get: () => "text/event-stream"}, body: {cancel: async () => {cancelled = true;}}});`);
  const result = await run('MCPClient.connect("http://example.invalid/mcp")');
  assert.equal(result.ok, false);
  assert.match(result.error, /SSE/);
  assert.equal(run("cancelled"), true);
});

test("MCP HTTP 和工具执行错误传播给调用方", async () => {
  const { run } = setup();
  run('fetch = async () => ({ok: false, status: 403})');
  assert.equal((await run('MCPClient.connect("http://example.invalid/mcp")')).ok, false);
  run('MCPClient.connected = true; MCPClient._call = async () => ({result: {isError: true}})');
  assert.equal((await run('MCPClient.callTool("test", {})')).ok, false);
});
