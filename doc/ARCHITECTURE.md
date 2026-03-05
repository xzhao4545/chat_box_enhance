# 项目架构

## 技术栈

- **框架**: Svelte 5 (Runes API)
- **构建**: Vite 7 + vite-plugin-monkey
- **语言**: TypeScript 5
- **状态**: Svelte Stores
- **包管理**: pnpm

## 核心模块

### 服务层 (`services/`)

| 服务 | 职责 |
|------|------|
| `outline.ts` | 大纲生成、刷新逻辑 |
| `messageCacheManager.ts` | 消息缓存管理、变更检测 |
| `scrollSyncService.ts` | 滚动同步服务 |
| `observer.ts` | MutationObserver 监听DOM变化 |

### 状态管理 (`stores/`)

| Store | 用途 |
|-------|------|
| `themeStore` | 主题配置 |
| `featuresStore` | 功能开关 |
| `outlineStore` | 大纲数据 |
| `platformStore` | 平台信息 |

### 平台适配 (`platform/`)

实现 `ParserConfig` 接口：

```typescript
interface ParserConfig {
  selectChatArea: () => Element | null;           // 获取聊天区域
  getMessageList: (root: Element) => ...;          // 获取消息列表
  determineMessageOwner: (ele: Element) => ...;    // 判断消息类型
  getOutlineContainer: () => Element | null;       // 大纲挂载容器
  getScrollContainer?: (chatArea: Element) => ...; // 滚动容器（可选）
}
```

## 数据流

```
DOM变化 → observerService → outlineService.refresh
                              ↓
                    messageCacheManager.smartRebuildCache
                              ↓
                         outlineStore更新
                              ↓
                        Svelte响应式渲染
```

详见 [FEATURES.md](./FEATURES.md) | [STRUCTURE.md](./STRUCTURE.md)