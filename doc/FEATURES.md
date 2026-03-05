# 功能特性

## 核心功能

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 智能大纲生成 | 解析对话内容，生成可交互大纲 | `services/outline.ts` |
| 消息缓存 | 缓存已解析消息，智能检测变化 | `services/messageCacheManager.ts` |
| 滚动同步 | 消息列表滚动时同步大纲位置 | `services/scrollSyncService.ts` |
| 大纲搜索 | 支持正则表达式搜索大纲内容 | `components/outline/OutlineHeader.svelte` |
| 多平台支持 | 适配多个AI聊天平台 | `platform/*.ts` |
| 主题切换 | 亮色/暗色主题 | `stores/theme.ts` |
| 设置管理 | 功能开关和配置项管理 | `stores/features.ts` |
| 日志系统 | 可配置的日志级别 | `services/logger.ts` |

## 平台支持

| 平台 | 域名 |
|------|------|
| ChatGPT | chatgpt.com |
| DeepSeek | chat.deepseek.com |
| 豆包 | *.doubao.com |
| Grok | grok.com |
| 通义千问 | www.qianwen.com |
| Qwen | chat.qwen.ai |
| Kimi | www.kimi.com |

## 控制功能

| 按钮 | 功能 | 实现位置 |
|------|------|----------|
| 🔄 | 强制刷新大纲 | `components/outline/OutlineHeader.svelte` |
| 📂/📁 | 展开/收起所有 | `components/outline/OutlineHeader.svelte` |
| 🌙/☀️ | 切换主题 | `stores/theme.ts` |
| 📍 | 同步大纲位置 | `services/scrollSyncService.ts` |
| 🔍 | 搜索大纲 | `components/outline/OutlineHeader.svelte` |
| ⚙️ | 打开设置面板 | `components/outline/SettingsModal.svelte` |
| ✕ | 隐藏面板 | `components/outline/OutlinePanel.svelte` |

## 配置项

| 配置 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoExpand` | boolean | true | 自动展开节点 |
| `showUserMessages` | boolean | true | 显示用户消息 |
| `showAIMessages` | boolean | true | 显示AI回复 |
| `isVisible` | boolean | true | 大纲可见性 |
| `textLength` | number | 50 | 大纲文字截取长度 |
| `debouncedInterval` | number | 500 | 防抖间隔(ms) |
| `syncScroll` | boolean | true | 滚动同步开关 |
| `logLevel` | string | 'info' | 日志级别 |

详见 [SETTINGS.md](./SETTINGS.md)

## UI 组件

| 组件 | 说明 | 文件 |
|------|------|------|
| OutlinePanel | 大纲面板容器 | `components/outline/OutlinePanel.svelte` |
| OutlineHeader | 工具栏和搜索栏 | `components/outline/OutlineHeader.svelte` |
| OutlineList | 大纲列表 | `components/outline/OutlineList.svelte` |
| OutlineItem | 单个大纲项 | `components/outline/OutlineItem.svelte` |
| HeaderTree | 标题树节点 | `components/outline/HeaderTree.svelte` |
| SettingsModal | 设置弹窗 | `components/outline/SettingsModal.svelte` |
| DraggableToggleButton | 可拖拽切换按钮 | `components/outline/DraggableToggleButton.svelte` |

## 添加新平台

1. 创建 `src/lib/platform/newplatform.ts`，实现 `ParserConfig` 接口
2. 在 `src/lib/stores/platform.ts` 的 `judgePlatform()` 添加域名判断
3. 在 `src/lib/platform/index.ts` 导出配置
4. 测试各项功能（大纲生成、滚动同步、搜索等）

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)