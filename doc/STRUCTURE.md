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
│     │  └─ index.ts
│     ├─ services/
│     │  ├─ index.ts
│     │  ├─ logger.ts
│     │  ├─ messageCacheManager.ts
│     │  ├─ observer.ts
│     │  ├─ outline.ts
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
| `src/lib/services/outline.ts` | 大纲数据刷新与强制刷新逻辑 |
| `src/lib/services/observer.ts` | DOM 变化监听服务 |
| `src/lib/services/scrollSyncService.ts` | 大纲与聊天滚动同步 |
| `src/lib/services/messageCacheManager.ts` | 增量缓存与重建策略 |
| `src/lib/platform/*.ts` | 各平台 DOM 解析与适配实现 |

## 当前推荐调用关系

```text
App.svelte
  -> outlineRuntimeService.start()
      -> outlineService.refresh()
      -> observerService.setup()
      -> scrollSyncService.init()

App.svelte
  -> outlineRuntimeService.destroy()
```

## 说明

- 若要调整“大纲刷新、挂载、动态监听”相关流程，优先修改 `src/lib/services/outlineRuntimeService.ts`
- 若要调整大纲数据生成策略，修改 `src/lib/services/outline.ts`
- 若要调整 DOM 监听行为，修改 `src/lib/services/observer.ts`
- 若要调整滚动同步行为，修改 `src/lib/services/scrollSyncService.ts`

