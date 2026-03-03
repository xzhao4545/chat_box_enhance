/**
 * 豆包平台配置
 */

import { type ParserConfig, MessageOwner } from '../types';

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
  // 将整个大纲元素插入到指定位置中
  insertOutline: function (outlineEle) {
    // 找到豆包的主布局容器，插入到侧边栏区域
    const chatLayout = document.querySelector('main');
    chatLayout!!.appendChild(outlineEle);
    return true;
  }
};