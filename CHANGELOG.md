# Changelog

## [Unreleased]

## [0.1.4] 2026-04-5

- 添加书签功能
- 为通义千问页面适配大纲滚动跟随
- 添加元宝页面支持

## [0.1.3] 2026-03-14

- 适配DeepSeek新的页面结构

## [0.1.2] 2026-03-11

- 新增 `src/lib/services/outlineRefreshService.ts`，将大纲刷新流程从兼容层中拆分出来
- 新增 `src/lib/services/messageSourceService.ts`，统一负责 chatArea 缓存、消息采集与消息 ID 补齐
- 收口大纲构建逻辑到 `src/lib/utils/outlineBuilder.ts`
- 重构 `messageCacheManager`，引入基于 `messageId` / `outlineId` 的索引化缓存
- 优化搜索逻辑，改为使用预构建 `searchText`，并为输入增加防抖与正则容错
- 优化 `MutationObserver` 触发策略，减少流式输出过程中的无效刷新
- 重构滚动同步逻辑，新增锚点式定位能力，支持消息节点与树形标题节点的统一跟随
- 修复手动同步无效、自动跟随误跳到末尾、点击节点后列表重复自滚动等问题

## [0.1.1] 2026-03-11

- 重构大纲运行时架构：新增 `src/lib/services/outlineRuntimeService.ts`
- 将“大纲挂载、首次刷新、MutationObserver 注册、销毁清理”统一收口到运行时 service
- `src/App.svelte` 精简为入口启动与销毁职责
- `src/lib/services/outline.ts` 与 `src/lib/services/observer.ts` 收口为 service 对象对外提供能力
- 优化大纲滚动跟随逻辑
- 新增通知弹窗与状态栏
- 修复 GM 方法注入失败时的兜底处理
- 修复一个构建警告
- 更新 `README.md` 与 `doc/ARCHITECTURE.md`、`doc/FEATURES.md`、`doc/STRUCTURE.md` 文档说明

## [0.1.0] 2026-03-05

- 新增大纲跟随功能（deepseek、doubao、Qwen、kimi、chatgpt、grok 支持）
- 新增大纲搜索，支持正则
- 新增设置面板
- 新增隐藏大纲时的拖拽按钮
- 重构缓存逻辑

## [0.0.5]

- 更新初始化逻辑，确保刷新操作可在初始化失败后再次执行
- 更新 doubao 大纲生成逻辑
- 新增 kimi 大纲生成支持

## [0.0.4]

- 更新元素缓存节点判断逻辑
- 更新 deepseek 消息来源判断逻辑

## [0.0.3]

- 优化元素缓存方法，更新大纲时不再重置元素状态
- 更新 deepseek 页面监听元素路径，使无对话时仍可正常监听
- 更新 chatgpt 页面插入时机，在页面渲染完成后再进行插入

## [0.0.2]

- 新增大纲插入重试，当前多次插入失败时改为直接插入 `body`
- 修改 tongyi.com 域名为 qianwen.com

## [0.0.1]

- 初始版本发布
- 支持 6 个主流 AI 聊天平台
- 实现基础大纲功能和主题切换
- 增加性能优化和缓存机制
