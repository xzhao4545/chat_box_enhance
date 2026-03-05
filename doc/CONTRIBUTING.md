# 编码规范

## 服务层

### 类结构

```typescript
export class SomeService {
  private cache: SomeType[] = [];
  
  // 公共方法
  getData(): SomeType[] { }
  
  // 私有方法
  private processData(): void { }
  
  // 清理资源
  destroy(): void { }
}

// 导出单例
export const someService = new SomeService();
```

### 平台适配器

实现 `ParserConfig` 接口（详见 [ARCHITECTURE.md](./ARCHITECTURE.md)）：

```typescript
export const platformConfig: ParserConfig = {
  selectChatArea: () => document.querySelector('.chat'),
  getMessageList: (root) => root.querySelectorAll('.message'),
  determineMessageOwner: (ele) => 
    ele.classList.contains('user') ? MessageOwner.User : MessageOwner.Assistant,
  getOutlineContainer: () => document.querySelector('.sidebar'),
  getScrollContainer: (chatArea) => chatArea.querySelector('.scroll-area'),
};
```

## 注释规范

```typescript
/**
 * 刷新大纲项
 * @param parserConfig 解析器配置
 * @returns 无返回值
 */
export function refreshOutlineItems(parserConfig: ParserConfig): void {
  // 实现逻辑
}

// 单行注释：说明复杂逻辑
const hash = generateMessageHash(index, element);
```

## 错误处理

```typescript
// ✅ 推荐：使用可选链和空值合并
const element = config?.selectChatArea() ?? null;

// ✅ 推荐：明确的错误处理
try {
  await someAsyncOperation();
} catch (error) {
  console.error('操作失败:', error);
}

// ❌ 避免：空 catch 块
try { } catch (e) { }
```

## 性能考量

1. **缓存**: 使用 `MessageCacheManager` 避免重复解析
2. **防抖**: DOM变化时使用防抖延迟更新
3. **惰性加载**: 仅在需要时创建对象
4. **DOM操作**: 批量更新，减少重绘