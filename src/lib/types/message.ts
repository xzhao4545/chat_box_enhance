/**
 * 消息相关类型定义
 */

/**
 * 消息所有者类型
 */
export enum MessageOwner {
  User = 'user',
  Assistant = 'assistant',
  Other = 'other'
}

/**
 * 标题节点树结构
 */
export interface HeaderTreeNode {
  element: Element;
  level: number;
  text: string;
  children: HeaderTreeNode[];
}

/**
 * 缓存的消息信息
 */
export interface CachedMessage {
  messageId: string;
  messageHash: string;
  textLength: number;
  outlineElement: Element;
  outlineItem: OutlineItem;
  timestamp: number;
}

/**
 * 大纲项数据（用于Svelte组件渲染）
 */
export interface OutlineItem {
  id: string;
  index: number;
  type: MessageOwner;
  text: string;
  element: Element;
  headers?: HeaderTreeNode[];
  isExpanded?: boolean;
}