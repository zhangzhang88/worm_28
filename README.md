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
│  └─courses/courseId_1/lessons/[lessonNumber]/page.tsx  # 动态课程页
├─components/TypingGame.tsx  # 主要交互组件（client component）
├─data
│  ├─types.ts
│  └─courseId_1/lesson*.ts   # 具体课程数据
├─public                     # UI 音效等静态资源
└─congratulationsData.ts     # 结算页文案
```

## 主要文件

- `components/TypingGame.tsx`：核心课程交互逻辑
- `data/types.ts`：课程/句子数据的 TypeScript 类型定义
- `data/courseId_1/lesson*.ts`：每个课次的句子数据
- `data/courseId_1/lessons.ts`：统一维护课程清单
- `congratulationsData.ts`：结算页随机文案

## 如何新增 Lesson

以 Lesson 2 为例，完整流程如下：

1. 在 `data/courseId_1` 新建 `lesson2.ts`（可复制 `lesson1.ts` 作模板），导出 `SentenceData[]`
2. 打开 `data/courseId_1/lessons.ts`，引入该文件并在 `courseLessons` 数组中追加一项：
   ```ts
   import { sentences as lesson2Sentences } from './lesson2';
   
   export const courseLessons = [
      // ...
     { lessonNumber: 2, title: 'Lesson 2 - ...', sentences: lesson2Sentences }
   ];
   ```
3. 首页和动态路由会自动读取课程列表；`/courses/courseId_1/lessons/2` 就会渲染新课次

若需更多课程，只需重复上述步骤。Lesson 2 的示例数据已放在 `data/courseId_1/lesson2.ts` 供参考。
