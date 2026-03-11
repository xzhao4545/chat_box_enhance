/**
 * 消息采集服务
 * 负责定位 chatArea、提取消息元素并补齐稳定消息 ID
 */

import type { ParserConfig } from '../types';
import { logger } from './logger';
import { messageCacheManager } from './messageCacheManager';

export interface MessageCollectionResult {
  chatArea: Element | null;
  messageElements: Element[];
}

class MessageSourceService {
  private cachedChatArea: Element | null = null;

  public getCachedChatArea(parserConfig: ParserConfig | null, forceRefresh = false): Element | null {
    if (forceRefresh || !this.cachedChatArea) {
      this.cachedChatArea = parserConfig?.selectChatArea() || null;
      logger.debug('get chatArea:', this.cachedChatArea);
    }

    return this.cachedChatArea;
  }

  public clearChatAreaCache(): void {
    this.cachedChatArea = null;
  }

  public collect(parserConfig: ParserConfig): MessageCollectionResult {
    const chatArea = this.getCachedChatArea(parserConfig);
    if (!chatArea) {
      return {
        chatArea: null,
        messageElements: []
      };
    }

    const messageListResult = parserConfig.getMessageList(chatArea);
    if (messageListResult == null) {
      return {
        chatArea,
        messageElements: []
      };
    }

    const messageElements = Array.from(messageListResult);
    for (const messageElement of messageElements) {
      messageCacheManager.ensureMessageId(messageElement);
    }

    return {
      chatArea,
      messageElements,
    };
  }
}

export const messageSourceService = new MessageSourceService();
