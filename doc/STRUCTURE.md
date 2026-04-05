# 目录结构

## 项目结构

```text
chat_box_enhance/
├─ doc/
│  ├─ ARCHITECTURE.md
│  ├─ FEATURES.md
│  ├─ SETTINGS.md
│  ├─ STRUCTURE.md
│  └─ TODO.md
├─ src/
│  ├─ App.svelte                   # 入口组件，只负责启动和销毁运行时 service
│  ├─ main.ts                      # Svelte 挂载入口
│  ├─ app.css                      # 全局样式
│  └─ lib/
│     ├─ components/
│     │  └─ outline/
│     │     ├─ DraggableToggleButton.svelte
│     │     ├─ HeaderTree.svelte
│     │     ├─ OutlineHeader.svelte
│     │     ├─ OutlineItem.svelte
│     │     ├─ OutlineList.svelte
│     │     ├─ OutlinePanel.svelte
│     │     └─ SettingsModal.svelte
│     ├─ platform/
│     │  ├─ chatgpt.ts
│     │  ├─ deepseek.ts
│     │  ├─ doubao.ts
│     │  ├─ grok.ts
│     │  ├─ kimi.ts
│     │  ├─ qwen.ts
│     │  ├─ tongyi.ts
│     │  ├─ yuanbao.ts
│     │  └─ index.ts
│     ├─ services/
│     │  ├─ index.ts
│     │  ├─ logger.ts
│     │  ├─ messageSourceService.ts
│     │  ├─ messageCacheManager.ts
│     │  ├─ observer.ts
│     │  ├─ outlineRefreshService.ts
│     │  ├─ outlineRuntimeService.ts
│     │  └─ scrollSyncService.ts
│     ├─ stores/
│     │  ├─ features.ts
│     │  ├─ index.ts
│     │  ├─ messageCache.ts
│     │  ├─ outline.ts
│     │  ├─ platform.ts
│     │  └─ theme.ts
│     ├─ types/
│     └─ utils/
│        └─ outlineBuilder.ts
├─ dist/
├─ package.json
├─ svelte.config.js
├─ tsconfig.json
└─ vite.config.ts
```

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `src/App.svelte` | 项目入口组件，负责平台识别与运行时 service 生命周期 |
| `src/lib/services/outlineRuntimeService.ts` | 当前大纲功能的统一运行时入口 |
| `src/lib/services/outlineRefreshService.ts` | 大纲数据刷新、强制刷新与刷新后同步逻辑 |
| `src/lib/services/messageSourceService.ts` | 消息采集与 chatArea 缓存 |
| `src/lib/services/observer.ts` | DOM 变化监听服务 |
| `src/lib/services/scrollSyncService.ts` | 大纲与聊天滚动同步、锚点构建与自动跟随 |
| `src/lib/services/messageCacheManager.ts` | 增量缓存、索引复用与大纲 DOM 引用登记 |
| `src/lib/utils/outlineBuilder.ts` | 摘要、标题树、搜索文本与消息 hash 构建工具 |
| `src/lib/platform/*.ts` | 各平台 DOM 解析与适配实现 |

## 当前推荐调用关系

```text
App.svelte
  -> outlineRuntimeService.start()
      -> outlineRefreshService.refresh()
      -> observerService.setup()
      -> scrollSyncService.init()

App.svelte
  -> outlineRuntimeService.destroy()
```

## 说明

- 若要调整“大纲刷新、挂载、动态监听”相关流程，优先修改 `src/lib/services/outlineRuntimeService.ts`
- 若要调整大纲刷新流程，优先修改 `src/lib/services/outlineRefreshService.ts`
- 若要调整消息采集与 chatArea 缓存，修改 `src/lib/services/messageSourceService.ts`
- 若要调整 DOM 监听行为，修改 `src/lib/services/observer.ts`
- 若要调整滚动同步行为，修改 `src/lib/services/scrollSyncService.ts`
- 若要调整摘要、标题树或 hash 构建逻辑，修改 `src/lib/utils/outlineBuilder.ts`
