/**
 * 平台相关类型定义
 */

import { MessageOwner } from './message';

/**
 * 解析器配置接口
 */
export interface ParserConfig {
  /** 初始化方法，每个平台仅在挂载时调用一次 */
  init?: () => undefined;
  /** 当获取到挂载目标时触发 */
  afterGetContainer?: (outlineContainer:Element) => undefined;
  /** 当获取到chatArea时触发 */
  afterGetChatArea?: (chatArea:Element) => undefined;
  /** 获取对话区域元素，返回一个不会被清除的节点作为监视根节点 */
  selectChatArea: () => Element | null | undefined;
  /** 根据传入的监视根节点获取其对应的对话历史列表 */
  getMessageList: (root: Element) => HTMLCollection | Element[] | NodeListOf<Element> | null;
  /** 判断是否为用户消息，传入参数为每一个消息对话框 */
  determineMessageOwner: (messageEle: Element) => MessageOwner;
  /** 获取大纲应该挂载的目标容器元素，返回目标容器或null（失败时） */
  getOutlineContainer: () => Element | null;
  /** 获取可滚动的容器元素，传入chatArea作为参考，用于实现大纲滚动同步 */
  getScrollContainer?: (chatArea: Element) => Element | null;
  /** 超时时间（可选） */
  timeout?: number;
  
  // ===== 书签功能相关方法 =====
  
  /** 
   * 获取当前会话ID
   * 用于区分不同会话的书签
   * @returns 会话ID，无会话ID时返回 null
   */
  getConversationId?: () => string | null;
  
  /** 
   * 获取当前会话名称
   * 用于在书签列表中展示会话名称
   * @returns 会话名称，无法获取时返回 null
   */
  getConversationName?: () => string | null;
  
  /** 
   * 构建会话URL
   * 用于跨会话书签跳转
   * @param conversationId 会话ID
   * @returns 会话完整URL
   */
  buildConversationUrl?: (conversationId: string) => string | null;
}