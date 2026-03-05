# 目录结构

## 源码结构

```
src/
├── main.ts                 # 入口文件
├── App.svelte              # 根组件
├── app.css                 # 全局样式（主题变量）
├── assets/                 # 静态资源
└── lib/
    ├── types/              # 类型定义
    │   └── config.ts       # 配置接口
    ├── stores/             # 状态管理
    │   ├── features.ts     # 功能配置
    │   ├── messageCache.ts # 消息缓存
    │   ├── outline.ts      # 大纲数据
    │   ├── platform.ts     # 平台判断
    │   └── theme.ts        # 主题管理
    ├── services/           # 业务服务
    │   ├── logger.ts       # 日志服务
    │   ├── messageCacheManager.ts  # 缓存管理
    │   ├── observer.ts     # DOM监听
    │   ├── outline.ts      # 大纲生成
    │   └── scrollSyncService.ts    # 滚动同步
    ├── platform/           # 平台适配器
    │   ├── chatgpt.ts
    │   ├── deepseek.ts
    │   ├── doubao.ts
    │   ├── grok.ts
    │   ├── kimi.ts
    │   ├── qwen.ts
    │   ├── tongyi.ts
    │   └── index.ts
    ├── components/         # Svelte组件
    │   └── outline/
    │       ├── DraggableToggleButton.svelte
    │       ├── HeaderTree.svelte
    │       ├── OutlineHeader.svelte
    │       ├── OutlineItem.svelte
    │       ├── OutlineList.svelte
    │       ├── OutlinePanel.svelte
    │       └── SettingsModal.svelte
    └── utils/              # 工具函数
        ├── debounce.ts     # 防抖
        ├── highlight.ts    # 高亮
        ├── retry.ts        # 重试
        └── index.ts
```

## 构建产物

| 文件 | 说明 |
|------|------|
| `dist/chat_box_enhance.user.js` | 油猴脚本（生产版本） |

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式（热重载） |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览构建结果 |
| `pnpm check` | TypeScript 类型检查 |

## 配置文件

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | Vite + vite-plugin-monkey 配置 |
| `svelte.config.js` | Svelte 预处理器配置 |
| `tsconfig.json` | TypeScript 配置 |
| `package.json` | 项目依赖和脚本 |