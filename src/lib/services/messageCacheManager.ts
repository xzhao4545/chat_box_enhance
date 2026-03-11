/**
 * 消息缓存管理器
 * 负责管理 CachedMessage 数组及其索引
 */

import type { CachedMessage, OutlineItem, ParserConfig } from '../types';
import { MessageOwner } from '../types';
import { generateUniqueId } from '../stores/messageCache';
import { buildMessageHash, createOutlineViewItem } from '../utils/outlineBuilder';
import { logger } from './logger';

export interface CacheChanges {
  hasChanges: boolean;
  changedIndices: number[];
  addedCount: number;
  removedCount: number;
}

interface CacheRebuildOptions {
  features: { showUserMessages: boolean; showAIMessages: boolean; textLength: number };
}

export class MessageCacheManager {
  private cache: CachedMessage[] = [];
  private cacheByMessageId = new Map<string, CachedMessage>();
  private cacheByOutlineId = new Map<string, CachedMessage>();

  getCache(): CachedMessage[] {
    return this.cache;
  }

  setCache(cache: CachedMessage[]): void {
    this.cache = cache;
    this.rebuildIndexes();
  }

  clearCache(): void {
    this.cache = [];
    this.cacheByMessageId.clear();
    this.cacheByOutlineId.clear();
  }

  get length(): number {
    return this.cache.length;
  }

  get(index: number): CachedMessage | undefined {
    return this.cache[index];
  }

  ensureMessageId(messageElement: Element): string {
    let messageId = messageElement.getAttribute('cbe-message-id');
    if (!messageId) {
      messageId = generateUniqueId();
      messageElement.setAttribute('cbe-message-id', messageId);
    }

    return messageId;
  }

  checkLastMessage(messageElements: Element[]): {
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
    const messageId = this.ensureMessageId(lastMessage);

    if (messageId !== lastCached.messageId) {
      return { shouldRefreshAll: true, lastMessageNeedsUpdate: true, lastIndex };
    }

    const currentHash = buildMessageHash(lastIndex, lastMessage.textContent || '');
    return {
      shouldRefreshAll: false,
      lastMessageNeedsUpdate: currentHash !== lastCached.messageHash,
      lastIndex
    };
  }

  updateLastCache(
    messageElement: Element,
    index: number,
    outlineItem: OutlineItem,
    outlineElement: Element | null,
  ): void {
    const messageId = this.ensureMessageId(messageElement);
    const newCacheItem: CachedMessage = {
      messageId,
      messageHash: buildMessageHash(index, messageElement.textContent || ''),
      textLength: messageElement.textContent?.length || 0,
      outlineElement,
      outlineItem,
      timestamp: Date.now()
    };

    this.cache[this.cache.length - 1] = newCacheItem;
    this.cacheByMessageId.set(messageId, newCacheItem);
    this.cacheByOutlineId.set(outlineItem.id, newCacheItem);
  }

  rebuildCache(
    messageElements: Element[],
    parserConfig: ParserConfig,
    options: CacheRebuildOptions,
  ): { changes: CacheChanges; outlineItems: OutlineItem[] } {
    const nextCache: CachedMessage[] = [];
    const outlineItems: OutlineItem[] = [];
    const changedIndices: number[] = [];

    let displayIndex = 0;

    for (let rawIndex = 0; rawIndex < messageElements.length; rawIndex++) {
      const messageElement = messageElements[rawIndex];
      const messageType = parserConfig.determineMessageOwner(messageElement);
      const shouldShow =
        (messageType === MessageOwner.User && options.features.showUserMessages) ||
        (messageType === MessageOwner.Assistant && options.features.showAIMessages);

      if (!shouldShow) {
        continue;
      }

      const messageId = this.ensureMessageId(messageElement);
      const messageHash = buildMessageHash(rawIndex, messageElement.textContent || '');
      const oldCached = this.cacheByMessageId.get(messageId);

      let nextCached: CachedMessage;

      if (oldCached && oldCached.messageHash === messageHash) {
        nextCached = oldCached;
        if (nextCached.outlineItem.index !== displayIndex) {
          nextCached.outlineItem.index = displayIndex;
          changedIndices.push(displayIndex);
        }
        nextCached.outlineItem.element = messageElement;
      } else {
        const stableOutlineId = oldCached?.outlineItem.id || generateUniqueId();
        const outlineItem = createOutlineViewItem({
          id: stableOutlineId,
          index: displayIndex,
          type: messageType,
          element: messageElement,
          textLength: options.features.textLength
        });

        nextCached = {
          messageId,
          messageHash,
          textLength: messageElement.textContent?.length || 0,
          outlineElement: oldCached?.outlineElement || null,
          outlineItem,
          timestamp: Date.now()
        };
        changedIndices.push(displayIndex);
      }

      nextCache.push(nextCached);
      outlineItems.push(nextCached.outlineItem);
      displayIndex += 1;
    }

    const addedCount = Math.max(0, nextCache.length - this.cache.length);
    const removedCount = Math.max(0, this.cache.length - nextCache.length);
    const hasChanges =
      changedIndices.length > 0 ||
      addedCount > 0 ||
      removedCount > 0 ||
      nextCache.length !== this.cache.length;

    this.cache = nextCache;
    this.rebuildIndexes();

    const changes: CacheChanges = {
      hasChanges,
      changedIndices: [...new Set(changedIndices)],
      addedCount,
      removedCount
    };

    logger.debug('Cache 重建完成:', changes);
    return { changes, outlineItems };
  }

  updateOutlineElement(outlineItemId: string, outlineElement: Element): void {
    const cachedItem = this.cacheByOutlineId.get(outlineItemId);
    if (!cachedItem || cachedItem.outlineElement === outlineElement) {
      return;
    }

    cachedItem.outlineElement = outlineElement;
  }

  getOutlineElementByIndex(messageIndex: number): Element | undefined {
    return this.cache[messageIndex]?.outlineElement;
  }

  getCacheIndexByMessageId(messageId: string | null): number {
    if (!messageId) {
      return -1;
    }

    for (let index = 0; index < this.cache.length; index++) {
      if (this.cache[index].messageId === messageId) {
        return index;
      }
    }

    return -1;
  }

  scrollOutlineToMessage(messageIndex: number): void {
    const outlineElement = this.getOutlineElementByIndex(messageIndex);
    outlineElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private rebuildIndexes(): void {
    this.cacheByMessageId.clear();
    this.cacheByOutlineId.clear();

    for (const item of this.cache) {
      this.cacheByMessageId.set(item.messageId, item);
      this.cacheByOutlineId.set(item.outlineItem.id, item);
    }
  }
}

export const messageCacheManager = new MessageCacheManager();
