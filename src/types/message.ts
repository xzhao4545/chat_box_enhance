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
  textLength: number;
  outlineElement: Element;
  originalElement: Element;
  timestamp: number;
}

/**
 * 树节点属性
 */
export interface TreeNodeProps {
  depth: number;
  level: number;
  text: string;
  element: Element;
  children: TreeNodeProps[];
}