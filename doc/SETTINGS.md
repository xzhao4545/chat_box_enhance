# 设置配置

## 当前设置项

基于 `src/lib/types/config.ts` 中的 `FeaturesConfig` 接口：

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| autoExpand | boolean | true | 自动展开节点 |
| showUserMessages | boolean | true | 显示用户消息 |
| showAIMessages | boolean | true | 显示AI回复 |
| isVisible | boolean | true | 大纲可见性 |
| textLength | number | 50 | 文本长度限制 |
| debouncedInterval | number | 500 | 更新间隔(ms) |
| syncScroll | boolean | true | 同步滚动 |
| logLevel | string | 'info' | 日志级别 (debug/info/warn/error) |

## 存储方式

- 使用 `src\lib\stores\features.ts:featuresStore` 全局存储配置
- 存储键：`chat-outline-features`
- 跨域名共享配置

## 更新 FeaturesConfig 时需同步

1. `src/lib/stores/features.ts` - defaultFeatures 对象
2. `src/lib/components/outline/SettingsModal.svelte` - 设置项 UI
3. `src/lib/services/logger.ts` - Logger service (如涉及日志级别)
4. `doc/SETTINGS.md` - 本文档的设置项表格
