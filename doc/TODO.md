# TODO

## 待完成

- 优化大纲跟随的准确性和性能
- 支持自定义快捷键

---

## 书签功能开发计划

### 功能概述

为大纲面板添加书签功能，允许用户在大纲中右键添加书签，点击书签可快速跳转到对应位置。

### 核心需求

1. **添加书签**: 在大纲元素上右键可添加书签
2. **书签命名**: 可自定义书签名称，或默认取对应消息的前 `bookmarkGetTextLength` 个字符
3. **会话定位**: 通过页面路径区分不同会话
4. **位置记录**: 记录会话位置 + 大纲元素路径
5. **跳转功能**: 点击书签 → 跳转到对应会话 → 滚动到对应元素
6. **本地存储**: 使用 localStorage 存储书签
7. **书签页面**: 可切换显示书签/树形大纲
8. **会话分组**: 默认显示当前会话书签，可选择显示所有会话书签（按会话分组，可按会话进行折叠）
9. **书签搜索**: 在书签页面内搜索
10. **预留导入导出**: 预留导入和导出接口，方便后续扩展

---

### 技术方案

#### 1. 数据结构

**Bookmark 接口**
```typescript
interface Bookmark {
  id: string;                    // 书签唯一ID
  name: string;                  // 书签名称（用于展示和搜索）
  conversationId: string;        // 会话ID
  platform: Platform;            // 平台标识
  outlineItemId: string;         // 大纲元素ID (对应 OutlineItem.id 或 HeaderTreeNode.id)
  outlineItemType: 'message' | 'header';  // 大纲元素类型
  headerPath?: string;           // 标题路径 (如 "0.1.2" 表示第0条消息的第1个标题的第2个子标题)
  messageHash: string;           // 消息内容指纹 (用于检测内容变更)
  createdAt: number;             // 创建时间戳
}
```

**PendingNavigation 接口** (sessionStorage 存储)
```typescript
interface PendingNavigation {
  bookmarkId: string;            // 待跳转的书签ID
  timestamp: number;             // 跳转发起时间
}
```

**BookmarksStore 数据结构** (localStorage 存储)
```typescript
// 存储格式: { [conversationId: string]: Bookmark[] }
interface BookmarksData {
  [conversationId: string]: Bookmark[];
}

// 配置项
interface BookmarksConfig {
  bookmarkGetTextLength: number; // 默认取文本长度，默认 20
}

// 导出格式（预留导入/导出功能）
interface BookmarksExport {
  version: string;           // 导出版本号
  exportedAt: number;        // 导出时间戳
  platform: Platform;        // 来源平台
  bookmarks: BookmarksData;  // 书签数据
}
```

#### 2. 会话ID提取

扩展ParserConfig接口，添加获取会话id的方法，以及获取会话名称的方法，名称用于在书签中按会话分组时展示，若无名称则回退至展示会话id

各平台会话URL模式:
| 平台 | URL模式 | 会话ID提取 |
|------|---------|-----------|
| ChatGPT | `/c/{conversation-id}` | pathname.split('/')[2] |
| DeepSeek | `/a/chat/s/{conversation-id}` | pathname.split('/')[4] |
| 豆包 | `/` | 无会话ID，使用 hash 或默认值 |
| Grok | `/` | 无会话ID，使用默认值 |
| 通义千问 | `/` | 无会话ID |
| Qwen | `/chat/{conversation-id}` | pathname.split('/')[2] |
| Kimi | `/chat/{conversation-id}` | pathname.split('/')[2] |

对于无会话ID的平台，可使用 `platform:hostname` 作为会话标识。

#### 3. 存储方案

- 使用 `localStorage` 存储（按域名天然隔离不同平台）
- 存储 key: `'chat-outline-bookmarks'`
- 自动保存: 通过 store subscription
- 数据结构: `{ [conversationId: string]: Bookmark[] }` 按会话ID分组存储

---

### 实现步骤

#### Phase 1: 基础设施 (预计 2-3 小时)

- [ ] **1.1 类型定义** (`src/lib/types/bookmark.ts`)
  - 定义 `Bookmark` 接口
  - 定义 `BookmarksConfig` 接口
  - 导出到 `src/lib/types/index.ts`

- [ ] **1.2 会话ID服务** (`src/lib/services/conversationService.ts`)
  - 实现 `getConversationId(platform: Platform): string` 函数
  - 各平台会话ID提取逻辑
  - 无会话ID平台的降级方案

- [ ] **1.3 书签存储** (`src/lib/stores/bookmarksStore.ts`)
  - 实现 `bookmarksStore` (writable store)
  - 加载/保存逻辑 (GM API + localStorage 降级)
  - 导出辅助函数: `addBookmark`, `removeBookmark`, `updateBookmark`, `getBookmarksByConversation`

#### Phase 2: 右键菜单 (预计 2-3 小时)

- [ ] **2.1 右键菜单组件** (`src/lib/components/outline/ContextMenu.svelte`)
  - 通用右键菜单组件
  - 支持定位、动画、点击外部关闭
  - 可扩展菜单项

- [ ] **2.2 OutlineItem 右键集成**
  - 修改 `OutlineItem.svelte` 添加 `oncontextmenu` 事件
  - 修改 `HeaderTree.svelte` 添加 `oncontextmenu` 事件
  - 传递必要信息 (outlineItemId, outlineItemType, element)

