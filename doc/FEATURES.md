# 功能列表

## 核心功能

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 智能大纲生成 | 解析对话内容并生成树形大纲 | `src/lib/services/outline.ts` |
| 大纲运行时管理 | 统一管理大纲挂载、刷新、监听和销毁 | `src/lib/services/outlineRuntimeService.ts` |
| DOM 动态监听 | 监听聊天内容变化并触发大纲刷新 | `src/lib/services/observer.ts` |
| 消息缓存 | 缓存已解析消息，减少重复构建 | `src/lib/services/messageCacheManager.ts` |
| 滚动同步 | 聊天区域滚动时同步定位大纲项 | `src/lib/services/scrollSyncService.ts` |
| 大纲搜索 | 支持普通文本与正则搜索 | `src/lib/components/outline/OutlineHeader.svelte` |
| 多平台支持 | 适配多个 AI 对话页面 | `src/lib/platform/*.ts` |
| 主题切换 | 明亮/暗色主题切换 | `src/lib/stores/theme.ts` |
| 设置管理 | 功能开关与配置项持久化 | `src/lib/stores/features.ts` |
| 日志系统 | 可配置日志级别 | `src/lib/services/logger.ts` |

## 平台支持

| 平台 | 域名 | 大纲跟随 |
|------|------|----------|
| ChatGPT | `chatgpt.com` | ✅支持 |
| DeepSeek | `chat.deepseek.com` | ✅支持 |
| 豆包 | `*.doubao.com` | ✅支持 |
| Grok | `grok.com` | ✅支持 |
| 通义千问 | `www.qianwen.com` | ❌不支持 |
| Qwen | `chat.qwen.ai` | ✅支持 |
| Kimi | `www.kimi.com` | ✅支持 |

## 面板控制项

| 按钮 | 功能 | 实现位置 |
|------|------|----------|
| 刷新 | 强制刷新大纲 | `src/lib/components/outline/OutlineHeader.svelte` |
| 同步 | 手动同步大纲位置 | `src/lib/components/outline/OutlineHeader.svelte` |
| 展开/收起 | 切换全部节点展开状态 | `src/lib/components/outline/OutlineHeader.svelte` |
| 主题 | 切换明暗主题 | `src/lib/components/outline/OutlineHeader.svelte` |
| 搜索 | 过滤大纲内容 | `src/lib/components/outline/OutlineHeader.svelte` |
| 设置 | 打开设置面板 | `src/lib/components/outline/SettingsModal.svelte` |
| 隐藏 | 隐藏大纲面板 | `src/lib/components/outline/OutlinePanel.svelte` |

## 配置项

| 配置 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoExpand` | boolean | `true` | 自动展开节点 |
| `showUserMessages` | boolean | `true` | 显示用户消息 |
| `showAIMessages` | boolean | `true` | 显示 AI 回复 |
| `isVisible` | boolean | `true` | 控制大纲面板显示 |
| `textLength` | number | `50` | 大纲文本截断长度 |
| `debouncedInterval` | number | `500` | DOM 更新防抖时间（ms） |
| `syncScroll` | boolean | `true` | 启用滚动同步 |
| `logLevel` | string | `'info'` | 日志级别 |
