# AGENTS.md - chat_box_enhance

## Agent 规则

- 对用户的描述或需求有任何疑问，必须主动询问用户以获取更多信息
- 若用户回复的描述仍不清晰，则继续询问直到足够清晰为止

## 项目简介

chat_box_enhance 是一个油猴脚本，使用 vite-plugin-monkey 框架，Svelte 5 实现 GUI。

该脚本为多个 AI 厂商的 Web 对话页面添加树形大纲生成，方便用户查看。

## 技术栈

- **语言**: TypeScript
- **框架**: Svelte 5 (Runes API)
- **构建**: Vite 7 + vite-plugin-monkey
- **包管理**: pnpm

## 文档导航

|-----------|--------|
| 功能列表与实现位置 | [doc/FEATURES.md](./doc/FEATURES.md) |
| 项目架构与核心模块 | [doc/ARCHITECTURE.md](./doc/ARCHITECTURE.md) |
| 目录结构与文件说明 | [doc/STRUCTURE.md](./doc/STRUCTURE.md) |
| 编码规范 | [doc/CONTRIBUTING.md](./doc/CONTRIBUTING.md) |
| 设置配置说明 | [doc/SETTINGS.md](./doc/SETTINGS.md) |
| 待办事项 | [doc/TODO.md](./doc/TODO.md) |

## 文档维护规则

1. **不要主动更新文档** — 仅当用户明确要求时才更新
2. **任务完成后询问** — 可询问用户是否需要更新相关文档
3. **需求记录** — 新功能需求添加到 [doc/TODO.md](./doc/TODO.md)