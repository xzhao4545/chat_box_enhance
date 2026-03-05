/**
 * Qwen 平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';
import { getCurrentColors } from '../stores';

export const qwenConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('#chat-message-container');
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }
    let messages = root.querySelectorAll('.response-message-content, .chat-user-message');
    return messages;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    if (messageEle.className.includes('chat-user-message')) {
      return MessageOwner.User;
    }

    return MessageOwner.Assistant;
  },
  // 将整个大纲元素插入到指定位置中
  getOutlineContainer: function () {
    // 找到 Qwen 的主容器
    const mainContainer = document.querySelector('.desktop-layout');
    (mainContainer!! as HTMLElement).style.backgroundColor = getCurrentColors().background;
    return mainContainer;
  },
  getScrollContainer(chatArea) {
    return chatArea.parentElement;
  },
};