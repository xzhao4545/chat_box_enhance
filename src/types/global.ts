/**
 * 全局对象类型定义
 */

import { type CachedMessage, MessageOwner } from './message';

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