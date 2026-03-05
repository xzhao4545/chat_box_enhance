/**
 * 豆包平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const doubaoConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('[data-testid="scroll_view"]')?.parentElement?.parentElement;
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelector) {
      return null;
    }
    const children = root.querySelectorAll('.container-PvPoAn');
    if (!children) {
      return null;
    }
    return children;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    // 豆包中用户消息通常包含 send_message 的 data-testid
    if (messageEle.querySelector('[data-testid*="send_message"]') ||
      messageEle.querySelector('[data-testid="send_message"]')) {
      return MessageOwner.User;
    }
    // AI消息通常包含 receive_message 的 data-testid
    if (messageEle.querySelector('[data-testid*="receive_message"]') ||
      messageEle.querySelector('[data-testid="receive_message"]')) {
      return MessageOwner.Assistant;
    }
    return MessageOwner.Other;
  },
  // 获取大纲应该挂载的目标容器元素
  getOutlineContainer: function () {
    // 找到豆包的主布局容器
    return document.querySelector('main') || null;
  },
  getScrollContainer(chatArea) {
    return chatArea.querySelector('[class^="scrollable"]');
  },
};