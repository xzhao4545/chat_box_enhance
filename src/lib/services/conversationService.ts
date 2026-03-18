/**
 * 会话服务
 * 封装对 ParserConfig 中会话相关方法的调用
 */

import { get } from 'svelte/store';
import { parserConfigStore, platformStore } from '../stores';
import type { Platform } from '../types';

const DEFAULT_CONVERSATION_ID = 'default';

/**
 * 获取当前平台
 */
export function getCurrentPlatform(): Platform {
  return get(platformStore);
}

/**
 * 获取当前会话ID
 */
export function getConversationId(): string {
  const config = get(parserConfigStore);
  if (config?.getConversationId) {
    const id = config.getConversationId();
    return id ?? DEFAULT_CONVERSATION_ID;
  }
  return DEFAULT_CONVERSATION_ID;
}

/**
 * 获取当前会话名称
 */
export function getConversationName(): string {
  const config = get(parserConfigStore);
  if (config?.getConversationName) {
    const name = config.getConversationName();
    return name ?? getConversationId();
  }
  return getConversationId();
}

/**
 * 构建会话URL
 */
export function buildConversationUrl(conversationId: string, platform?: Platform): string | null {
  const config = get(parserConfigStore);
  if (config?.buildConversationUrl) {
    return config.buildConversationUrl(conversationId);
  }
  return null;
}

/**
 * 检查当前是否在目标会话中
 */
export function isInConversation(targetConversationId: string): boolean {
  return getConversationId() === targetConversationId;
}

/**
 * 获取当前页面完整URL（用于书签跳转）
 */
export function getCurrentPageUrl(): string {
  return window.location.href;
}