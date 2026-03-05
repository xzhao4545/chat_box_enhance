/**
 * 大纲数据状态管理
 */

import { writable } from 'svelte/store';
import type { OutlineItem, HeaderTreeNode } from '../types';
import { MessageOwner } from '../types';
import { generateUniqueId } from './messageCache';

/**
 * 大纲项Store
 */
export const outlineStore = writable<OutlineItem[]>([]);

/**
 * 解析标题层级树
 */
export function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  const tree: HeaderTreeNode[] = [];
  const stack: HeaderTreeNode[] = [];

  headers.forEach(header => {
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
 * 创建大纲项
 */
export function createOutlineItem(
  messageElement: Element,
  index: number,
  type: MessageOwner,
  textLength: number
): OutlineItem | null {
  const text = (messageElement.textContent || '').substring(0, textLength) +
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
    const headerTree = headers.length > 0 ? buildHeaderTree(Array.from(headers)) : undefined;

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