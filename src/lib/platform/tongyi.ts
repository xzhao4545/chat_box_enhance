/**
 * 通义千问平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const tongyiConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('[class^="scrollOutWrapper"]');
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }
    // 尝试查找包含对话的元素
    let messages = root.querySelectorAll('div[class^="content-"]');
    return messages;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    let className = messageEle.parentElement!!.parentElement!!.className;
    // 通过类名判断
    if (className.includes('questionItem')) {
      return MessageOwner.User;
    }
    className = messageEle.parentElement!!.parentElement!!.parentElement!!.className;
    if (className.includes('answerItem')) {
      return MessageOwner.Assistant;
    }

    return MessageOwner.Other;
  },
  // 将整个大纲元素插入到指定位置中
  getOutlineContainer: function () {
    // 找到通义千问的主容器
    const tongyiContainer = document.querySelector('[class^=mainContent]')!!
      .parentElement!!.parentElement!!.parentElement!!.parentElement!!.parentElement!!.parentElement!!.parentElement;
    return tongyiContainer;
  },
  getScrollContainer: function(chatArea:Element): Element | null{
    return chatArea.parentElement;
  },
  
  // ===== 书签功能相关 =====
  
  // 通义千问 URL: /chat/{conversation-id}
  getConversationId: function () {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'chat') {
      return parts[1];
    }
    return null;
  },
  
  getConversationName: function () {
    const titleElement = document.querySelector(".mobile\\:pr-3 > div.hover\\:\\!bg-tag > .space-x-1");
    return titleElement?.textContent?.trim() || null;
  },
  
  buildConversationUrl: function (conversationId: string) {
    return `/chat/${conversationId}`;
  }
};