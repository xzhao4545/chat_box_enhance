/**
 * 书签相关类型定义
 */

/**
 * 书签接口（不包含会话相关字段，这些字段在会话级别存储）
 */
export interface Bookmark {
  /** 书签唯一ID */
  id: string;
  /** 书签名称（用于展示和搜索） */
  name: string;
  /** 大纲元素类型 */
  outlineItemType: 'message' | 'header';
  /** 消息索引（用于定位消息位置） */
  messageIndex: number;
  /** 消息内容指纹 (基于整个消息内容计算，用于检测内容变更) */
  messageHash: string;
  /** 标题路径（仅当 outlineItemType 为 'header' 时有效，格式如 "0.1.2" 表示层级路径） */
  headerPath?: string;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 会话书签数据
 */
export interface ConversationBookmarks {
  /** 会话名称（首次创建时获取，若未实现则为 null） */
  name: string | null;
  /** 该会话下的书签列表 */
  bookmarks: Bookmark[];
}

/**
 * 待跳转书签信息 (sessionStorage 存储)
 */
export interface PendingNavigation {
  /** 待跳转的书签ID */
  bookmarkId: string;
  /** 会话ID */
  conversationId: string;
  /** 跳转发起时间 */
  timestamp: number;
}

/**
 * 书签数据存储结构 (localStorage 存储)
 * 按 conversationId 分组存储
 */
export interface BookmarksData {
  [conversationId: string]: ConversationBookmarks;
}

/**
 * 书签导出格式（预留导入/导出功能）
 */
export interface BookmarksExport {
  /** 导出版本号 */
  version: string;
  /** 导出时间戳 */
  exportedAt: number;
  /** 书签数据 */
  data: BookmarksData;
}

/**
 * 右键菜单上下文
 */
export interface ContextMenuContext {
  /** 大纲元素类型 */
  outlineItemType: 'message' | 'header';
  /** 关联的消息索引 */
  messageIndex: number;
  /** 消息内容（用于生成默认书签名称，取自整个消息） */
  messageText: string;
  /** 消息hash（基于整个消息内容计算） */
  messageHash: string;
  /** 标题路径（仅当 outlineItemType 为 'header' 时有效） */
  headerPath?: string;
  /** 标题文本（仅当 outlineItemType 为 'header' 时有效） */
  headerText?: string;
  /** DOM元素位置（用于定位菜单） */
  element: Element;
}