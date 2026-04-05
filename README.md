# chat_box_enhance

一个用于多个 AI Web 对话页面的油猴脚本，为聊天内容生成树形大纲，便于快速定位上下文、标题结构和关键回复。

## 功能概览

- 自动解析聊天消息并生成大纲
- 支持用户消息与 AI 消息分组展示
- 自动识别 Markdown 标题并生成层级结构
- 支持聊天内容动态更新后的实时刷新
- 支持大纲搜索与正则过滤
- 支持滚动同步与当前位置高亮
- 支持主题切换、显示隐藏、设置面板
- 支持多个 AI 对话平台

## 当前支持平台

| 平台 | 域名 | 大纲跟随 |
|------|------|----------|
| ChatGPT | `chatgpt.com` | ✅支持 |
| DeepSeek | `chat.deepseek.com` | ✅支持 |
| 豆包 | `*.doubao.com` | ✅支持 |
| Grok | `grok.com` | ✅支持 |
| 通义千问 | `www.qianwen.com` | ✅支持 |
| Qwen | `chat.qwen.ai` | ✅支持 |
| Kimi | `www.kimi.com` | ✅支持 |

## 安装方式

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)
2. 从项目发布页下载最新的 `chat_box_enhance.user.js`
3. 使用 Tampermonkey 安装脚本
4. 打开支持的 AI 对话页面后脚本会自动生效

## 使用说明

- 大纲面板会自动插入到页面对应区域
- 若目标容器无法挂载，会回退到右侧固定面板模式
- 点击大纲项可快速跳转到对应消息
- 点击标题节点可跳转到对应标题位置
- 可通过顶部工具栏进行刷新、同步、筛选、主题切换与设置

## 主要按钮

| 按钮 | 作用 |
|------|------|
| 刷新 | 强制刷新大纲 |
| 同步 | 手动同步大纲定位 |
| 展开/收起 | 切换全部节点展开状态 |
| 主题 | 切换明暗主题 |
| 搜索 | 按文本或正则过滤大纲 |
| 设置 | 打开设置面板 |
| 隐藏 | 隐藏大纲面板 |

## 项目架构

当前项目已将“大纲挂载、刷新、监听、动态更新”统一收口到运行时 service：

- `src/App.svelte`
  - 仅负责入口启动和销毁
- `src/lib/services/outlineRuntimeService.ts`
  - 统一管理大纲挂载
  - 统一执行首次刷新
  - 统一注册 `MutationObserver`
  - 统一处理销毁清理
- `src/lib/services/outline.ts`
  - 负责大纲数据生成、增量刷新与强制刷新
- `src/lib/services/observer.ts`
  - 负责 DOM 变化监听
- `src/lib/services/scrollSyncService.ts`
  - 负责滚动同步与高亮逻辑

### 运行流程

```text
App.svelte
  -> outlineRuntimeService.start(parserConfig)
      -> 挂载 OutlinePanel
      -> 刷新大纲数据
      -> 初始化滚动同步
      -> 注册 DOM 监听

DOM 变化
  -> observerService
      -> outlineService.refresh()
      -> 更新 outlineStore
      -> Svelte 组件重新渲染
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发模式 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览构建结果 |
| `pnpm check` | 运行类型与 Svelte 检查 |

## 目录参考

- 架构说明：`doc/ARCHITECTURE.md`
- 功能列表：`doc/FEATURES.md`
- 目录结构：`doc/STRUCTURE.md`
- 设置配置：`doc/SETTINGS.md`
- 待办事项：`doc/TODO.md`
- 变更记录：`CHANGELOG.md`

## 开发说明

如果要新增平台支持，通常需要：

1. 在 `src/lib/platform/` 中新增平台适配文件
2. 实现对应的 `ParserConfig`
3. 在平台判断逻辑中注册该平台
4. 完成页面挂载、消息提取与滚动容器适配

如果要修改大纲运行流程，优先查看：

- `src/lib/services/outlineRuntimeService.ts`
- `src/lib/services/outline.ts`
- `src/lib/services/observer.ts`

## 贡献

欢迎提交 Issue 或 Pull Request 来改进这个项目。

