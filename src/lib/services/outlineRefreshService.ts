/**
 * 大纲刷新服务
 * 负责采集消息、重建缓存并更新大纲 store
 */

import { get } from 'svelte/store';
import { MessageOwner, type ParserConfig } from '../types';
import { featuresStore, outlineStore } from '../stores';
import { generateUniqueId } from '../stores/messageCache';
import { createOutlineViewItem } from '../utils/outlineBuilder';
import { logger } from './logger';
import { messageCacheManager } from './messageCacheManager';
import { scrollSyncService } from './scrollSyncService';

class OutlineRefreshService {
  private cachedChatArea: Element | null = null;

  public getCachedChatArea(parserConfig: ParserConfig | null, forceRefresh = false): Element | null {
    if (forceRefresh || !this.cachedChatArea) {
      this.cachedChatArea = parserConfig?.selectChatArea() || null;
      logger.debug('get chatArea:', this.cachedChatArea);
    }

    return this.cachedChatArea;
  }

  public refresh(parserConfig: ParserConfig): void {
    const chatArea = this.getCachedChatArea(parserConfig);
    if (!chatArea) {
      logger.warn('无法定位到对话区域');
      return;
    }

    const messageListResult = parserConfig.getMessageList(chatArea);
    if (messageListResult == null) {
      logger.warn('对话区域无效，大纲生成失败, chatArea:', chatArea);
      return;
    }

    const messageElements = Array.from(messageListResult);
    const features = get(featuresStore);

    logger.debug('刷新大纲, 消息数量:', messageElements.length, '缓存数量:', messageCacheManager.length);

    if (messageElements.length === 0) {
      messageCacheManager.clearCache();
      outlineStore.set([]);
      scrollSyncService.schedulePostRefreshCheck();
      return;
    }

    const lastCheck = messageCacheManager.checkLastMessage(messageElements);
    if (!lastCheck.shouldRefreshAll && !lastCheck.lastMessageNeedsUpdate) {
      logger.debug('没有变化，跳过更新');
      return;
    }

    if (!lastCheck.shouldRefreshAll && lastCheck.lastMessageNeedsUpdate) {
      this.refreshLastMessage(messageElements, lastCheck.lastIndex, parserConfig);
      return;
    }

    const result = messageCacheManager.rebuildCache(messageElements, parserConfig, {
      features: {
        showUserMessages: features.showUserMessages,
        showAIMessages: features.showAIMessages,
        textLength: features.textLength
      }
    });

    if (result.changes.hasChanges) {
      outlineStore.set(result.outlineItems);
      logger.info('大纲刷新完成，共', result.outlineItems.length, '项，变更:', result.changes);
    } else {
      logger.debug('缓存完全命中，跳过store更新');
    }

    scrollSyncService.schedulePostRefreshCheck();
  }

  public forceRefresh(parserConfig: ParserConfig): void {
    logger.info('执行强制刷新...');
    messageCacheManager.clearCache();
    this.cachedChatArea = null;

    const newChatArea = this.getCachedChatArea(parserConfig, true);
    if (!newChatArea) {
      logger.error('强制刷新失败：无法获取到chatArea');
      return;
    }

    this.refresh(parserConfig);
    scrollSyncService.rebind(newChatArea, parserConfig);
    logger.info('强制刷新完成');
  }

  private refreshLastMessage(
    messageElements: Element[],
    lastIndex: number,
    parserConfig: ParserConfig,
  ): void {
    const features = get(featuresStore);
    const lastMessage = messageElements[lastIndex];
    const lastMessageType = parserConfig.determineMessageOwner(lastMessage);
    const shouldShow =
      (lastMessageType === MessageOwner.User && features.showUserMessages) ||
      (lastMessageType === MessageOwner.Assistant && features.showAIMessages);

    if (!shouldShow) {
      return;
    }

    const lastCached = messageCacheManager.get(messageCacheManager.length - 1);
    const newOutlineItem = createOutlineViewItem({
      id: lastCached?.outlineItem.id || generateUniqueId(),
      index: messageCacheManager.length - 1,
      type: lastMessageType,
      element: lastMessage,
      textLength: features.textLength
    });

    messageCacheManager.updateLastCache(
      lastMessage,
      messageElements.length - 1,
      newOutlineItem,
      lastCached?.outlineElement || null,
    );

    outlineStore.set(messageCacheManager.getCache().map((item) => item.outlineItem));
    scrollSyncService.schedulePostRefreshCheck();
  }
}

export const outlineRefreshService = new OutlineRefreshService();
