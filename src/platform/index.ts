/**
 * 平台检测和解析配置
 * 包含各AI聊天平台的DOM选择器和解析逻辑
 */

import { Platform, ParserConfig, MessageOwner } from '../types';
import { GLOBAL_CONFIG, getCurrentColors } from '../config';

/**
 * 判断当前平台
 */
export function judgePlatform(): Platform {
  // 根据当前URL判断平台
  const hostname = window.location.hostname;
  
  if (hostname.includes('deepseek.com')) {
    return 'deepseek';
  }
  if (hostname.includes('doubao.com')) {
    return 'doubao';
  }
  if (hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (hostname.includes('grok.com')) {
    return 'grok';
  }
  if (hostname.includes('qianwen.com')) {
    return 'tongyi';
  }
  if (hostname.includes('qwen.ai')) {
    return 'qwen';
  }
  if (hostname.includes('kimi.com')) {
    return 'kimi';
  }
  return 'unknown';
}

/**
 * 获取解析所需配置
 * @param platform 平台名称
 */
export function getParserConfig(platform: Platform): ParserConfig | null {
        switch (platform) {
            case 'deepseek':
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        const ele = document.querySelectorAll('.ds-scroll-area')[2];
                        if (ele.tagName == "TEXTAREA") {
                            return ele.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
                        } else {
                            return ele.parentElement?.parentElement?.parentElement;
                        }
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        let sc = root.querySelector('.ds-scroll-area')
                        if(!sc) return null;
                        if (!sc.firstChild || (sc.firstChild as Element).tagName == "TEXTAREA") {
                            return null;
                        }
                        return (sc.firstChild as Element).children;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        if ((messageEle as HTMLElement).style[0]) {
                            return MessageOwner.Assistant;
                        }
                        return MessageOwner.User;
                    }
                    ,
                    //将整个大纲元素插入到指定位置中，不要做其它处理，保证出错时会直接抛出异常
                    insertOutline: function (outlineEle) {
                        let b1 = document.querySelectorAll('.ds-scroll-area')[0].parentElement!!.parentElement!!.parentElement;
                        b1!!.appendChild(outlineEle);
                        return true;
                    }
                };
            case "doubao":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('[data-testid="scroll_view"]')?.parentElement?.parentElement;
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelector) {
                            return null;
                        }
                        const children = root.querySelectorAll('.container-PvPoAn');
                        if (!children) {
                            return null;
                        }
                        return children;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
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
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        // 找到豆包的主布局容器，插入到侧边栏区域
                        const chatLayout = document.querySelector('main');
                        chatLayout!!.appendChild(outlineEle);
                        return true;
                    }
                };
            case "chatgpt":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('#main') || document.querySelector('main');
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
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
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
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
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        const mainContainer = document.querySelector('#main')!!.parentElement!!.parentElement!!.parentElement;
                        mainContainer!!.appendChild(outlineEle);
                        return true;
                    },
                    timeout: 5000
                };
            case "grok":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('#last-reply-container')?.parentElement;
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelectorAll) {
                            return null;
                        }
                        let messages = root.querySelectorAll(':scope > .relative');
                        return Array.from(messages).concat(Array.from(root.querySelectorAll(':scope > #last-reply-container > div > .relative')));
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        //根据对话框下面的按钮数量判断消息发送者
                        const l = (messageEle.children[2].firstChild as Element).children.length;
                        if (l < 5) {
                            return MessageOwner.User;
                        }
                        return MessageOwner.Assistant;
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        // 找到 Grok 的主容器
                        const chatContainer = document.querySelector('main');
                        chatContainer!!.parentElement!!.appendChild(outlineEle);
                        return true;
                    }
                };
            case "tongyi":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('.scrollWrapper-LOelOS');
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelectorAll) {
                            return null;
                        }
                        // 尝试查找包含对话的元素
                        let messages = root.querySelectorAll('div[class^="content-"]');
                        return messages;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
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
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        // 找到通义千问的主容器
                        const tongyiContainer = document.querySelectorAll('.mainContent-GBAlug')[1]
                            .parentElement!!.parentElement;
                        tongyiContainer!!.appendChild(outlineEle);
                        return true;
                    }
                };
            case "qwen":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('#chat-message-container')
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelectorAll) {
                            return null;
                        }
                        let messages = root.querySelectorAll('.response-message-content, .chat-user-message');
                        return messages;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        if (messageEle.className.includes('chat-user-message')) {
                            return MessageOwner.User;
                        }

                        return MessageOwner.Assistant;
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        // 找到 Qwen 的主容器
                        const mainContainer = document.querySelector('.desktop-layout');
                        (mainContainer!! as HTMLElement).style.backgroundColor = getCurrentColors().background;
                        mainContainer!!.appendChild(outlineEle);
                        return true;
                    }
                };
            case "kimi":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('.layout-content-main')
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelectorAll) {
                            return null;
                        }
                        let messages = root.querySelectorAll('.chat-content-item');
                        return messages;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        if (messageEle.className.includes('chat-content-item-user')) {
                            return MessageOwner.User;
                        }else if(messageEle.className.includes('chat-content-item-assistant')){
                            return MessageOwner.Assistant;
                        }

                        return MessageOwner.Other;
                    }
                    ,
                    //将整个大纲元素插入到指定位置中
                    insertOutline: function (outlineEle) {
                        // 找到 Qwen 的主容器
                        const mainContainer = document.querySelector('.main');
                        // mainContainer.style.backgroundColor = getCurrentColors().background;
                        mainContainer!!.appendChild(outlineEle);
                        return true;
                    },
                    timeout: 5000
                };
            default: return null;
        }
    }
