# EforGla (语之恋) — Agent 项目指南

> 一个 Galgame × AI 的英语学习终端。纯前端实现，零构建步骤。

---

## 项目概述

EforGla 将 Galgame 的沉浸式体验与英语学习结合，创造一个安静、低压的学习环境。

- **左侧**：角色立绘 + ADV 对话区，提供陪伴感
- **右侧**：黑板式学习区，展示单词、例句、记忆提示
- **核心体验**：安静、温柔、低压学习，有陪伴感的日系视觉小说氛围

当前版本：V1.6

---

## 技术栈

- **语言**：纯 JavaScript (ES6+)，无 TypeScript
- **样式**：CSS3 (Flexbox / Grid / CSS Variables / Backdrop Filter / 动画关键帧)
- **构建**：**无构建工具，零依赖**，直接运行
- **存储**：`localStorage`（存档 / 设置 / 学习记录）
- **词库**：JSON 格式，按等级分级
- **AI**：模块化 Provider 架构，支持 DeepSeek / OpenAI / Claude / Gemini / Mock（离线）
- **TTS**：浏览器原生 `SpeechSynthesis`，预留 Azure / OpenAI / Fish Audio / CosyVoice 扩展接口

> 不存在 `package.json`、`pyproject.toml`、`Cargo.toml` 等包管理文件。本项目不依赖 npm、pip 或任何包管理器。

---

## 本地运行

### 方式一：直接打开
```bash
# 直接用浏览器打开 index.html
open index.html
```

### 方式二：本地服务器（推荐，用于加载本地 JSON 词库）
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# 访问 http://localhost:8080
```

> 注意：部分浏览器需要通过 HTTP 服务器访问才能加载本地 JSON 词库文件（`fetch()` 限制）。

---

## 项目结构

```
EforGla/
├── index.html                  # 主页面，包含所有 UI 结构
├── styles.css                  # 全局样式表（黑板主题、Galgame 布局、动画、响应式）
├── app.js                      # 主应用核心，事件绑定、UI 更新、页面切换
├── data.js                     # 配置与常量（词库定义、预设、AI 配置、经验值公式）
├── learning.js                 # 学习工具函数（查找单词、随机抽词、答案校验）
├── characters.js               # 内置角色数据 + Tavern 角色卡解析 + CharacterManager
│
├── LearningState.js            # 学习状态管理（范围/词数/筛选/课时/提示/对话/复习）
├── WordManager.js              # 词库管理 + 艾宾浩斯间隔重复系统
├── AIManager.js                # AI 统一调度（课程大纲/角色讲解/对话/句子检查）
├── aiProvider.js               # AI Provider 实现（DeepSeek/OpenAI/Claude/Gemini/Mock）
├── SaveManager.js              # 多档存档系统（6 槽位 + 自动存档）
├── TTSManager.js               # TTS 语音管理（当前仅实现浏览器原生）
├── aiService.js                # AI 讲解服务封装（OfflineAIProvider / RemoteAIProvider）
├── tts.js                      # 浏览器 TTS 服务 + Provider 占位符
├── api.js                      # 兼容性桥接（单行注释文件，保留向后兼容）
├── wordBankLoader.js           # 词库加载器（旧版类实现，功能已被 WordManager 覆盖）
│
├── assets/
│   ├── data/character/words/   # 分级词库 JSON
│   │   ├── middle_school.json  # 初中词库
│   │   ├── cet4.json           # CET-4 词库
│   │   └── cet6.json           # CET-6 词库
│   ├── data/character/Griseo.json  # Tavern 角色卡（格蕾修）
│   ├── 0.png                   # 默认角色立绘
│   ├── UI.png                  # UI 素材
│   └── classroom_bg.png        # 教室背景图
│
├── README.md                   # 面向人类用户的项目说明
├── LICENSE                     # MIT License
├── .gitignore                  # 忽略 node_modules、.env、敏感 key 文件等
└── .vscode/
    └── extensions.json         # 推荐安装 moonshot-ai.kimi-code 扩展
