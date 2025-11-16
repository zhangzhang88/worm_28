# Worm 28 - 智能语音课程系统

这是一个基于 Next.js 的课程练习应用，使用浏览器自带的 Web Speech API（SpeechSynthesis）即时朗读句子，无需后端服务。

## 技术栈

### 前端栈
- Next.js 14（App Router）
- React 18
- TypeScript
- Emotion（样式）

## 快速开始

1. 安装依赖  
   ```bash
   npm install
   ```
2. 运行开发服务器（端口 3000）  
   ```bash
   npm run dev
   ```

构建产物用于 Vercel 或本地预览：

```bash
npm run build
npm start
```

## 浏览器 TTS

- 使用 `window.speechSynthesis` API 根据句子动态朗读
- 声音、语速取决于用户浏览器/系统提供的语音包（推荐使用支持 SpeechSynthesis 的桌面/移动浏览器）
- 若浏览器不支持该 API，将无法播放语音

## 项目结构速览

```
├─app
│  ├─layout.tsx / globals.css
│  ├─page.tsx                # 首页，列出所有课程
│  └─courses/[courseId]/lessons/[lessonNumber]/page.tsx  # 动态课程页（courseId 动态）
├─components/TypingGame.tsx  # 主要交互组件（client component）
├─data
│  ├─types.ts
│  └─courses/courseId_x/lesson*.ts   # 具体课程数据
├─public                     # UI 音效等静态资源
└─congratulationsData.ts     # 结算页文案
```

## 主要文件

- `components/TypingGame.tsx`：核心课程交互逻辑
- `data/types.ts`：课程/句子数据的 TypeScript 类型定义
- `data/courses/courseId_x/lesson*.ts`：每个课次的句子数据
- `data/courses/index.ts`：统一维护课程清单
- `congratulationsData.ts`：结算页随机文案

## 如何新增 Lesson

### 给现有 courseId_1 增加 lesson

1. 在 `data/courses/courseId_1` 新建 `lessonX.ts`（可复制现有 lesson），导出 `SentenceData[]`
2. 编辑 `data/courses/index.ts`：引入该 lesson，并在 `courseId1Lessons` 数组中追加 `{ lessonNumber: X, title: 'Lesson X - ...', sentences: lessonXSentences }`
3. 保存后，`/courses/courseId_1/lessons/X` 自动生效

### 新增新的 courseId（例如 courseId_2）

1. 新建目录 `data/courses/courseId_2`，逐个 lesson 写入 `lesson1.ts`、`lesson2.ts` 等
2. 在 `data/courses/index.ts` 中：
   - `import { sentences as course2Lesson1 } from './courseId_2/lesson1';` 等
   - 维护 `const courseId2Lessons: LessonConfig[] = [...]`
   - 在 `courseConfigs` 中追加：
     ```ts
     courseId_2: {
       courseId: 'courseId_2',
       title: '课程 2',
       lessons: courseId2Lessons
     }
     ```
3. 首页与 `/courses/courseId_2/lessons/<lessonNumber>` 将自动展示

### 验证

执行 `npm run build` 或 `npm run dev`，确认新课程/课次链接出现且可以正常播放。Lesson 示例可参考 `data/courses/courseId_1/lesson2.ts`、`courseId_2/lesson1.ts`。

> 小工具：可运行 `python scripts/add_lesson.py`，根据提示依次输入 `courseId`、`lesson` 编号和简介。脚本会：
> 1. 自动在 `data/courses/<courseId>/lessonX.ts` 生成模板文件供粘贴数据
> 2. 更新 `data/courses/index.ts` 的 import、lesson 列表与 course 配置  
> 仅需把句子数据粘到新文件即可。
