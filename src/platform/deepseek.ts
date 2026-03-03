/**
 * DeepSeek 平台配置
 */

import { type ParserConfig, MessageOwner } from '../types';

export const deepseekConfig: ParserConfig = {
  // 获取对话区域元素，返回一个不会被清除的节点作为监视根节点
  selectChatArea: function () {
    const ele = document.querySelectorAll('.ds-scroll-area')[2];
    if ((ele as Element).tagName == "TEXTAREA") {
      return (ele as Element).parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
    } else {
      return (ele as Element).parentElement?.parentElement?.parentElement;
    }
  },
  // 根据传入的监视根节点获取其对应的对话历史列表
  getMessageList: function (root) {
    let sc = root.querySelector('.ds-scroll-area');
    if (!sc) return null;
    if (!sc.firstChild || (sc.firstChild as Element).tagName == "TEXTAREA") {
      return null;
    }
    return (sc.firstChild as Element).children;
  },
  // 判断是否为用户消息，传入参数为每一个消息对话框
  determineMessageOwner: function (messageEle) {
    if ((messageEle as HTMLElement).style[0]) {
      return MessageOwner.Assistant;
    }
    return MessageOwner.User;
  },
  // 将整个大纲元素插入到指定位置中，不要做其它处理，保证出错时会直接抛出异常
  insertOutline: function (outlineEle) {
    let b1 = document.querySelectorAll('.ds-scroll-area')[0].parentElement!!.parentElement!!.parentElement;
    b1!!.appendChild(outlineEle);
    return true;
  }
};