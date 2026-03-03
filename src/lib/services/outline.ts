/**
 * 大纲生成服务
 * 负责解析消息并生成大纲数据
 */

import { get } from 'svelte/store';
import { MessageOwner, type OutlineItem, type ParserConfig } from '../types';
import { featuresStore, messageCacheStore, lastMessageCountStore, outlineStore } from '../stores';
import { createOutlineItem, generateMessageId, isMessageCached, cacheMessage, clearCache } from '../stores/messageCache';

// 缓存的chatArea
let cachedChatArea: Element | null = null;

/**
 * 获取缓存的聊天区域
 */
export function getCachedChatArea(
  parserConfig: ParserConfig | null,
  forceRefresh = false
): Element | null {
  if (forceRefresh || !cachedChatArea) {
    cachedChatArea = parserConfig?.selectChatArea() || null;
    console.log('get chatArea:', cachedChatArea);
  }
  return cachedChatArea;
}

/**
 * 刷新大纲项
 * @param parserConfig 解析器配置
 */
export function refreshOutlineItems(parserConfig: ParserConfig): void {
  const chatArea = getCachedChatArea(parserConfig);
  if (!chatArea) {
    console.log('无法定位到对话区域');
    return;
  }

  const cd = parserConfig.getMessageList(chatArea);
  if (cd == null) {
    console.log('对话区域无效，大纲生成失败, chatArea:', chatArea);
    return;
  }

  const currentMessageCount = cd.length;
  const lastMessageCount = get(lastMessageCountStore);
  const cache = get(messageCacheStore);
  const features = get(featuresStore);

  // 如果消息数量没有变化，检查是否需要更新
  if (currentMessageCount === lastMessageCount && currentMessageCount > 0) {
    // 检查最后一条消息是否还在变化（可能是AI正在回复）
    const lastMessage = cd[cd.length - 1];
    const lastMessageId = generateMessageId(cd.length - 1, lastMessage);

    if (isMessageCached(cache.length - 1, lastMessage, lastMessageId)) {
      return; // 没有变化，跳过更新
    }
  }

  console.log('刷新大纲, chatArea:', chatArea);

  const newItems: OutlineItem[] = [];
  let messageIndex = 0;

  // 遍历对话生成大纲
  for (let i = 0; i < cd.length; i++) {
    const c = cd[i];
    const messageId = generateMessageId(i, c);

    // 检查是否可以使用缓存
    if (messageIndex < cache.length) {
      if (isMessageCached(messageIndex, c, messageId)) {
        // 使用缓存的数据创建大纲项
        const cached = cache[messageIndex];
        const item = createOutlineItemFromCache(c, messageIndex, features.textLength);
        if (item) {
          newItems.push(item);
        }
        messageIndex++;
        continue;
      }
    }

    const messageType = parserConfig.determineMessageOwner(c);

    if (messageType === MessageOwner.User && features.showUserMessages) {
      const item = createOutlineItem(c, messageIndex, messageType, features.textLength);
      if (item) {
        newItems.push(item);
        cacheMessage(c, item.id, item.element as Element);
      }
      messageIndex++;
    } else if (messageType === MessageOwner.Assistant && features.showAIMessages) {
      const item = createOutlineItem(c, messageIndex, messageType, features.textLength);
      if (item) {
        newItems.push(item);
        cacheMessage(c, item.id, item.element as Element);
      }
      messageIndex++;
    }
  }

  // 更新store
  outlineStore.set(newItems);
  lastMessageCountStore.set(currentMessageCount);
}

/**
 * 从缓存创建大纲项
 */
function createOutlineItemFromCache(
  cachedElement: Element,
  index: number,
  textLength: number
): OutlineItem | null {
  const text = (cachedElement.textContent || '').substring(0, textLength) +
    ((cachedElement.textContent || '').length > textLength ? '...' : '');

  return {
    id: `outline-${index}-${Date.now()}`,
    index,
    type: 'user', // 从缓存无法判断类型，需要重新判断
    text,
    element: cachedElement,
    isExpanded: true
  };
}

/**
 * 强制刷新大纲
 */
export function forceRefresh(parserConfig: ParserConfig): void {
  console.log('执行强制刷新...');

  // 清理所有缓存
  clearCache();
  cachedChatArea = null;

  // 强制重新获取chatArea
  const newChatArea = getCachedChatArea(parserConfig, true);
  if (newChatArea) {
    refreshOutlineItems(parserConfig);
    console.log('强制刷新完成');
  } else {
    console.error('强制刷新失败：无法获取到chatArea');
  }
}

/**
 * 大纲服务对象
 */
export const outlineService = {
  refresh: refreshOutlineItems,
  forceRefresh,
  getCachedChatArea
};