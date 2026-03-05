# 目录结构

## 源码结构

```
src/
├── main.ts                 # 入口文件
├── App.svelte              # 根组件
├── app.css                 # 全局样式（主题变量）
└── lib/
    ├── types/              # 类型定义
    ├── stores/             # 状态管理
    ├── services/           # 业务服务
    ├── platform/           # 平台适配器
    ├── components/         # Svelte组件
    └── utils/              # 工具函数
```

## 构建产物

| 文件 | 说明 |
|------|------|
| `dist/chat_box_enhance.user.js` | 油猴脚本（约137KB） |

## 配置文件

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | Vite + vite-plugin-monkey 配置 |
| `svelte.config.js` | Svelte 预处理器配置 |
| `tsconfig.json` | TypeScript 配置 |
| `package.json` | 项目依赖和脚本 |