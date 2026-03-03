# AGENTS.md - chat_box_enhance

## Agent 规则

- 对用户的描述或需求有任何疑问，必须主动询问用户以获取更多信息
- 若用户回复的描述仍不清晰，则继续询问直到足够清晰为止

## 项目简介

chat_box_enhance 是一个油猴脚本，使用 vite-plugin-monkey 框架，svelte 实现gui。

该脚本为多个ai厂商的web对话页面添加树形大纲生成，方便用户查看。

## 技术栈

- **Language**: TypeScript
- **Build**: vite
- **Package Manager**: pnpm

## 文档维护规则

1. **不要主动更新文档** — 仅当用户明确要求时才更新
2. **任务完成后询问** — 可询问用户是否需要更新相关文档
3. **需求记录** — 新功能需求添加到 [TODO.md](./doc/TODO.md)