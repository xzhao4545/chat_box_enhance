/**
 * 消息缓存状态管理
 */

import { writable } from "svelte/store";
import type { CachedMessage, OutlineItem, HeaderTreeNode } from "../types";
import { MessageOwner } from "../types";
import {
  buildHeaderTree as createHeaderTree,
  buildMessageHash,
  buildOutlineData
} from '../utils/outlineBuilder';

/**
 * 消息缓存Store
 */
export const messageCacheStore = writable<CachedMessage[]>([]);

/**
 * 最后消息数量Store
 */
export const lastMessageCountStore = writable<number>(0);

/**
 * 生成消息Hash
 */
export function generateMessageHash(
  index: number,
  messageElement: Element,
): string {
  return buildMessageHash(index, messageElement.textContent || '');
}

/**
 * 生成id
 */
let idCounter = 0;
export function generateUniqueId(): string {
  return `${Date.now()}-${++idCounter}`;
}
/**
 * 解析标题层级树
 */
export function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  return createHeaderTree(headers);
}

/**
 * 创建大纲项
 */
export function createOutlineItem(
  messageElement: Element,
  index: number,
  type: MessageOwner,
  textLength: number,
): OutlineItem | null {
  const built = buildOutlineData(messageElement, type, textLength);
  ++index;
  const id = generateUniqueId();

  if (type === MessageOwner.User) {
    return {
      id,
      index,
      type: MessageOwner.User,
      text: built.text,
      searchText: built.searchText,
      element: messageElement,
      isExpanded: true,
    };
  }

  if (type === MessageOwner.Assistant) {
    return {
      id,
      index,
      type: MessageOwner.Assistant,
      text: built.text,
      searchText: built.searchText,
      element: messageElement,
      headers: built.headers,
      isExpanded: true,
    };
  }

  return null;
}
