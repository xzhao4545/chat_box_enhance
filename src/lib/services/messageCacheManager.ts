/**
 * 消息缓存管理器
 * 负责管理CachedMessage数组的缓存逻辑
 */

import type { CachedMessage, OutlineItem, ParserConfig } from '../types';
import { MessageOwner } from '../types';
import { generateMessageHash, createOutlineItem } from '../stores/messageCache';

/**
 * 缓存验证结果
 */
interface CacheValidationResult {
  isValid: boolean;
  needsUpdate: boolean;
  cachedMessage?: CachedMessage;
}

/**
 * 缓存变更检测结果
 */
export interface CacheChanges {
  hasChanges: boolean;
  changedIndices: number[];
  addedCount: number;
  removedCount: number;
}

/**
 * 消息缓存管理器类
 */
export class MessageCacheManager {
  private cache: CachedMessage[] = [];

  /**
   * 获取当前缓存
   */
  getCache(): CachedMessage[] {
    return this.cache;
  }

  /**
   * 设置缓存
   */
  setCache(cache: CachedMessage[]): void {
    this.cache = cache;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache = [];
  }

  /**
   * 获取缓存长度
   */
  get length(): number {
    return this.cache.length;
  }

  /**
   * 获取指定索引的缓存项
   */
  get(index: number): CachedMessage | undefined {
    return this.cache[index];
  }

  /**
   * 检查最后一条消息是否需要更新
   * @param messageElements 消息元素列表
   * @returns 是否需要更新整个列表，以及最后一条消息的更新信息
   */
  checkLastMessage(messageElements: HTMLCollection | Element[] | NodeListOf<Element>): {
    shouldRefreshAll: boolean;
    lastMessageNeedsUpdate: boolean;
    lastIndex: number;
  } {
    if (this.cache.length === 0 || messageElements.length === 0) {
      return { shouldRefreshAll: true, lastMessageNeedsUpdate: true, lastIndex: -1 };
    }

    const lastIndex = messageElements.length - 1;
    const lastMessage = messageElements[lastIndex];
    const lastCached = this.cache[this.cache.length - 1];

    // 获取消息元素的cbe-message-id属性
    const messageId = lastMessage.getAttribute('cbe-message-id');

    // 如果ID不一致，说明整个消息列表可能有变化，需要刷新全部
    if (messageId !== lastCached.messageId) {
      console.log('最后一条消息ID不一致，需要刷新全部', {
        cachedId: lastCached.messageId,
        elementId: messageId
      });
      return { shouldRefreshAll: true, lastMessageNeedsUpdate: true, lastIndex };
    }

    // ID一致，检查Hash是否一致
    const currentHash = generateMessageHash(lastIndex, lastMessage);
    const hashConsistent = lastCached.messageHash === currentHash;

    console.log('最后一条消息检查:', {
      id: messageId,
      hashConsistent,
      cachedHash: lastCached.messageHash,
      currentHash
    });

    return {
      shouldRefreshAll: false,
      lastMessageNeedsUpdate: !hashConsistent,
      lastIndex
    };
  }

  /**
   * 更新最后一条缓存
   * @param messageElement 消息元素
   * @param index 索引
   * @param outlineItem 新的大纲项
   * @param outlineElement 大纲DOM元素
   */
  updateLastCache(
    messageElement: Element,
    index: number,
    outlineItem: OutlineItem,
    outlineElement: Element
  ): void {
    const messageHash = generateMessageHash(index, messageElement);
    const messageId = messageElement.getAttribute('cbe-message-id') || Date.now().toString();

    // 如果没有cbe-message-id，设置它
    if (!messageElement.getAttribute('cbe-message-id')) {
      messageElement.setAttribute('cbe-message-id', messageId);
    }

    const newCacheItem: CachedMessage = {
      messageId,
      messageHash,
      textLength: messageElement.textContent?.length || 0,
      outlineElement,
      outlineItem,
      timestamp: Date.now()
    };

    // 替换最后一条缓存
    this.cache[this.cache.length - 1] = newCacheItem;
    console.log('更新最后一条缓存:', { index, messageId, messageHash });
  }

  /**
   * 验证单个缓存项
   * @param cachedMessage 缓存的消息
   * @param messageElement 当前消息元素
   * @param index 索引
   * @returns 验证结果
   */
  validateCacheItem(
    cachedMessage: CachedMessage,
    messageElement: Element,
    index: number
  ): CacheValidationResult {
    const messageId = messageElement.getAttribute('cbe-message-id');

    // 检查ID是否一致
    if (messageId !== cachedMessage.messageId) {
      console.log(`索引 ${index} 的ID不一致，需要更新`, {
        cachedId: cachedMessage.messageId,
        elementId: messageId
      });
      return { isValid: false, needsUpdate: true };
    }

    // ID一致，检查Hash是否一致
    const currentHash = generateMessageHash(index, messageElement);
    if (currentHash !== cachedMessage.messageHash) {
      console.log(`索引 ${index} 的Hash不一致，需要更新`, {
        cachedHash: cachedMessage.messageHash,
        currentHash
      });
      return { isValid: true, needsUpdate: true, cachedMessage };
    }

    // ID和Hash都一致，缓存有效
    return { isValid: true, needsUpdate: false, cachedMessage };
  }

