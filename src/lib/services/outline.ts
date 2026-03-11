/**
 * 大纲生成服务
 * 负责解析消息并生成大纲数据
 */

import { get } from 'svelte/store';
import { MessageOwner, type OutlineItem, type ParserConfig, type HeaderTreeNode } from '../types';
import { featuresStore, generateUniqueId, outlineStore } from '../stores';
import { messageCacheManager } from './messageCacheManager';
import { scrollSyncService } from './scrollSyncService';
import { logger } from './logger';

// 缓存的chatArea
let cachedChatArea: Element | null = null;

/**
 * 获取缓存的聊天区域
 */
function getCachedChatArea(
  parserConfig: ParserConfig | null,
  forceRefresh = false
): Element | null {
  if (forceRefresh || !cachedChatArea) {
    cachedChatArea = parserConfig?.selectChatArea() || null;
    logger.debug('get chatArea:', cachedChatArea);
  }
  return cachedChatArea;
}

/**
 * 刷新大纲项
 * @param parserConfig 解析器配置
 */
function refreshOutlineItems(parserConfig: ParserConfig): void {
  const chatArea = getCachedChatArea(parserConfig);
  if (!chatArea) {
    logger.warn('无法定位到对话区域');
    return;
  }

  const messageListResult = parserConfig.getMessageList(chatArea);
  if (messageListResult == null) {
    logger.warn('对话区域无效，大纲生成失败, chatArea:', chatArea);
    return;
  }

  // 将消息列表转换为数组
  const messageElements = Array.from(messageListResult);
  const currentMessageCount = messageElements.length;
  const features = get(featuresStore);

  logger.debug('刷新大纲, 消息数量:', currentMessageCount, '缓存数量:', messageCacheManager.length);

  // 如果没有消息，清空缓存和store
  if (currentMessageCount === 0) {
    messageCacheManager.clearCache();
    outlineStore.set([]);
    scrollSyncService.schedulePostRefreshCheck();
    return;
  }

  // 检查最后一条消息
  const lastCheck = messageCacheManager.checkLastMessage(messageElements);

  // 如果不需要刷新全部且最后一条也不需要更新，直接返回
  if (!lastCheck.shouldRefreshAll && !lastCheck.lastMessageNeedsUpdate) {
    logger.debug('没有变化，跳过更新');
    return;
  }

  // 如果只需要更新最后一条
  if (!lastCheck.shouldRefreshAll && lastCheck.lastMessageNeedsUpdate) {
    logger.debug('只更新最后一条消息');
    const lastMessage = messageElements[lastCheck.lastIndex];
    const lastMessageType = parserConfig.determineMessageOwner(lastMessage);

    // 检查是否应该显示此消息
    const shouldShow =
      (lastMessageType === MessageOwner.User && features.showUserMessages) ||
      (lastMessageType === MessageOwner.Assistant && features.showAIMessages);

    if (shouldShow) {
      // 获取当前缓存中的大纲元素（如果存在）
      const lastCached = messageCacheManager.get(messageCacheManager.length - 1);
      const existingOutlineElement = lastCached?.outlineElement;

      // 创建新的大纲项
      const newOutlineItem = createOutlineItemForCache(
        lastMessage,
        messageCacheManager.length - 1,
        lastMessageType,
        features.textLength
      );

      if (newOutlineItem) {
        // 更新缓存
        messageCacheManager.updateLastCache(
          lastMessage,
          messageCacheManager.length - 1,
          newOutlineItem,
          existingOutlineElement || null as unknown as Element
        );

        // 更新store以触发重新渲染
        const allItems = messageCacheManager.getCache().map(c => c.outlineItem);
        outlineStore.set(allItems);
        logger.debug('已更新最后一条消息到大纲');
        scrollSyncService.schedulePostRefreshCheck();
      }
    }
    return;
  }

  // 需要刷新全部，使用智能重建缓存
  logger.debug('重建全部缓存');
  const result = messageCacheManager.smartRebuildCache(
    messageElements,
    parserConfig,
    features
  );

  // 只有在有变更时才更新store
  if (result.changes.hasChanges) {
    outlineStore.set(result.outlineItems);
    logger.info('大纲刷新完成，共', result.outlineItems.length, '项，变更:', result.changes);
    scrollSyncService.schedulePostRefreshCheck();
  } else {
    logger.debug('缓存完全命中，跳过store更新');
    scrollSyncService.schedulePostRefreshCheck();
  }
}

/**
 * 为大纲缓存创建大纲项（不保存element引用到store）
 * 注意：这里创建的OutlineItem会被保存到CachedMessage中
 */
function createOutlineItemForCache(
  messageElement: Element,
  index: number,
  type: MessageOwner,
  textLength: number
): OutlineItem | null {
  const text =
    (messageElement.textContent || '').substring(0, textLength) +
    ((messageElement.textContent || '').length > textLength ? '...' : '');

  const id = generateUniqueId();

  if (type === MessageOwner.User) {
    return {
      id,
      index,
      type: MessageOwner.User,
      text,
      element: messageElement,
      isExpanded: true
    };
  }

  if (type === MessageOwner.Assistant) {
    const headers = messageElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headerTree =
      headers.length > 0 ? buildHeaderTree(Array.from(headers)) : undefined;

    return {
      id,
      index,
      type: MessageOwner.Assistant,
      text,
      element: messageElement,
      headers: headerTree,
      isExpanded: true
    };
  }

  return null;
}

/**
 * 解析标题层级树
 */
function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  const tree: HeaderTreeNode[] = [];
  const stack: HeaderTreeNode[] = [];

  headers.forEach((header) => {
    const tagName = header.tagName;
    const level = parseInt(tagName.charAt(1)); // h1->1, h2->2, etc.

    const node: HeaderTreeNode = {
      element: header,
      level: level,
      text: header.textContent || '',
      children: []
    };

    // 找到合适的父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return tree;
}

/**
 * 强制刷新大纲
 */
function forceRefresh(parserConfig: ParserConfig): void {
  logger.info('执行强制刷新...');

  // 清理所有缓存
  messageCacheManager.clearCache();
  cachedChatArea = null;

  // 强制重新获取chatArea
  const newChatArea = getCachedChatArea(parserConfig, true);
  if (newChatArea) {
    refreshOutlineItems(parserConfig);
    
    // 重新绑定滚动监听
    scrollSyncService.rebind(newChatArea, parserConfig);
    
    logger.info('强制刷新完成');
  } else {
    logger.error('强制刷新失败：无法获取到chatArea');
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
