# 目录结构

## 概览

```
src/
├── app.css                    # 全局CSS变量（主题系统）
├── App.svelte                 # 根组件
├── main.ts                    # 入口文件
├── vite-env.d.ts              # Vite类型声明
├── assets/                    # 静态资源目录
└── lib/                       # 核心库代码
    ├── types/                 # TypeScript类型定义
    │   ├── index.ts           # 类型入口
    │   ├── message.ts         # 消息、大纲项类型
    │   ├── config.ts          # 配置类型
    │   └── platform.ts        # 平台配置类型
    │
    ├── stores/                # Svelte Stores状态管理
    │   ├── index.ts           # Stores入口
    │   ├── theme.ts           # 主题状态
    │   ├── features.ts        # 功能配置状态
    │   ├── outline.ts         # 大纲数据状态
    │   ├── platform.ts        # 平台检测状态
    │   └── messageCache.ts    # 消息缓存状态
    │
    ├── utils/                 # 工具函数
    │   ├── index.ts           # 工具入口
    │   ├── debounce.ts        # 防抖函数
    │   ├── retry.ts           # 重试机制
    │   └── highlight.ts       # 高亮效果
    │
    ├── platform/              # 平台适配器
    │   ├── index.ts           # 平台入口
    │   ├── chatgpt.ts         # ChatGPT配置
    │   ├── deepseek.ts        # DeepSeek配置
    │   ├── doubao.ts          # 豆包配置
    │   ├── grok.ts            # Grok配置
    │   ├── tongyi.ts          # 通义千问配置
    │   ├── qwen.ts            # Qwen配置
    │   └── kimi.ts            # Kimi配置
    │
    ├── services/              # 业务服务
    │   ├── index.ts           # 服务入口
    │   ├── observer.ts        # MutationObserver服务
    │   └── outline.ts         # 大纲生成服务
    │
    └── components/            # Svelte组件
        ├── index.ts           # 组件入口
        └── outline/           # 大纲相关组件
            ├── OutlinePanel.svelte    # 大纲面板（主组件）
            ├── OutlineHeader.svelte   # 头部控制栏
            ├── OutlineList.svelte     # 大纲列表
            ├── OutlineItem.svelte     # 大纲项
            └── HeaderTree.svelte      # 标题树组件（递归）
```

## 文件说明

### 入口文件

| 文件 | 说明 |
|------|------|
| `main.ts` | 应用入口，挂载Svelte应用到DOM |
| `App.svelte` | 根组件，处理初始化逻辑 |
| `app.css` | 全局CSS变量定义 |

### 类型定义 (`lib/types/`)

| 文件 | 说明 |
|------|------|
| `message.ts` | `MessageOwner`, `HeaderTreeNode`, `OutlineItem`, `CachedMessage` |
| `config.ts` | `ThemeConfig`, `FeaturesConfig`, `GlobalConfig` 等配置类型 |
| `platform.ts` | `ParserConfig` 平台解析器配置接口 |

### 状态管理 (`lib/stores/`)

| 文件 | 说明 |
|------|------|
| `theme.ts` | 主题状态：亮色/暗色切换 |
| `features.ts` | 功能开关：显示/隐藏、展开/收起 |
| `outline.ts` | 大纲数据：消息列表、标题树 |
| `platform.ts` | 平台状态：当前平台、解析器配置 |
| `messageCache.ts` | 消息缓存：ID生成、缓存管理 |

### 工具函数 (`lib/utils/`)

| 文件 | 说明 |
|------|------|
| `debounce.ts` | 防抖函数，用于延迟执行 |
| `retry.ts` | 重试机制，获取DOM元素 |
| `highlight.ts` | 高亮效果，滚动到元素时闪烁 |

### 平台适配 (`lib/platform/`)

每个平台文件实现 `ParserConfig` 接口：

| 文件 | 平台 | 域名 |
|------|------|------|
| `chatgpt.ts` | ChatGPT | chatgpt.com |
| `deepseek.ts` | DeepSeek | chat.deepseek.com |
| `doubao.ts` | 豆包 | *.doubao.com |
| `grok.ts` | Grok | grok.com |
| `tongyi.ts` | 通义千问 | www.qianwen.com |
| `qwen.ts` | Qwen | chat.qwen.ai |
| `kimi.ts` | Kimi | www.kimi.com |

### 业务服务 (`lib/services/`)

| 文件 | 说明 |
|------|------|
| `observer.ts` | MutationObserver管理，监听聊天区域DOM变化 |
| `outline.ts` | 大纲生成逻辑，解析消息、构建标题树 |

### 组件 (`lib/components/`)

| 组件 | 说明 |
|------|------|
| `OutlinePanel.svelte` | 主面板容器，协调所有子组件 |
| `OutlineHeader.svelte` | 头部控制栏：刷新、展开/收起、主题切换、隐藏 |
| `OutlineList.svelte` | 大纲列表容器，订阅outlineStore |
| `OutlineItem.svelte` | 单条大纲项，区分用户消息和AI消息 |
| `HeaderTree.svelte` | 标题层级树，递归渲染子节点 |

## 构建产物

```
dist/
└── chat_box_enhance.user.js   # 油猴脚本（约137KB）
```

## 配置文件

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | Vite配置 + vite-plugin-monkey |
| `svelte.config.js` | Svelte预处理器配置 |
| `tsconfig.json` | TypeScript配置 |
| `package.json` | 项目依赖和脚本 |