  /**
   * 创建新的缓存项
   * @param messageElement 消息元素
   * @param index 索引
   * @param messageType 消息类型
   * @param textLength 文本长度限制
   * @param outlineElement 大纲DOM元素
   * @returns 新的缓存项
   */
  createCacheItem(
    messageElement: Element,
    index: number,
    messageType: MessageOwner,
    textLength: number,
    outlineElement: Element
  ): CachedMessage | null {
    const outlineItem = createOutlineItem(messageElement, index, messageType, textLength);
    if (!outlineItem) {
      return null;
    }

    const messageHash = generateMessageHash(index, messageElement);
    let messageId = messageElement.getAttribute('cbe-message-id');

    // 如果没有cbe-message-id，生成并设置它
    if (!messageId) {
      messageId = Date.now().toString();
      messageElement.setAttribute('cbe-message-id', messageId);
    }

    return {
      messageId,
      messageHash,
      textLength: messageElement.textContent?.length || 0,
      outlineElement,
      outlineItem,
      timestamp: Date.now()
    };
  }

  /**
   * 智能重建缓存 - 精确追踪变更
   * @param messageElements 消息元素列表
   * @param parserConfig 解析配置
   * @param features 功能配置
   * @returns 变更检测结果和生成的OutlineItem数组
   */
  smartRebuildCache(
    messageListResult: HTMLCollection | Element[] | NodeListOf<Element>,
    parserConfig: ParserConfig,
    features: { showUserMessages: boolean; showAIMessages: boolean; textLength: number }
  ): { changes: CacheChanges; outlineItems: OutlineItem[] } {
    const newCache: CachedMessage[] = [];
    const outlineItems: OutlineItem[] = [];
    const changedIndices: number[] = [];
    let messageIndex = 0;

    // 转换为数组以便遍历
    const messageElements = Array.from(messageListResult);

    // 快速路径：如果消息数量和缓存数量相同，且最后一条没变化，可能不需要全量更新
    const lastCheck = this.checkLastMessage(messageElements);
    if (!lastCheck.shouldRefreshAll && !lastCheck.lastMessageNeedsUpdate) {
      console.log('Smart Cache: 没有检测到任何变化');
      return {
        changes: { hasChanges: false, changedIndices: [], addedCount: 0, removedCount: 0 },
        outlineItems: this.cache.map(c => c.outlineItem)
      };
    }

    // 遍历所有消息进行精确检测
    for (let i = 0; i < messageElements.length; i++) {
      const messageElement = messageElements[i];
      const messageType = parserConfig.determineMessageOwner(messageElement);

      // 检查是否应该显示此消息
      const shouldShow =
        (messageType === MessageOwner.User && features.showUserMessages) ||
        (messageType === MessageOwner.Assistant && features.showAIMessages);

      if (!shouldShow) {
        continue;
      }

      // 尝试从旧缓存中查找
      let cacheItem: CachedMessage | null = null;
      let isChanged = false;

      // 先在相同位置检查
      if (messageIndex < this.cache.length) {
        const oldCached = this.cache[messageIndex];
        const validation = this.validateCacheItem(oldCached, messageElement, i);

        if (validation.isValid && !validation.needsUpdate) {
          // 完全匹配，复用
          cacheItem = oldCached;
        } else if (validation.isValid && validation.needsUpdate) {
          // ID匹配但内容变化，需要更新
          cacheItem = this.createCacheItem(
            messageElement,
            messageIndex,
            messageType,
            features.textLength,
            oldCached.outlineElement
          );
          isChanged = true;
          changedIndices.push(messageIndex);
          console.log(`Smart Cache: 索引 ${messageIndex} 内容已更新`);
        }
      }

      // 如果没找到，在所有旧缓存中搜索（可能是位置变化）
      if (!cacheItem) {
        for (const oldCached of this.cache) {
          const validation = this.validateCacheItem(oldCached, messageElement, i);
          if (validation.isValid && !validation.needsUpdate) {
            cacheItem = oldCached;
            break;
          }
        }
      }

      // 还是没找到，创建新的
      if (!cacheItem) {
        cacheItem = this.createCacheItem(
          messageElement,
          messageIndex,
          messageType,
          features.textLength,
          null as unknown as Element
        );
        isChanged = true;
        changedIndices.push(messageIndex);
        console.log(`Smart Cache: 索引 ${messageIndex} 新建缓存`);
      }

      if (cacheItem) {
        // 确保索引和ID正确
        if (cacheItem.outlineItem.index !== messageIndex) {
          cacheItem.outlineItem.index = messageIndex;
          cacheItem.outlineItem.id = `outline-${messageIndex}-${Date.now()}`;
          isChanged = true;
        }

        newCache.push(cacheItem);
        outlineItems.push(cacheItem.outlineItem);
        messageIndex++;
      }
    }

    // 计算变更统计
    const addedCount = Math.max(0, newCache.length - this.cache.length);
    const removedCount = Math.max(0, this.cache.length - newCache.length);

    // 更新缓存
    this.cache = newCache;

    const changes: CacheChanges = {
      hasChanges: changedIndices.length > 0 || addedCount > 0 || removedCount > 0,
      changedIndices,
      addedCount,
      removedCount
    };

    console.log('Smart Cache 重建完成:', changes);
    return { changes, outlineItems };
  }

  /**
   * 根据消息索引获取对应的大纲元素
   * @param messageIndex 消息索引
   * @returns 大纲DOM元素或undefined
   */
  getOutlineElementByIndex(messageIndex: number): Element | undefined {
    return this.cache[messageIndex]?.outlineElement;
  }

  /**
   * 滚动大纲到指定消息位置
   * @param messageIndex 消息索引
   */
  scrollOutlineToMessage(messageIndex: number): void {
    const outlineElement = this.getOutlineElementByIndex(messageIndex);
    if (outlineElement) {
      outlineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * 全局缓存管理器实例
 */
export const messageCacheManager = new MessageCacheManager();
