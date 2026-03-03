/**
 * 类型定义
 * 包含消息所有者枚举、平台类型和解析配置类型
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
 * 支持的平台类型
 */
export type Platform = 'deepseek' | 'doubao' | 'chatgpt' | 'grok' | 'tongyi' | 'qwen' | 'kimi' | 'unknown';

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
 * 解析器配置接口
 */
export interface ParserConfig {
  /** 获取对话区域元素，返回一个不会被清除的节点作为监视根节点 */
  selectChatArea: () => Element | null | undefined;
  /** 根据传入的监视根节点获取其对应的对话历史列表 */
  getMessageList: (root: Element) => HTMLCollection | Element[] | NodeListOf<Element> | null;
  /** 判断是否为用户消息，传入参数为每一个消息对话框 */
  determineMessageOwner: (messageEle: Element) => MessageOwner;
  /** 将整个大纲元素插入到指定位置中，不要做其它处理，保证出错时会直接抛出异常，当插入成功后返回true */
  insertOutline: (outlineEle: Element) => boolean;
  /** 超时时间（可选） */
  timeout?: number;
}

/**
 * 全局对象接口
 */
export interface GlobalObj {
  // 缓存相关变量
  messageCache: CachedMessage[];
  lastMessageCount: number;
  MAX_CACHE_SIZE: number;
  idLength: number;

  // 运行时对象
  currentObserver: MutationObserver | null;
  currentChatArea: Element | null;
  outlineContent: Element | null;
  parserConfig: ParserConfig | null;
  debouncedRefresh: (() => void) | null;
  getCachedChatArea: ((forceRefresh?: boolean) => Element | null);
  
  // 内部缓存
  _cachedChatArea: Element | null;

  // 展开/收起状态
  allExpanded: boolean;

  // 强制刷新函数
  forceRefreshOutline: (() => void) | null;
  toggleAllNodes: (() => void) | null;
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
