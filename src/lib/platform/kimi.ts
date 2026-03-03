/**
 * Kimi 平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const kimiConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('.layout-content-main');
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }
    let messages = root.querySelectorAll('.chat-content-item');
    return messages;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    if (messageEle.className.includes('chat-content-item-user')) {
      return MessageOwner.User;
    } else if (messageEle.className.includes('chat-content-item-assistant')) {
      return MessageOwner.Assistant;
    }

    return MessageOwner.Other;
  },
  // 将整个大纲元素插入到指定位置中
  getOutlineContainer: function () {
    // 找到 Kimi 的主容器
    const mainContainer = document.querySelector('.main');
    return mainContainer;
  },
  timeout: 5000
};