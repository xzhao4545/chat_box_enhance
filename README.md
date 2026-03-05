# 聊天助手大纲 (Chat Assistant Outline)

一个支持多个AI聊天平台的用户脚本，为对话生成可交互的大纲视图，提升聊天体验和内容导航效率。
作者很懒，仅保证常用的DeepSeek可用。

## 功能特性

### 🎯 核心功能
- **智能大纲生成**: 自动解析对话内容，生成结构化大纲
- **多平台支持**: 支持 ChatGPT、DeepSeek、豆包、Grok、通义千问、Qwen、Kimi 等主流AI平台
- **实时更新**: 监听对话变化，实时更新大纲内容
- **层级结构**: 自动识别Markdown标题，构建可展开的树形结构
- **大纲跟随**: 滚动对话时自动高亮当前位置对应的大纲项
- **搜索功能**: 支持正则表达式搜索大纲内容

### 🎨 界面特性
- **双主题模式**: 支持明亮/暗黑主题切换
- **响应式设计**: 自适应不同屏幕尺寸
- **动画效果**: 平滑的展开/收起动画和高亮效果
- **可视化标识**: 用户消息(👤)和AI回复(🤖)的直观区分
- **拖拽按钮**: 隐藏大纲时可拖拽切换按钮到任意位置
- **设置面板**: 可自定义功能开关和显示选项

## 支持平台

| 平台 | 域名 | 状态 |
|------|------|------|
| ChatGPT | chatgpt.com | ✅ 支持 |
| DeepSeek | chat.deepseek.com | ✅ 支持 |
| 豆包 | *.doubao.com | ✅ 支持 |
| Grok | grok.com | ✅ 支持 |
| 通义千问 | www.qianwen.com | ✅ 支持 |
| Qwen | chat.qwen.ai | ✅ 支持 |
| Kimi | www.kimi.com | ✅ 支持 |

## 安装使用

### 安装步骤
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 从 [GitHub Releases](https://github.com/xzhao4545/chat_box_enhance/releases) 下载最新版本的 `chat_box_enhance.user.js`
3. 点击文件安装到 Tampermonkey
4. 访问支持的AI聊天平台即可自动启用

### 使用说明
- 大纲面板会自动出现在聊天界面右侧
- 点击大纲项可快速跳转到对应消息
- 使用工具栏按钮进行个性化设置
- 点击设置按钮(⚙️)可打开详细配置面板

## 界面控制

### 工具栏按钮
- **🔄 刷新**: 强制刷新大纲内容
- **📂/📁 展开/收起**: 批量展开或收起所有节点
- **🌙/☀️ 主题**: 切换明亮/暗黑主题
- **📍 同步**: 手动同步大纲到当前滚动位置
- **🔍 搜索**: 搜索大纲内容（支持正则表达式）
- **⚙️ 设置**: 打开设置面板
- **✕ 隐藏**: 隐藏大纲面板（显示可拖拽的切换按钮）

### 快捷操作
- 点击消息项: 跳转到对应对话位置
- 点击标题节点: 跳转到具体标题位置
- 展开/收起按钮: 控制子内容显示
- 拖拽切换按钮: 隐藏大纲时可拖拽按钮到任意位置

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

### 如何贡献
1. Fork 本仓库: [https://github.com/xzhao4545/chat_box_enhance](https://github.com/xzhao4545/chat_box_enhance)
2. 创建你的功能分支
3. 提交你的更改
4. 推送到分支
5. 创建 Pull Request

### 添加新平台支持
1. 在 `src/lib/platform/` 创建新平台配置文件
2. 实现 `ParserConfig` 接口
3. 在 `src/lib/stores/platform.ts` 的 `judgePlatform()` 添加域名判断
4. 在 `src/lib/platform/index.ts` 导出配置
5. 测试并提交代码

详见 [开发文档](./doc/)