```

### 脚本加载顺序（index.html 底部）

脚本必须按以下顺序加载，因为模块之间存在全局依赖：

1. `data.js` — 常量定义，所有后续模块依赖
2. `characters.js` — 角色数据
3. `WordManager.js` — 词库管理
4. `AIManager.js` — AI 调度（依赖 `AIProvider` 全局对象）
5. `SaveManager.js` — 存档
6. `TTSManager.js` — TTS
7. `aiProvider.js` — AI Provider 实现（创建全局 `AIProvider` 实例）
8. `learning.js` — 工具函数
9. `LearningState.js` — 学习状态
10. `aiService.js` — AI 服务封装
11. `api.js` — 兼容桥接
12. `tts.js` — TTS 服务
13. `app.js` — 主应用入口（最后加载，初始化所有模块）

---

## 代码组织与模块划分

本项目采用**全局对象模块模式**（非 ES Module）。每个 `.js` 文件暴露一个全局常量对象或类：

| 模块 | 类型 | 职责 |
|------|------|------|
| `App` (`app.js`) | 全局对象 | 应用核心：DOM 缓存、事件绑定、页面切换、各模式 UI 渲染、角色/好感度更新 |
| `CharacterManager` (`characters.js`) | 全局对象 | 角色列表管理、内置角色、Tavern 卡加载与解析 |
| `WordManager` (`WordManager.js`) | 全局对象 | 加载 JSON 词库、单词查询、难度评分、艾宾浩斯复习记录 |
| `LearningState` (`LearningState.js`) | 全局对象 | 当前学习范围、课时进度、闪卡队列、对话历史、渐进式提示层级 |
| `AIManager` (`AIManager.js`) | 全局对象 | 课程大纲生成、角色化讲解、对话回复、句子纠错（离线/在线双路径） |
| `AIProvider` (`aiProvider.js`) | 全局实例 | Provider 管理器，分发到具体 Provider 类 |
| `SaveManager` (`SaveManager.js`) | 全局对象 | 6 槽位存档 + 自动存档、导入导出 |
| `TTSManager` (`TTSManager.js`) | 全局对象 | TTS 配置与朗读调用 |
| `AIService` (`aiService.js`) | 全局对象 | 离线/远程 AI 服务封装 |
| `TTSService` (`tts.js`) | 全局对象 | TTS Provider 分发（目前仅 browser 可用） |
| `WordBankLoader` (`wordBankLoader.js`) | 全局实例 | 旧版词库加载器，已不活跃使用 |

### Provider 架构

AI 和 TTS 均采用 **Provider 模式**，便于扩展：

- **AI Provider 基类**：`AIProviderBase` → `MockAIProvider` / `HttpAIProvider` → `OpenAIProvider` / `DeepSeekProvider` / `ClaudeProvider` / `GeminiProvider`
- **TTS Provider**：`BrowserSpeechProvider` + `PlaceholderTTSProvider`（azure/openai/fish/cosy 预留）

---

## 开发约定

### 代码风格

- 使用 **ES6+** 语法：`const`/`let`、箭头函数、模板字符串、`async/await`、类语法
- 模块头部使用装饰性注释块：
  ```js
  /* ════════════════════════════════════════════════
     EforGla V1.6 — Module Name
     Description
     ════════════════════════════════════════════════ */
  ```
- 全局对象使用 **PascalCase**（如 `WordManager`、`LearningState`）
- 方法/变量使用 **camelCase**
- 中文注释为主，少量英文标识符
- 字符串使用双引号

### DOM 操作

- 所有 DOM 元素在 `App.cacheDom()` 中集中缓存到 `App.dom` 对象
- 使用原生 DOM API（`document.getElementById`、`querySelector` 等），无 jQuery

### 错误处理

- 网络请求（`fetch`）使用 `try/catch` + `console.warn` 降级
- AI 请求失败时自动回退到离线模板回复（`offlineLessonPlan`、`offlineConversationReply` 等）
- 词库加载失败时回退到内置硬编码单词列表

---

## 数据格式

### 词库 JSON 格式

`assets/data/character/words/*.json` 为单词数组：

```json
[
  {
    "word": "apple",
    "pos": "n.",
    "synonyms": ["fruit"],
    "antonyms": [],
    "root": "",
    "translations": [
      { "translation": "苹果", "pos": "n." }
    ],
    "phrases": [
      { "phrase": "I eat an apple every morning.", "translation": "我每天早上吃一个苹果。" }
    ]
  }
]
```

`WordManager.normalizeEntry()` 将其转换为内部格式：
```js
{
  english: "apple",
  chinese: "苹果",
  phonetic: "",
  pos: "n.",
  synonyms: ["fruit"],
  antonyms: [],
  root: "",
  example: "I eat an apple every morning.",
  exampleChinese: "我每天早上吃一个苹果。",
  vocabularyId: "cet4",
  phrases: [...],
  translations: [...]
}
```

### 存档格式

存档保存在 `localStorage` 中：
- 键名：`galgameEnglish_saveSlots`（手动存档）、`galgameEnglish_autoSave`（自动存档）
- 版本：`SAVE_VERSION = 3`
- 内容：settings、profile（等级/好感/经验）、wordHistory、learningState

---

## 学习系统核心机制

### 艾宾浩斯复习间隔

`REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]`（天）

- 每次复习正确，复习层级 `+1`
- 错误则重置为层级 `0`
- `WordManager.recordReview()` 更新 `nextReviewAt`

### 单词状态

`LearningState.getWordState()` 返回：
- `new` — 未学习
- `familiar` — 已学但熟练度 < 40
- `learning` — 熟练度 40~80
- `mastered` — 熟练度 >= 80

### 渐进式提示（Learn 模式）

共 4 个层级（0~3）：
1. Level 0：联想/画面提示
2. Level 1：词性、词根提示
3. Level 2：搭配、例句提示
4. Level 3：完整讲解（含近反义词、例句、记忆法）

### 好感度与等级

- 学习单词、卡片记住、对话、测试正确均可增加经验/好感
- 经验公式：`expToNext = 100 * 1.45^(level-1)`
- 配置位于 `data.js` 的 `EXP_CONFIG` 和 `AFFECTION_CONFIG`

---

## 测试策略

**本项目没有自动化测试框架**（无 Jest、Mocha、Vitest 等）。

测试方式：
1. 在浏览器中直接运行
2. 使用本地服务器加载 JSON 词库
3. 手动测试各学习模式（Learn / Cards / Conversation / Review）
4. 手动测试存档/读档流程
5. 切换 AI Provider 测试在线/离线行为

---

## 部署

本仓库完全兼容 **GitHub Pages** 部署：

1. 推送到 GitHub
2. Settings → Pages → 选择 `main` 分支，根目录 `/`
3. 访问 `https://<用户名>.github.io/EforGla/`

由于项目纯前端无构建步骤，GitHub Pages 可直接运行。

---

## 安全注意事项

- **API Key 仅保存在浏览器 `localStorage` 中，不会上传至任何服务器**
- 不要在代码中硬编码真实 API Key
- `.gitignore` 已配置忽略常见敏感文件：`*_keys.json`、`*_secret.json`、`credentials.json`、`secrets.json`、`.env`
- Tavern 角色卡导入仅接受 `.json` 文件，解析时清理 `\uFFFD` 乱码和 `{{user}}` 标记

---

## 扩展指南

### 添加新词库

1. 在 `assets/data/character/words/` 下创建新的 JSON 文件
2. 在 `data.js` 的 `VOCABULARY_BANKS` 中注册
3. 在 `DIFFICULTY_TO_BANK` / `BANK_TO_DIFFICULTY` 中添加映射（如需难度关联）

### 添加新 AI Provider

1. 在 `aiProvider.js` 中继承 `AIProviderBase` 或 `HttpAIProvider` 实现新类
2. 在 `AIProviderManager.registry` 中注册
3. 在 `data.js` 的 `PROVIDER_CONFIG` 中添加配置元数据

### 添加新角色

1. 在 `characters.js` 的 `BUILTIN_CHARACTERS` 数组中添加角色对象
2. 或准备符合 Tavern 格式的角色卡 JSON 放入 `assets/data/character/`
3. 修改 `CharacterManager.loadTavernCards()` 加载新卡片

---

## 关键文件速查

| 需求 | 文件 |
|------|------|
| 修改学习模式 UI | `index.html` + `app.js` |
| 修改样式/主题 | `styles.css` |
| 修改词库配置 | `data.js` |
| 修改角色数据 | `characters.js` |
| 修改 AI 提示词 | `AIManager.js` |
| 修改复习算法 | `WordManager.js` |
| 修改存档结构 | `SaveManager.js` |
| 修改经验/好感公式 | `data.js` |
