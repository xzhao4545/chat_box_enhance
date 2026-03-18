/**
 * DeepSeek 平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';

export const deepseekConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    const ele = document.querySelectorAll('.ds-scroll-area')[2];
    if ((ele as Element).tagName == "TEXTAREA") {
      return (ele as Element).parentElement?.parentElement?.parentElement?.parentElement;
    } else {
      return ele;
    }
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    const items=root.querySelectorAll('.ds-virtual-list-visible-items')[0];
    if(items===undefined){
      return []
    }
    return items.children;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    if ((messageEle as HTMLElement).style[0]) {
      return MessageOwner.Assistant;
    }
    return MessageOwner.User;
  },
  // 获取大纲应该挂载的目标容器元素
  getOutlineContainer: function () {
    let b1 = document.querySelectorAll('.ds-scroll-area')[0]?.parentElement?.parentElement?.parentElement;
    return b1 || null;
  },
  getScrollContainer: function(chatArea:Element): Element | null{
    return chatArea.querySelector('.ds-virtual-list');
  },
  
  // ===== 书签功能相关 =====
  
  // DeepSeek URL: /a/chat/s/{conversation-id}
  getConversationId: function () {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[0] === 'a' && parts[1] === 'chat' && parts[2] === 's') {
      return parts[3];
    }
    return null;
  },
  
  getConversationName: function () {
    const ele = document.querySelectorAll('.ds-scroll-area')[2];
    return ele.children[0].textContent;
  },
  
  buildConversationUrl: function (conversationId: string) {
    return `/a/chat/s/${conversationId}`;
  }
};