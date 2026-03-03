/**
 * ChatGPT 平台配置
 */

import { type ParserConfig, MessageOwner } from '../types';

export const chatgptConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    return document.querySelector('#main') || document.querySelector('main');
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }
    const messages = root.querySelectorAll('[data-message-author-role]');
    if (messages) {
      return messages;
    }
    // 备选方案：查找包含对话的 article 元素
    const articles = root.querySelectorAll('article');
    if (articles && articles.length > 0) {
      return articles;
    }
    return null;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    // ChatGPT 使用 data-message-author-role 属性来标识消息类型
    const authorRole = messageEle.getAttribute('data-message-author-role');
    if (authorRole === 'user') {
      return MessageOwner.User;
    }
    if (authorRole === 'assistant') {
      return MessageOwner.Assistant;
    }

    // 备选方案：通过查找子元素来判断
    if (messageEle.querySelector('[data-message-author-role="user"]')) {
      return MessageOwner.User;
    }
    if (messageEle.querySelector('[data-message-author-role="assistant"]')) {
      return MessageOwner.Assistant;
    }

    return MessageOwner.Other;
  },
  // 将整个大纲元素插入到指定位置中
  insertOutline: function (outlineEle) {
    const mainContainer = document.querySelector('#main')!!.parentElement!!.parentElement!!.parentElement;
    mainContainer!!.appendChild(outlineEle);
    return true;
  },
  timeout: 5000
};