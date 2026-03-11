/**
 * 大纲数据状态管理
 */

import { writable } from 'svelte/store';
import type { OutlineItem, HeaderTreeNode } from '../types';
import { MessageOwner } from '../types';
import { generateUniqueId } from './messageCache';
import {
  buildHeaderTree as createHeaderTree,
  buildOutlineData
} from '../utils/outlineBuilder';

/**
 * 大纲项Store
 */
export const outlineStore = writable<OutlineItem[]>([]);

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
  textLength: number
): OutlineItem | null {
  const built = buildOutlineData(messageElement, type, textLength);

  const id = generateUniqueId();

  if (type === MessageOwner.User) {
    return {
      id,
      index,
      type: MessageOwner.User,
      text: built.text,
      searchText: built.searchText,
      element: messageElement,
      isExpanded: true
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
      isExpanded: true
    };
  }

  return null;
}

/**
 * 刷新大纲
 */
export function refreshOutline(items: OutlineItem[]): void {
  outlineStore.set(items);
}

/**
 * 清空大纲
 */
export function clearOutline(): void {
  outlineStore.set([]);
}
