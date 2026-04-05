/**
 * 腾讯元宝平台配置
 */

import type { ParserConfig } from '../types';
import { MessageOwner } from '../types';


export const yuanbaoConfig: ParserConfig = {
  selectChatArea: function () {
    return document.querySelector('.agent-chat__list__content');
  },
  getMessageList: function (root) {
    if (!root || !root.querySelectorAll) {
      return null;
    }

    return root.querySelectorAll(".agent-chat__bubble__content");
  },
  determineMessageOwner: function (messageEle) {
    const className = messageEle.firstElementChild?.className;
    if (typeof className !== 'string') {
      return MessageOwner.Other;
    }

    if (className.includes('-ai_')) {
      return MessageOwner.Assistant;
    }else{
      return MessageOwner.User;
    }
  },
  getOutlineContainer: function () {
    return document.querySelector('.agent-dialogue');
  },
  getScrollContainer: function (chatArea) {
    return chatArea.parentElement;
  },

  getConversationId: function () {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 'chat') {
      return `${parts[1]}/${parts[2]}`;
    }

    return null;
  },

  getConversationName: function () {
    const title = document.title.trim();
    return title || null;
  },

  buildConversationUrl: function (conversationId: string) {
    return `/chat/${conversationId}`;
  }
};
