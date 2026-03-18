/**
 * 通义千问平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const tongyiConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('.scrollWrapper-LOelOS');
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
    let className = messageEle.parentElement!!.className;
    // 通过类名判断
    if (className.includes('questionItem')) {
      return MessageOwner.User;
    }
    className = messageEle.parentElement!!.parentElement!!.className;
    if (className.includes('answerItem')) {
      return MessageOwner.Assistant;
    }

    return MessageOwner.Other;
  },
  // 将整个大纲元素插入到指定位置中
  getOutlineContainer: function () {
    // 找到通义千问的主容器
    const tongyiContainer = document.querySelectorAll('.mainContent-GBAlug')[1]
      .parentElement!!.parentElement;
    return tongyiContainer;
  },
  
  // ===== 书签功能相关 =====
  
  // 通义千问无明确会话ID
  getConversationId: function () {
    return null;
  },
  
  getConversationName: function () {
    const titleElement = document.querySelector('[class*="chat-title"], [class*="session-title"]');
    return titleElement?.textContent?.trim() || null;
  },
  
  buildConversationUrl: function () {
    return '/';
  }
};