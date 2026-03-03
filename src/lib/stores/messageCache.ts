/**
 * 消息缓存状态管理
 */

import { writable } from "svelte/store";
import type { CachedMessage, OutlineItem, HeaderTreeNode } from "../types";
import { MessageOwner } from "../types";

/**
 * 消息缓存Store
 */
export const messageCacheStore = writable<CachedMessage[]>([]);

/**
 * 最后消息数量Store
 */
export const lastMessageCountStore = writable<number>(0);

/**
 * 生成消息ID
 */
export function generateMessageHash(
  index: number,
  messageElement: Element,
): string {
  const text = messageElement.textContent || "";
  const idLength = 10;

  if (text.length <= idLength * 2) {
    return index + text;
  }
  const res=[];
  const step=Math.ceil((text.length - idLength)/idLength);
  for (let i = 0; i < idLength; i+=step) {
    res.push(text[i])
  }
  return (
    index + res.join('') + text.substring(text.length - idLength)
  );
}

/**
 * 解析标题层级树
 */
export function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  const tree: HeaderTreeNode[] = [];
  const stack: HeaderTreeNode[] = [];

  headers.forEach((header) => {
    const tagName = header.tagName;
    const level = parseInt(tagName.charAt(1)); // h1->1, h2->2, etc.

    const node: HeaderTreeNode = {
      element: header,
      level: level,
      text: header.textContent || "",
      children: [],
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
  textLength: number,
): OutlineItem | null {
  const text =
    (messageElement.textContent || "").substring(0, textLength) +
    ((messageElement.textContent || "").length > textLength ? "..." : "");
  ++index;
  const id = `outline-${index}-${Date.now()}`;

  if (type === MessageOwner.User) {
    return {
      id,
      index,
      type: MessageOwner.User,
      text,
      element: messageElement,
      isExpanded: true,
    };
  }

  if (type === MessageOwner.Assistant) {
    const headers = messageElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const headerTree =
      headers.length > 0 ? buildHeaderTree(Array.from(headers)) : undefined;

    return {
      id,
      index,
      type: MessageOwner.Assistant,
      text,
      element: messageElement,
      headers: headerTree,
      isExpanded: true,
    };
  }

  return null;
}
