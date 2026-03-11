# 项目架构

## 技术栈

- **框架**: Svelte 5（Runes API）
- **构建**: Vite 7 + vite-plugin-monkey
- **语言**: TypeScript 5
- **状态管理**: Svelte Stores
- **包管理**: pnpm

## 核心模块

### 服务层（`src/lib/services/`）

| 服务 | 职责 |
|------|------|
| `outlineRuntimeService.ts` | 统一编排大纲挂载、初始化刷新、监听注册、销毁清理 |
| `outline.ts` | 负责大纲数据生成、刷新逻辑、缓存驱动更新 |
| `observer.ts` | 封装 `MutationObserver`，监听聊天 DOM 变化 |
| `messageCacheManager.ts` | 消息缓存管理、增量更新判断、缓存重建 |
| `scrollSyncService.ts` | 大纲与聊天区域的滚动同步 |
| `logger.ts` | 统一日志输出与日志级别控制 |

### 状态层（`src/lib/stores/`）

| Store | 用途 |
|------|------|
| `themeStore` | 管理明暗主题 |
| `featuresStore` | 管理功能开关与配置项 |
| `outlineStore` | 保存当前大纲数据 |
| `platformStore` / `parserConfigStore` | 当前平台与解析配置 |
| `messageCacheStore` | 缓存状态辅助存储 |

### 平台适配层（`src/lib/platform/`）

各平台通过实现 `ParserConfig` 接口接入：

```ts
interface ParserConfig {
  init?: () => undefined;
  afterGetContainer?: (outlineContainer: Element) => undefined;
  afterGetChatArea?: (chatArea: Element) => undefined;
  selectChatArea: () => Element | null | undefined;
  getMessageList: (root: Element) => HTMLCollection | Element[] | NodeListOf<Element> | null;
  determineMessageOwner: (messageEle: Element) => MessageOwner;
  getOutlineContainer: () => Element | null;
  getScrollContainer?: (chatArea: Element) => Element | null;
  timeout?: number;
}
```

## 运行时流程

```text
App.svelte
  -> 判断平台并获取 parserConfig
  -> outlineRuntimeService.start(parserConfig)
      -> 获取大纲挂载容器
      -> 挂载 OutlinePanel
      -> 获取 chatArea
      -> outlineService.refresh()
      -> scrollSyncService.init()
      -> observerService.setup()
  -> DOM 变化后触发 observer 回调
      -> outlineService.refresh()
      -> outlineStore 更新
      -> Svelte 组件响应式渲染
```

## 当前职责划分

- `App.svelte`
  - 仅保留入口职责：平台判断、启动、销毁
- `outlineRuntimeService`
  - 作为大纲运行时统一入口
  - 负责串联挂载、首次刷新、动态监听、清理销毁
- `outlineService`
  - 负责大纲数据本身的刷新与强制刷新
- `observerService`
  - 负责 DOM 变化监听，不直接参与 UI 挂载
- `scrollSyncService`
  - 负责滚动同步与高亮逻辑

## 说明

- 当前已将“刷新大纲内容”“挂载监听”“动态更新”统一收口到 `outlineRuntimeService`
- `outline.ts` 与 `observer.ts` 仍保留为内部能力模块，对外优先通过 service 对象调用

