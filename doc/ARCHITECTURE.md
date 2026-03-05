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
| `logger.ts` | 日志服务，支持可配置日志级别 |

### 状态管理 (`stores/`)

| Store | 用途 |
|-------|------|
| `themeStore` | 主题配置（亮色/暗色） |
| `featuresStore` | 功能开关和配置项 |
| `outlineStore` | 大纲数据和状态 |
| `platformStore` | 平台判断和配置 |
| `messageCacheStore` | 消息缓存状态 |

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
                              ↓
                    scrollSyncService（可选）
```

## 新增功能架构

### 搜索功能
- 位置: `OutlineHeader.svelte`
- 支持正则表达式
- 实时过滤大纲项

### 设置面板
- 位置: `SettingsModal.svelte`
- 持久化存储: `GM_setValue/GM_getValue`
- 配置项详见 [SETTINGS.md](./SETTINGS.md)

### 拖拽按钮
- 位置: `DraggableToggleButton.svelte`
- 隐藏大纲时显示
- 可拖拽到任意位置
- 位置持久化存储

详见 [FEATURES.md](./FEATURES.md) | [STRUCTURE.md](./STRUCTURE.md)