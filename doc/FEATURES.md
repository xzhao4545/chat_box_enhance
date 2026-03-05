# 功能特性

## 核心功能

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 智能大纲生成 | 解析对话内容，生成可交互大纲 | `services/outline.ts` |
| 消息缓存 | 缓存已解析消息，智能检测变化 | `services/messageCacheManager.ts` |
| 滚动同步 | 消息列表滚动时同步大纲位置 | `services/scrollSyncService.ts` |
| 多平台支持 | 适配多个AI聊天平台 | `platform/*.ts` |
| 主题切换 | 亮色/暗色主题 | `stores/theme.ts` |

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

| 按钮 | 功能 |
|------|------|
| 🔄 | 强制刷新大纲 |
| 📂/📁 | 展开/收起所有 |
| 🌙/☀️ | 切换主题 |
| 📍 | 同步大纲位置 |
| ✕ | 隐藏面板 |

## 配置项

| 配置 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `syncScroll` | boolean | true | 滚动同步开关 |
| `textLength` | number | 50 | 大纲文字截取长度 |
| `debouncedInterval` | number | 500 | 防抖间隔(ms) |

## 添加新平台

1. 创建 `src/lib/platform/newplatform.ts`，实现 `ParserConfig` 接口
2. 在 `stores/platform.ts` 的 `judgePlatform()` 添加域名判断
3. 在 `platform/index.ts` 导出配置

详见 [ARCHITECTURE.md](./ARCHITECTURE.md)