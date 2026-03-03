# 项目架构

## 概述

本项目是一个油猴脚本，为多个AI聊天平台生成智能对话大纲。项目采用 **Svelte 5** 框架重构，使用现代化的组件化架构。

## 技术栈

- **框架**: Svelte 5 (Runes API)
- **构建工具**: Vite 7
- **类型系统**: TypeScript 5
- **状态管理**: Svelte Stores
- **样式方案**: CSS变量 + 组件内样式
- **打包插件**: vite-plugin-monkey

### 数据流

```
用户操作 → 组件事件 → Store更新 → 组件响应式渲染
                ↓
           Service处理
                ↓
          平台适配器执行
```

## 核心模块

### 1. 组件系统 (Components)

所有UI由Svelte组件渲染，采用单向数据流：

- **OutlinePanel**: 主面板容器，协调子组件
- **OutlineHeader**: 控制栏（刷新/展开/主题切换）
- **OutlineList**: 大纲列表容器
- **OutlineItem**: 单条大纲项（用户消息/AI消息）
- **HeaderTree**: 标题层级树（递归组件）

### 2. 状态管理 (Stores)

使用 Svelte Stores 集中管理应用状态：

| Store | 用途 |
|-------|------|
| `themeStore` | 主题配置（亮色/暗色） |
| `featuresStore` | 功能开关配置 |
| `outlineStore` | 大纲数据 |
| `platformStore` | 当前平台信息 |
| `messageCacheStore` | 消息缓存 |

### 3. 服务层 (Services)

封装核心业务逻辑：

- **observerService**: MutationObserver管理，监听DOM变化
- **outlineService**: 大纲生成逻辑，消息解析

### 4. 平台适配 (Platform)

每个平台实现 `ParserConfig` 接口：

```typescript
interface ParserConfig {
  selectChatArea: () => Element | null;      // 选择聊天区域
  getMessageList: (root: Element) => ...;     // 获取消息列表
  determineMessageOwner: (ele: Element) => MessageOwner; // 判断消息类型
  insertOutline: (ele: Element) => boolean;   // 插入大纲到页面
  timeout?: number;                           // 初始化延迟
}
```

## 响应式系统

使用 Svelte 5 Runes API：

```typescript
// 状态声明
let isReady = $state(false);

// 派生状态
let currentColors = $derived(theme.colors[theme.currentTheme]);

// 副作用
$effect(() => {
  document.documentElement.setAttribute('data-theme', theme.currentTheme);
});
```

## 主题系统

采用 CSS 变量实现主题切换：

```css
:root {
  --outline-bg: #ffffff;
  --outline-text: #333333;
  /* ... */
}

[data-theme="dark"] {
  --outline-bg: #2d2d2d;
  --outline-text: #e0e0e0;
  /* ... */
}
```

## 性能优化

1. **消息缓存**: 避免重复解析未变化的消息
2. **防抖更新**: DOM变化时防抖刷新大纲
3. **CSS变量**: 避免动态样式计算
4. **组件懒加载**: 按需渲染