- [ ] **2.3 添加书签弹窗** (`src/lib/components/outline/AddBookmarkModal.svelte`)
  - 输入书签名称 (可选)
  - 显示默认名称预览
  - 确认/取消按钮

#### Phase 3: 书签面板 (预计 3-4 小时)

- [ ] **3.1 书签列表组件** (`src/lib/components/outline/BookmarkList.svelte`)
  - 显示书签列表
  - 支持按会话分组显示
  - 书签搜索功能
  - 书签项点击跳转

- [ ] **3.2 书签面板容器** (`src/lib/components/outline/BookmarkPanel.svelte`)
  - 切换显示: 书签 / 树形大纲
  - 过滤: 当前会话 / 所有会话
  - 搜索框

- [ ] **3.3 OutlinePanel 集成**
  - 修改 `OutlinePanel.svelte` 支持视图切换
  - 添加书签按钮到 Header

#### Phase 4: 跳转功能 (预计 1-2 小时)

- [ ] **4.1 书签跳转服务** (`src/lib/services/bookmarkNavigationService.ts`)
  - `navigateToBookmark(bookmark: Bookmark)` 函数
  - **跨会话跳转流程**:
    1. 检测当前会话是否匹配目标会话
    2. 不匹配时：存储 `PendingNavigation` 到 sessionStorage，然后 `location.href = targetUrl`
    3. 匹配时：直接执行滚动
  - **页面加载后恢复**:
    - 在 `outlineRuntimeService.start()` 完成后检查 sessionStorage
    - 有待跳转书签？等待大纲初始化完成 → 执行滚动 → 清除 sessionStorage

- [ ] **4.2 大纲元素查找与失效检测**
  - 通过 `outlineItemId` 在 `messageCacheManager` 中查找元素
  - **失效检测**:
    - 找不到元素 → 提示"未找到对应内容，书签可能已失效"
    - 找到元素但 `messageHash` 不匹配 → 提示"内容已变更，位置可能不准确"
  - **跳转执行**:
    - 调用 `scrollSyncService.focusOutlineElement()` 
    - 调用 `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
    - 调用 `highlightElement(element)` 高亮

#### Phase 5: 配置集成 (预计 1 小时)

- [ ] **5.1 FeaturesConfig 扩展**
  - 添加 `bookmarkGetTextLength: number` 配置项 (默认 20)
  - 更新 `SettingsModal.svelte` 添加配置 UI

- [ ] **5.2 主题适配**
  - 书签相关 CSS 变量
  - 明暗主题适配

---

### 文件清单

**新增文件**
```
src/lib/types/bookmark.ts              # 书签类型定义
src/lib/services/conversationService.ts # 会话ID服务
src/lib/services/bookmarkNavigationService.ts # 书签跳转服务
src/lib/stores/bookmarksStore.ts       # 书签存储
src/lib/components/outline/ContextMenu.svelte # 右键菜单
src/lib/components/outline/AddBookmarkModal.svelte # 添加书签弹窗
src/lib/components/outline/BookmarkList.svelte # 书签列表
src/lib/components/outline/BookmarkPanel.svelte # 书签面板
```

**修改文件**
```
src/lib/types/index.ts                 # 导出书签类型
src/lib/types/config.ts                # 添加 bookmarkGetTextLength
src/lib/stores/index.ts                # 导出 bookmarksStore
src/lib/services/index.ts              # 导出新服务
src/lib/components/outline/OutlineItem.svelte # 添加右键菜单
src/lib/components/outline/HeaderTree.svelte # 添加右键菜单
src/lib/components/outline/OutlinePanel.svelte # 视图切换
src/lib/components/outline/OutlineHeader.svelte # 添加书签按钮
src/lib/components/outline/SettingsModal.svelte # 书签配置
src/app.css                            # 书签样式变量
```

---

### 依赖关系

```
Phase 1 (基础设施)
    ↓
Phase 2 (右键菜单) ← 需要 Phase 1 的类型和存储
    ↓
Phase 3 (书签面板) ← 需要 Phase 1 的存储
    ↓
Phase 4 (跳转功能) ← 需要 Phase 1-3 完成
    ↓
Phase 5 (配置集成) ← 可与 Phase 2-4 并行
```

---

### 已确认方案

1. **会话切换行为**: 直接在当前标签页跳转 URL
   - 使用 sessionStorage 存储待跳转书签ID
   - 页面加载后检查并执行跳转

2. **书签失效处理**: 保留书签，跳转时检测并提示
   - 找不到元素 → "未找到对应内容，书签可能已失效"
   - 内容变更 → "内容已变更，位置可能不准确"

3. **书签数量限制**: 暂不限制，可后续添加

4. **跨平台存储**: localStorage 按域名天然隔离
   - 仅存储当前平台的书签
   - 用 `conversationId` 区分不同会话

---

### 验收标准

- [ ] 可在大纲元素上右键添加书签
- [ ] 可自定义书签名称
- [ ] 书签列表正确显示（当前会话/所有会话）
- [ ] 点击书签可正确跳转到对应位置
- [ ] 书签搜索功能正常
- [ ] 配置项可调整
- [ ] 明暗主题适配良好
- [ ] localStorage 持久化正常