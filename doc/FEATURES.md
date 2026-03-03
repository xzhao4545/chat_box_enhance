# 功能特性

## 核心功能

### 智能大纲生成

自动解析AI对话内容，生成结构化大纲视图：

- **消息识别**: 自动区分用户消息(👤)和AI回复(🤖)
- **标题解析**: 识别Markdown标题(h1-h6)，构建层级结构
- **实时更新**: 监听对话变化，自动刷新大纲内容
- **可交互**: 点击大纲项跳转到对应消息位置

### 多平台支持

支持主流AI聊天平台：

| 平台 | 域名 | 特点 |
|------|------|------|
| ChatGPT | chatgpt.com | 官方GPT对话 |
| DeepSeek | chat.deepseek.com | 国产大模型 |
| 豆包 | *.doubao.com | 字节跳动AI |
| Grok | grok.com | xAI对话 |
| 通义千问 | www.qianwen.com | 阿里大模型 |
| Qwen | chat.qwen.ai | 阿里新平台 |
| Kimi | www.kimi.com | 月之暗面 |

### 主题系统

- **双主题模式**: 支持亮色(Light)和暗色(Dark)主题
- **自动记忆**: 主题选择保存到localStorage
- **平滑过渡**: 主题切换带动画效果

### 交互控制

#### 控制按钮

| 按钮 | 功能 |
|------|------|
| 🔄 | 强制刷新大纲 |
| 📂/📁 | 展开/收起所有节点 |
| 🌙/☀️ | 切换亮色/暗色主题 |
| ✕ | 隐藏大纲面板 |

#### 快捷操作

- **点击消息项**: 跳转到对应对话位置
- **点击标题节点**: 跳转到具体标题位置
- **展开/收起**: 点击▼/▶控制子内容显示

## 技术特性

### 性能优化

1. **消息缓存机制**
   - 缓存已解析的消息，避免重复处理
   - 智能检测消息变化，只更新有变化的部分

2. **防抖更新**
   - DOM变化时防抖刷新，避免频繁重绘
   - 默认500ms防抖间隔

3. **高效渲染**
   - Svelte编译时优化，无虚拟DOM开销
   - CSS变量实现主题切换，避免样式重计算

### 响应式设计

- 自适应不同屏幕尺寸
- 大纲宽度固定300px
- 内容区域可滚动

### 可访问性

- 语义化HTML结构
- 键盘可访问（tabindex + Enter键）
- ARIA标签支持

## 配置选项

### 功能配置 (`FeaturesConfig`)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `autoExpand` | boolean | true | 自动展开节点 |
| `showUserMessages` | boolean | true | 显示用户消息 |
| `showAIMessages` | boolean | true | 显示AI消息 |
| `enableAnimation` | boolean | true | 启用动画效果 |
| `isVisible` | boolean | true | 大纲可见性 |
| `textLength` | number | 50 | 大纲文字截取长度 |
| `debouncedInterval` | number | 500 | 防抖间隔(ms) |

### 主题配置 (`ThemeConfig`)

| 配置项 | 说明 |
|--------|------|
| `highlightColor` | 高亮颜色 |
| `highlightTime` | 高亮持续时间(ms) |
| `currentTheme` | 当前主题(light/dark) |
| `colors` | 颜色配置（亮色/暗色两套） |
| `sizes` | 尺寸配置 |

## 扩展开发

### 添加新平台

1. 在 `src/lib/platform/` 创建新文件，如 `newplatform.ts`
2. 实现 `ParserConfig` 接口：

```typescript
import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const newplatformConfig: ParserConfig = {
  // 选择聊天区域根元素
  selectChatArea: () => document.querySelector('.chat-container'),
  
  // 获取消息列表
  getMessageList: (root) => root.querySelectorAll('.message'),
  
  // 判断消息所有者
  determineMessageOwner: (ele) => {
    if (ele.classList.contains('user')) return MessageOwner.User;
    if (ele.classList.contains('assistant')) return MessageOwner.Assistant;
    return MessageOwner.Other;
  },
  
  // 插入大纲到页面
  insertOutline: (outlineEle) => {
    document.querySelector('.sidebar')?.appendChild(outlineEle);
    return true;
  },
  
  // 可选：初始化延迟
  timeout: 3000
};
```

3. 在 `platform/index.ts` 导出配置
4. 在 `stores/platform.ts` 的 `judgePlatform()` 添加域名判断

### 自定义主题

修改 `src/app.css` 中的CSS变量：

```css
:root {
  --outline-bg: #your-color;
  --outline-text: #your-color;
  /* ... */
}

[data-theme="dark"] {
  --outline-bg: #your-dark-color;
  /* ... */
}
```

## 已知限制

1. 平台页面结构变化可能导致解析失败
2. 部分平台的动态加载内容需要手动刷新
3. 嵌套过深的标题可能影响渲染性能

## 版本历史

### v0.0.5 (当前Svelte重构版)
- 完全重构为Svelte 5架构
- 使用Svelte Stores管理状态
- CSS变量实现主题系统
- 组件化UI渲染

### v0.0.4 及之前
- 原生DOM操作实现
- 手动样式注入
- 函数式架构