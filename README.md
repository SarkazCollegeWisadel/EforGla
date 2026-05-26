# EforGla 语之恋

一个 Galgame × AI 的英语学习终端。

> 「今天也一起，把语言重新涂上颜色吧。」

## 项目简介

EforGla（语之恋）将 Galgame 的沉浸式体验与英语学习结合，创造一个安静、低压的学习环境。

- **左侧**：角色立绘 + ADV 对话区，提供陪伴感
- **右侧**：黑板式学习区，展示单词、例句、记忆提示
- **核心体验**：安静、温柔、低压学习，有陪伴感的日系视觉小说氛围

## V1.6 功能特色

### 学习系统
- **智能词库选择**：初中 / CET-4 / CET-6 词库，可按范围、数量、难度自定义筛选
- **AI 课程大纲**：AI 根据词库自动生成今日学习计划，像老师在黑板上写课程介绍
- **丰富的单词展示**：词性、近义词、反义词、词根、搭配用法 + 例句翻译
- **渐进式提示**：多层次角色提示，从轻微提醒到完整讲解，不过度干预
- **频率排序**：支持 AI 按使用频率重新排列词库，优先学习高频词

### 学习模式
- **Learn**：黑板式教学展示（英文 + 音标 + 中文 + 词性 + 近反义词 + 词根 + 例句 + 搭配 + 角色讲解）
- **Cards**：翻转卡片记忆，艾宾浩斯优先抽取待复习单词，支持渐进提示
- **Conversation**：角色对话式英语练习，自由输入 + AI 纠正与建议
- **Review**：到期单词自动检测，拼写检测 + 间隔记录

### AI 系统
- **完整 AI Provider 架构**：DeepSeek / OpenAI / Claude / Gemini 均已实现真实 API 调用
- **角色化讲解**：每个角色结合人设解释单词，用画画、故事等方式强化记忆
- **智能对话**：角色可进行英语学习对话，提供纠错和造句建议

### 角色 & 陪伴
- **多角色陪伴**：格蕾修（色彩小画家）、绫乃（温柔学姐）、零（冷静监督员）、小樱（元气同桌）
- **角色化对话**：每个角色有性格、语气、讲解风格
- **好感度系统**：学习越多，角色越亲近

### 存档 & 成长
- **多档存档**：6 槽位存档 + 自动存档，支持覆盖与删除
- **艾宾浩斯复习**：1 / 2 / 4 / 7 / 15 / 30 天间隔重复
- **学习数据追踪**：已学/未学统计、熟练度百分比

### 自定义
- **立绘缩放与位置**：拖拽 / 滚轮调整角色立绘
- **TTS 语音**：浏览器原生语音合成，支持语速/音调调节
- **多 Provider 切换**：AI / TTS Provider 可在设置中随时切换

## 技术栈

- **语言**：纯 JavaScript (ES6+)
- **样式**：CSS3 (Flexbox / Grid / CSS Variables / Backdrop Filter)
- **构建**：无构建工具，零依赖，直接运行
- **存储**：localStorage（存档 / 设置 / 学习记录）
- **词库**：JSON 格式，按等级分级
- **AI**：模块化 Provider 架构，支持 DeepSeek / OpenAI / Claude / Gemini
- **TTS**：浏览器原生 Speech Synthesis，预留 Azure / OpenAI / Fish Audio 扩展

## 本地运行方法

### 方式一：直接打开

```bash
# 克隆仓库
git clone https://github.com/SarkazCollegeWisadel/EforGla.git

# 直接用浏览器打开 index.html
open index.html
```

### 方式二：本地服务器（推荐）

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8080
```

> 注意：部分浏览器需要通过 HTTP 服务器访问才能加载本地 JSON 词库文件。

## 项目结构

```
EforGla/
├── index.html                  # 主页面
├── styles.css                  # 样式表
├── app.js                      # 主应用核心
├── data.js                     # 配置与常量
├── learning.js                 # 学习工具函数
├── characters.js               # 内置角色数据
│
├── LearningState.js            # 学习状态管理（范围/词数/筛选/课时/提示/对话/复习）
├── WordManager.js              # 词库管理 + 艾宾浩斯系统
├── AIManager.js                # AI 统一调度（课程大纲/角色讲解/对话）
├── aiProvider.js               # AI Provider 实现（DeepSeek/OpenAI/Claude/Gemini/Mock）
├── SaveManager.js              # 多档存档系统
├── TTSManager.js               # TTS 语音管理
├── aiService.js                # AI 讲解服务
├── tts.js                      # 浏览器 TTS 服务
├── api.js                      # 兼容性桥接
├── wordBankLoader.js           # 词库加载器（旧版）
│
├── assets/
│   ├── data/character/words/   # 分级词库 JSON
│   │   ├── middle_school.json
│   │   ├── cet4.json
│   │   └── cet6.json
│   └── sprites/                # 角色立绘
│
└── README.md
```

## AI API 配置

在设置面板中填入你的 API Key 即可启用对应 AI Provider：

| Provider | 需要 API Key | 模型 | 说明 |
|----------|:-----------:|------|------|
| DeepSeek | 是 | deepseek-v4-flash | 性价比高，中文友好 |
| OpenAI | 是 | gpt-4o | 综合能力强 |
| Claude | 是 | claude-sonnet-4-6 | 创意写作优秀 |
| Gemini | 是 | gemini-2.0-flash | Google 免费额度 |

API Key 仅保存在浏览器 localStorage 中，不会上传至任何服务器。

## GitHub Pages 部署

本仓库完全兼容 GitHub Pages 部署。

1. 将仓库推送到 GitHub
2. 进入 Settings → Pages
3. 选择 `main` 分支，根目录（`/`）
4. 访问 `https://<你的用户名>.github.io/EforGla/`

> 注意：由于项目纯前端无构建步骤，GitHub Pages 可直接运行。

---

**License**: MIT

Made with love for quiet English learning.
