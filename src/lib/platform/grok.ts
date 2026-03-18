/**
 * Grok 平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const grokConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('#last-reply-container')?.parentElement;
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }
    let messages = root.querySelectorAll(':scope > .relative');
    return Array.from(messages).concat(Array.from(root.querySelectorAll(':scope > #last-reply-container > div > .relative')));
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    // 根据对话框下面的按钮数量判断消息发送者
    const l = (messageEle.children[2].firstChild as Element).children.length;
    if (l < 5) {
      return MessageOwner.User;
    }
    return MessageOwner.Assistant;
  },
  // 将整个大纲元素插入到指定位置中
  getOutlineContainer: function () {
    // 找到 Grok 的主容器
    const chatContainer = document.querySelector('main');
    return chatContainer?.parentElement??null;
  },
  getScrollContainer(chatArea) {
    return chatArea.querySelector('.scrollbar-gutter-stable')
  },
  
  // ===== 书签功能相关 =====
  
  // Grok 无明确会话ID
  getConversationId: function () {
    return null;
  },
  
  getConversationName: function () {
    const titleElement = document.querySelector('h1, [class*="title"]');
    return titleElement?.textContent?.trim() || null;
  },
  
  buildConversationUrl: function () {
    return '/';
  }
};