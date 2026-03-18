/**
 * 书签相关类型定义
 */

import type { Platform } from './index';

/**
 * 书签接口
 */
export interface Bookmark {
  /** 书签唯一ID */
  id: string;
  /** 书签名称（用于展示和搜索） */
  name: string;
  /** 会话ID */
  conversationId: string;
  /** 平台标识 */
  platform: Platform;
  /** 大纲元素类型 */
  outlineItemType: 'message' | 'header';
  /** 消息索引（用于定位消息位置） */
  messageIndex: number;
  /** 消息内容指纹 (用于检测内容变更) */
  messageHash: string;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 待跳转书签信息 (sessionStorage 存储)
 */
export interface PendingNavigation {
  /** 待跳转的书签ID */
  bookmarkId: string;
  /** 跳转发起时间 */
  timestamp: number;
}

/**
 * 书签数据存储结构 (localStorage 存储)
 * 按 conversationId 分组存储
 */
export interface BookmarksData {
  [conversationId: string]: Bookmark[];
}

/**
 * 书签导出格式（预留导入/导出功能）
 */
export interface BookmarksExport {
  /** 导出版本号 */
  version: string;
  /** 导出时间戳 */
  exportedAt: number;
  /** 来源平台 */
  platform: Platform;
  /** 书签数据 */
  bookmarks: BookmarksData;
}

/**
 * 右键菜单上下文
 */
export interface ContextMenuContext {
  /** 大纲元素类型 */
  outlineItemType: 'message' | 'header';
  /** 关联的消息索引 */
  messageIndex: number;
  /** 消息内容（用于生成默认书签名称） */
  messageText: string;
  /** 消息hash */
  messageHash: string;
  /** DOM元素位置（用于定位菜单） */
  element: Element;
}