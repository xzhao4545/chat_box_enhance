// ==UserScript==
// @name         聊天助手大纲
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @description  为多个AI聊天平台生成智能对话大纲，支持实时更新、层级结构、主题切换，提升聊天体验和内容导航效率
// @author       xzhao
// @match        *://chatgpt.com/*
// @match        *://chat.deepseek.com/*
// @match        *://grok.com/*
// @match        *://www.qianwen.com/*
// @match        *://chat.qwen.ai/*
// @match        *://*.doubao.com/*
// @match        *://www.kimi.com/*
// @icon         https://cdn.deepseek.com/chat/icon.png
// @license      MIT
// @grant        none

// ==/UserScript==

(function () {
    // 全局配置
    const GLOBAL_CONFIG = {
        // 主题配置
        theme: {
            // 高亮配置
            highlightColor: '#83daff2a',
            highlightTime: 2000,

            // 当前主题模式
            currentTheme: 'light', // 'light' 或 'dark'

            // 颜色配置
            colors: {
                light: {
                    primary: '#28a745',
                    user: '#007acc',
                    background: '#ffffff',
                    border: '#ddd',
                    shadow: 'rgba(0,0,0,0.15)',
                    text: '#333',
                    headerBg: '#ffffff',

                    // 标题级别颜色
                    headers: {
                        h1: '#dc3545',
                        h2: '#fd7e14',
                        h3: '#ffc107',
                        h4: '#28a745',
                        h5: '#17a2b8',
                        h6: '#6f42c1'
                    }
                },
                dark: {
                    primary: '#4caf50',
                    user: '#64b5f6',
                    background: '#2d2d2d',
                    border: '#555',
                    shadow: 'rgba(0,0,0,0.3)',
                    text: '#e0e0e0',
                    headerBg: '#2d2d2d',

                    // 标题级别颜色
                    headers: {
                        h1: '#f48fb1',
                        h2: '#ffab91',
                        h3: '#fff176',
                        h4: '#81c784',
                        h5: '#4dd0e1',
                        h6: '#b39ddb'
                    }
                }
            },

            // 尺寸配置
            sizes: {
                outlineWidth: '300px',
                borderRadius: '8px',
                padding: '15px',
                fontSize: '14px',
                indentSize: 15
            }
        },

        // 功能配置
        features: {
            autoExpand: true,
            showUserMessages: true,
            showAIMessages: true,
            enableAnimation: true,
            isVisible: true, // 大纲是否可见
            textLength: 50,  //大纲展示的字符数
            debouncedInterval: 500  //大纲更新间隔
        },
        text: {
            title: "对话大纲"
        }
    };
    function judgePlatform() {
        // 根据当前URL判断平台
        if (window.location.hostname.includes('deepseek.com')) {
            return 'deepseek';
        }
        if (window.location.hostname.includes('doubao.com')) {
            return 'doubao';
        }
        if (window.location.hostname.includes('chatgpt.com')) {
            return 'chatgpt';
        }
        if (window.location.hostname.includes('grok.com')) {
            return 'grok';
        }
        if (window.location.hostname.includes('qianwen.com')) {
            return 'tongyi';
        }
        if (window.location.hostname.includes('qwen.ai')) {
            return 'qwen';
        }
        if (window.location.hostname.includes('kimi.com')) {
            return 'kimi';
        }
        return 'unknown';
    }

    //获取解析所需配置
    function getParserConfig(platform) {
        switch (platform) {
            case 'deepseek':
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        const ele = document.querySelectorAll('.ds-scroll-area')[2];
                        if (ele.tagName == "TEXTAREA") {
                            return ele.parentElement.parentElement.parentElement
                                .parentElement.parentElement.parentElement.parentElement;
                        } else {
                            return ele.parentElement.parentElement.parentElement;
                        }
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        root = root.querySelector('.ds-scroll-area')
                        if (!root.firstChild || root.firstChild.tagName == "TEXTAREA") {
                            return null;
                        }
                        return root.firstChild.children;
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        if (messageEle.style[0]) {
                            return MessageOwner.Assistant;
                        }
                        return MessageOwner.User;
                    }
                    ,
                    //将整个大纲元素插入到指定位置中，不要做其它处理，保证出错时会直接抛出异常
                    insertOutline: function (outlineEle) {
                        let b1 = document.querySelectorAll('.ds-scroll-area')[0].parentElement.parentElement.parentElement;
                        b1.appendChild(outlineEle);
                    }
                };
            case "doubao":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('[data-testid="scroll_view"]').parentElement.parentElement;
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
                        chatLayout.appendChild(outlineEle);
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
                        const mainContainer = document.querySelector('#main').parentElement.parentElement.parentElement;
                        mainContainer.appendChild(outlineEle);
                    },
                    timeout: 5000
                };
            case "grok":
                return {
                    //获取对话区域元素，返回一个不会被清除的节点作为监视根节点
                    selectChatArea: function () {
                        return document.querySelector('#last-reply-container').parentElement;
                    },
                    //根据传入的监视根节点获取其对应的对话历史列表
                    getMessageList: function (root) {
                        if (!root || !root.querySelectorAll) {
                            return null;
                        }
                        let messages = root.querySelectorAll(':scope > .relative');
                        return [...messages, ...root.querySelectorAll(':scope > #last-reply-container > div > .relative')];
                    }
                    ,
                    //判断是否为用户消息，传入参数为每一个消息对话框
                    determineMessageOwner: function (messageEle) {
                        //根据对话框下面的按钮数量判断消息发送者
                        const l = messageEle.children[2].firstChild.children.length;
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
                        chatContainer.parentElement.appendChild(outlineEle);
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
                        let className = messageEle.parentElement.className;
                        // 通过类名判断
                        if (className.includes('questionItem')) {
                            return MessageOwner.User;
                        }
                        className = messageEle.parentElement.parentElement.className;
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
                            .parentElement.parentElement;
                        tongyiContainer.appendChild(outlineEle);
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
                        mainContainer.style.backgroundColor = getCurrentColors().background;
                        mainContainer.appendChild(outlineEle);
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
                        mainContainer.appendChild(outlineEle);
                    },
                    timeout: 5000
                };
            default: return null;
        }
    }
    const MessageOwner = Object.freeze({
        User: 'user',
        Assistant: 'assitant',
        Other: 'other'
    });

    // 获取当前主题颜色
    function getCurrentColors() {
        return GLOBAL_CONFIG.theme.colors[GLOBAL_CONFIG.theme.currentTheme];
    }

    // 插入CSS样式
    function insertStyles() {
        const styleId = 'chat-outline-styles';
        if (document.getElementById(styleId)) return; // 避免重复插入

        const style = document.createElement('style');
        style.id = styleId;
        updateStyleContent(style);

        document.head.appendChild(style);
    }

    // 更新样式内容
    function updateStyleContent(style) {
        const colors = getCurrentColors();

        style.textContent = `
            /* 大纲容器样式 */
            #chat-outline {
                width: ${GLOBAL_CONFIG.theme.sizes.outlineWidth};
                background: ${colors.background};
                border-radius: ${GLOBAL_CONFIG.theme.sizes.borderRadius};
                padding: 0;
                box-shadow: 0 4px 12px ${colors.shadow};
                font-size: ${GLOBAL_CONFIG.theme.sizes.fontSize};
                transition: all 0.3s ease;
                display: ${GLOBAL_CONFIG.features.isVisible ? 'block' : 'none'};
                height: 100dvh;
            }
            
            /* 固定在右侧的大纲样式 */
            #chat-outline.outline-fixed-right {
                position: fixed;
                top: 0;
                right: 0;
                z-index: 10000;
                height: 100vh;
                border-radius: ${GLOBAL_CONFIG.theme.sizes.borderRadius} 0 0 ${GLOBAL_CONFIG.theme.sizes.borderRadius};
                border-right: none;
                box-shadow: -4px 0 12px ${colors.shadow};
            }
            
            /* 大纲头部样式 */
            .chat-outline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-left: 15px;
                border-bottom: 1px solid ${colors.border};
                background: ${colors.headerBg};
                border-radius: ${GLOBAL_CONFIG.theme.sizes.borderRadius} ${GLOBAL_CONFIG.theme.sizes.borderRadius} 0 0;
                height: 10%;
            }
            
            /* 大纲标题样式 */
            .chat-outline-title {
                margin: 0;
                color: ${colors.text};
                font-size: 16px;
                font-weight: bold;
            }
            
            /* 控制按钮容器 */
            .outline-controls {
                display: flex;
                gap: 8px;
            }
            
            /* 控制按钮样式 */
            .outline-btn {
                background: none;
                border: 1px solid ${colors.border};
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 12px;
                color: ${colors.text};
                transition: all 0.2s ease;
            }
            
            .outline-btn:hover {
                background: ${colors.border};
                transform: scale(1.05);
            }
            
            #outline-content {
                overflow-y: auto;
                height: 90%;
            }
            
            /* 用户消息项样式 */
            .outline-user-item {
                margin: 8px 15px;
                padding: 8px;
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f0f8ff' : '#3a3a3a'};
                border-left: 3px solid ${colors.user};
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
                color: ${colors.text};
            }
            
            .outline-user-item:hover {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#e6f3ff' : '#4a4a4a'};
            }
            
            /* AI消息容器样式 */
            .outline-ai-container {
                margin: 8px 15px;
                border-left: 3px solid ${colors.primary};
                border-radius: 4px;
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f8f8f8' : '#3a3a3a'};
            }
            
            /* AI消息头部样式 */
            .outline-ai-header {
                padding: 8px;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.2s;
                color: ${colors.text};
            }
            
            .outline-ai-header:hover {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f0f0f0' : '#4a4a4a'};
            }
            
            /* AI消息简单项样式 */
            .outline-ai-item {
                margin: 8px 15px;
                padding: 8px;
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f8f8f8' : '#3a3a3a'};
                border-left: 3px solid ${colors.primary};
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
                color: ${colors.text};
            }
            
            .outline-ai-item:hover {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f0f0f0' : '#4a4a4a'};
            }
            
            /* 树形节点样式 */
            .tree-node {
                margin: 4px 0;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.2s;
                color: ${colors.text};
            }
            
            .tree-node:hover {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#e9ecef' : '#4a4a4a'} !important;
            }
            
            .tree-node-level-0 {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#e9ecef' : '#404040'};
                font-size: 14px;
            }
            
            .tree-node-level-1 {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f1f3f4' : '#383838'};
                font-size: 13px;
            }
            
            .tree-node-level-2 {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f8f9fa' : '#353535'};
                font-size: 12px;
            }
            
            .tree-node-level-3 {
                background: ${GLOBAL_CONFIG.theme.currentTheme === 'light' ? '#f8f9fa' : '#353535'};
                font-size: 11px;
            }
            
            /* 切换按钮样式 */
            .toggle-btn {
                font-size: 14px;
                transition: transform 0.2s;
                cursor: pointer;
                margin-left: 8px;
                user-select: none;
                color: ${colors.text};
                padding: 4px;
                border-radius: 3px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
                min-height: 20px;
                line-height: 1;
            }
            
            .toggle-btn:hover {
                background-color: ${colors.border};
                transform: scale(1.1);
            }
            
            .toggle-btn.collapsed {
                transform: rotate(-90deg);
            }
            
            .toggle-btn.collapsed:hover {
                background-color: ${colors.border};
                transform: rotate(-90deg) scale(1.1);
            }
            
            /* 标题级别边框颜色 */
            .header-level-1 { border-left: 2px solid ${colors.headers.h1}; }
            .header-level-2 { border-left: 2px solid ${colors.headers.h2}; }
            .header-level-3 { border-left: 2px solid ${colors.headers.h3}; }
            .header-level-4 { border-left: 2px solid ${colors.headers.h4}; }
            .header-level-5 { border-left: 2px solid ${colors.headers.h5}; }
            .header-level-6 { border-left: 2px solid ${colors.headers.h6}; }
            
            /* 动画效果 */
            .highlight-animation {
                animation: highlight 0.5s ease-in-out;
            }
            
            @keyframes highlight {
                0% { background-color: transparent; }
                50% { background-color: ${GLOBAL_CONFIG.theme.highlightColor}; }
                100% { background-color: transparent; }
            }
            
            /* 性能优化：使用 transform 和 opacity 进行动画 */
            .tree-node, .outline-user-item, .outline-ai-item, .outline-ai-header {
                will-change: transform;
                backface-visibility: hidden;
            }
            
            /* 显示按钮样式 */
            #show-outline-btn {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                background: ${colors.background};
                border: 1px solid ${colors.border};
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 16px;
                color: ${colors.text};
                box-shadow: 0 2px 8px ${colors.shadow};
                transition: all 0.3s ease;
                z-index: 9999;
                display: ${GLOBAL_CONFIG.features.isVisible ? 'none' : 'flex'};
                align-items: center;
                justify-content: center;
            }
            
            #show-outline-btn:hover {
                background: ${colors.border};
                transform: translateY(-50%) scale(1.1);
            }
        `;
    }


    // 构建标题层级树结构
    function buildHeaderTree(headers) {
        const tree = [];
        const stack = [];

        headers.forEach(header => {
            const level = parseInt(header.tagName.charAt(1)); // h1->1, h2->2, etc.
            const node = {
                element: header,
                level: level,
                text: header.textContent,
                children: []
            };

            // 找到合适的父节点
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                tree.push(node);
            } else {
                stack[stack.length - 1].children.push(node);
            }

            stack.push(node);
        });

        return tree;
    }

    // 创建可展开收起的树形结构DOM元素
    function createTreeStructure(nodes, depth) {
        const container = document.createElement('div');
        container.style.marginLeft = `${depth * GLOBAL_CONFIG.theme.sizes.indentSize}px`;

        nodes.forEach(node => {
            const nodeWrapper = document.createElement('div');

            const nodeElement = document.createElement('div');
            nodeElement.className = `tree-node tree-node-level-${Math.min(depth, 3)} header-level-${node.level}`;

            const textSpan = document.createElement('span');
            textSpan.textContent = node.text;

            nodeElement.appendChild(textSpan);

            // 如果有子节点，添加展开/收起按钮
            if (node.children.length > 0) {
                const toggleBtn = document.createElement('span');
                toggleBtn.textContent = '▼';
                toggleBtn.className = 'toggle-btn';
                nodeElement.appendChild(toggleBtn);

                // 创建子节点容器
                const childContainer = createTreeStructure(node.children, depth + 1);
                childContainer.style.display = GLOBAL_CONFIG.features.autoExpand ? 'block' : 'none';

                // 添加展开/收起功能
                toggleBtn.onclick = (e) => {
                    e.stopPropagation();
                    const isExpanded = childContainer.style.display !== 'none';
                    childContainer.style.display = isExpanded ? 'none' : 'block';
                    toggleBtn.textContent = isExpanded ? '▶' : '▼';
                    toggleBtn.classList.toggle('collapsed', isExpanded);
                };

                nodeWrapper.appendChild(childContainer);
            }

            // 添加点击跳转功能（点击文本部分）
            nodeElement.onclick = (e) => {
                e.stopPropagation();
                node.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                highlightElement(node.element);
            };

            nodeWrapper.insertBefore(nodeElement, nodeWrapper.firstChild);
            container.appendChild(nodeWrapper);
        });

        return container;
    }

    // 高亮元素
    function highlightElement(element) {
        // 移除可能存在的高亮类
        element.classList.remove('highlight-animation');

        // 强制重排以确保类被移除
        element.offsetHeight;

        // 添加高亮类
        element.classList.add('highlight-animation');

        // 在动画结束后移除类
        setTimeout(() => {
            element.classList.remove('highlight-animation');
        }, GLOBAL_CONFIG.theme.highlightTime);
    }

    // 切换主题
    function toggleTheme() {
        GLOBAL_CONFIG.theme.currentTheme = GLOBAL_CONFIG.theme.currentTheme === 'light' ? 'dark' : 'light';

        // 更新样式
        const style = document.getElementById('chat-outline-styles');
        if (style) {
            updateStyleContent(style);
        }

        // 保存主题设置到localStorage
        localStorage.setItem('chat-outline-theme', GLOBAL_CONFIG.theme.currentTheme);
    }

    // 当大纲插入失败时，将其插入到body并固定在页面右侧
    function insertOutlineToBodyFixed(outlineEle) {
        // 添加固定定位的样式类
        outlineEle.classList.add('outline-fixed-right');

        // 插入到body
        document.body.appendChild(outlineEle);
    }

    // 切换大纲可见性
    function toggleOutlineVisibility() {
        GLOBAL_CONFIG.features.isVisible = !GLOBAL_CONFIG.features.isVisible;

        const outlineEle = document.getElementById('chat-outline');
        const showBtn = document.getElementById('show-outline-btn');

        if (outlineEle) {
            outlineEle.style.display = GLOBAL_CONFIG.features.isVisible ? 'block' : 'none';
        }

        if (showBtn) {
            showBtn.style.display = GLOBAL_CONFIG.features.isVisible ? 'none' : 'flex';
        }

        // 保存可见性设置到localStorage
        localStorage.setItem('chat-outline-visible', GLOBAL_CONFIG.features.isVisible);
    }

    // 创建显示按钮
    function createShowButton() {
        // 检查是否已存在显示按钮
        if (document.getElementById('show-outline-btn')) {
            return;
        }

        const showBtn = document.createElement('button');
        showBtn.id = 'show-outline-btn';
        showBtn.innerHTML = '📋';
        showBtn.title = '显示对话大纲';
        showBtn.onclick = toggleOutlineVisibility;

        document.body.appendChild(showBtn);
    }

    // 从localStorage加载设置
    function loadSettings() {
        const savedTheme = localStorage.getItem('chat-outline-theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            GLOBAL_CONFIG.theme.currentTheme = savedTheme;
        }

        const savedVisible = localStorage.getItem('chat-outline-visible');
        if (savedVisible !== null) {
            GLOBAL_CONFIG.features.isVisible = savedVisible === 'true';
        }
    }

    function initOutlineEle() {
        const outlineEle = document.createElement('div');
        outlineEle.id = 'chat-outline';

        // 创建头部容器
        const header = document.createElement('div');
        header.className = 'chat-outline-header';

        // 添加标题
        const title = document.createElement('h3');
        title.textContent = GLOBAL_CONFIG.text.title;
        title.className = 'chat-outline-title';
        header.appendChild(title);

        // 创建控制按钮容器
        const controls = document.createElement('div');
        controls.className = 'outline-controls';

        // 刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'outline-btn';
        refreshBtn.innerHTML = '🔄';
        refreshBtn.title = '强制刷新大纲';
        refreshBtn.onclick = () => {
            // 触发强制刷新
            if (GLOBAL_OBJ.forceRefreshOutline) {
                GLOBAL_OBJ.forceRefreshOutline();
            }
        };

        // 展开/收起所有节点按钮
        const toggleAllBtn = document.createElement('button');
        toggleAllBtn.className = 'outline-btn';
        toggleAllBtn.innerHTML = '📂';
        toggleAllBtn.title = '展开/收起所有节点';
        toggleAllBtn.onclick = () => {
            if (GLOBAL_OBJ.toggleAllNodes) {
                GLOBAL_OBJ.toggleAllNodes();
                // 更新按钮图标
                toggleAllBtn.innerHTML = GLOBAL_OBJ.allExpanded ? '📂' : '📁';
                toggleAllBtn.title = GLOBAL_OBJ.allExpanded ? '收起所有节点' : '展开所有节点';
            }
        };

        // 主题切换按钮
        const themeBtn = document.createElement('button');
        themeBtn.className = 'outline-btn';
        themeBtn.innerHTML = GLOBAL_CONFIG.theme.currentTheme === 'light' ? '🌙' : '☀️';
        themeBtn.title = '切换主题';
        themeBtn.onclick = () => {
            toggleTheme();
            themeBtn.innerHTML = GLOBAL_CONFIG.theme.currentTheme === 'light' ? '🌙' : '☀️';
        };

        // 隐藏按钮
        const hideBtn = document.createElement('button');
        hideBtn.className = 'outline-btn';
        hideBtn.innerHTML = '✕';
        hideBtn.title = '隐藏大纲';
        hideBtn.onclick = toggleOutlineVisibility;

        controls.appendChild(refreshBtn);
        controls.appendChild(toggleAllBtn);
        controls.appendChild(themeBtn);
        controls.appendChild(hideBtn);
        header.appendChild(controls);

        outlineEle.appendChild(header);

        // 创建大纲内容容器
        const outlineContent = document.createElement('div');
        outlineContent.id = 'outline-content';
        outlineEle.appendChild(outlineContent);

        return outlineEle;
    }
    // 全局对象，用于存储需要全局访问的变量和函数
    const GLOBAL_OBJ = {
        // 缓存相关变量
        messageCache: [],
        lastMessageCount: 0,
        MAX_CACHE_SIZE: 100, // 最大缓存条目数
        idLength: 10,

        // 运行时对象
        currentObserver: null,
        currentChatArea: null,
        outlineContent: null,
        parserConfig: null,
        debouncedRefresh: null,
        getCachedChatArea: null,
        chatArea: null,
        // 展开/收起状态
        allExpanded: true, // 默认展开状态

        // 强制刷新函数
        forceRefreshOutline: null,
        toggleAllNodes: null
    };

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 获取消息的唯一标识
    function getMessageId(index, messageElement) {
        let text = messageElement.textContent;
        // 获取消息唯一标识
        if (text.length <= GLOBAL_OBJ.idLength * 2) {
            return index + text
        }
        return index + text.substring(0, GLOBAL_OBJ.idLength) + text.substring(text.length - GLOBAL_OBJ.idLength, text.length);
    }

    // 检查消息是否已缓存且未变化
    function isMessageCached(index, messageElement, messageId) {
        if (GLOBAL_OBJ.messageCache[index].messageId != messageId) {
            return false;
        }

        const cached = GLOBAL_OBJ.messageCache[index];
        // 简单检查内容长度是否变化（适用于正在生成的消息）
        return cached.originalElement === messageElement && cached.textLength === messageElement.textContent.length;
    }

    // 缓存消息信息
    function cacheMessage(messageElement, messageId, outlineElement) {
        GLOBAL_OBJ.messageCache.push({
            messageId: messageId,
            textLength: messageElement.textContent.length,
            outlineElement: outlineElement, //保存大纲元素的引用
            originalElement: messageElement, // 保存原始消息元素的引用
            timestamp: Date.now()
        });
    }

    // 强制清理所有缓存
    function clearAllCache() {
        GLOBAL_OBJ.messageCache = [];
        GLOBAL_OBJ.lastMessageCount = 0;
        console.log('已清理所有缓存');
    }

    // 展开或收起所有节点
    function toggleAllNodes() {
        if (!GLOBAL_OBJ.outlineContent) {
            console.log('大纲内容容器不存在');
            return;
        }

        const newState = !GLOBAL_OBJ.allExpanded;
        GLOBAL_OBJ.allExpanded = newState;

        // 查找所有的切换按钮和对应的容器
        const toggleButtons = GLOBAL_OBJ.outlineContent.querySelectorAll('.toggle-btn');

        // 处理AI消息容器的展开/收起
        toggleButtons.forEach(btn => {
            const container = btn.parentElement.nextElementSibling;
            if (container) {
                container.style.display = newState ? 'block' : 'none';
                btn.textContent = newState ? '▼' : '▶';
                btn.classList.toggle('collapsed', !newState);
            }
        });

        // 处理树形结构的展开/收起
        const treeNodes = GLOBAL_OBJ.outlineContent.querySelectorAll('.tree-node');
        treeNodes.forEach(node => {
            const toggleBtn = node.querySelector('.toggle-btn');
            if (toggleBtn) {
                const nodeWrapper = node.parentElement;
                const childContainer = nodeWrapper.querySelector('div:last-child');
                if (childContainer && childContainer !== node) {
                    childContainer.style.display = newState ? 'block' : 'none';
                    toggleBtn.textContent = newState ? '▼' : '▶';
                    toggleBtn.classList.toggle('collapsed', !newState);
                }
            }
        });

        console.log(`已${newState ? '展开' : '收起'}所有节点`);
    }

    function refreshOutlineItems(outlineBone, determineMessageOwnerFunc) {
        const chatArea = GLOBAL_OBJ.getCachedChatArea();
        if (!chatArea) {
            console.log('无法定位到对话区域')
            return;
        }
        const cd = GLOBAL_OBJ.parserConfig.getMessageList(chatArea);
        if (cd == null) {
            console.log("对话区域无效，大纲生成失败,chatArea:", chatArea)
            return;
        }
        const currentMessageCount = cd.length;

        // 如果消息数量没有变化，检查是否需要更新
        if (currentMessageCount === GLOBAL_OBJ.lastMessageCount && currentMessageCount > 0) {
            // 检查最后一条消息是否还在变化（可能是AI正在回复）
            const lastMessage = cd[cd.length - 1];
            const lastMessageId = getMessageId(cd.length - 1, lastMessage);

            if (isMessageCached(GLOBAL_OBJ.messageCache.length - 1, lastMessage, lastMessageId)) {
                return; // 没有变化，跳过更新
            }
        }
        console.log('刷新大纲,chatArea:', chatArea.firstChild)

        // 使用文档片段来减少DOM操作
        const fragment = document.createDocumentFragment();
        let messageIndex = 0;
        let hasChanges = false;
        // 遍历对话生成大纲
        for (let i = 0; i < cd.length; i++) {
            const c = cd[i];
            const messageId = getMessageId(i, c);

            // 检查是否可以使用缓存
            if (messageIndex < GLOBAL_OBJ.messageCache.length) {
                if (isMessageCached(messageIndex, c, messageId)) {
                    fragment.append(GLOBAL_OBJ.messageCache[messageIndex].outlineElement)
                    messageIndex++;
                    continue;
                }
            }

            hasChanges = true;
            let outlineElement = null;

            const messageType = determineMessageOwnerFunc(c);
            switch (messageType) {
                case MessageOwner.User:
                    if (!GLOBAL_CONFIG.features.showUserMessages) break;

                    messageIndex++;
                    outlineElement = createUserOutlineItem(c, messageIndex);
                    break;

                case MessageOwner.Assistant:
                    if (!GLOBAL_CONFIG.features.showAIMessages) break;

                    messageIndex++;
                    outlineElement = createAIOutlineItem(c, messageIndex);
                    break;
            }

            if (outlineElement) {
                fragment.appendChild(outlineElement);
                // 缓存新创建的元素
                cacheMessage(c, messageId, outlineElement);
            }
        }

        // 只有在有变化时才更新DOM
        if (hasChanges || currentMessageCount !== GLOBAL_OBJ.lastMessageCount) {
            // 清空并重新填充
            if ('replaceChildren' in outlineBone) {
                outlineBone.replaceChildren();
            } else {
                outlineBone.innerHTML = '';
            }
            outlineBone.appendChild(fragment);
        }

        GLOBAL_OBJ.lastMessageCount = currentMessageCount;
    }

    // 创建用户消息大纲项
    function createUserOutlineItem(messageElement, messageIndex) {
        const userItem = document.createElement('div');
        userItem.className = 'outline-user-item';

        const userText = messageElement.textContent.substring(0, GLOBAL_CONFIG.features.textLength) +
            (messageElement.textContent.length > GLOBAL_CONFIG.features.textLength ? '...' : '');
        userItem.textContent = `👤 ${messageIndex}. ${userText}`;

        // 添加点击跳转功能
        userItem.onclick = () => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            highlightElement(messageElement);
        };

        return userItem;
    }

    // 创建AI消息大纲项
    function createAIOutlineItem(messageElement, messageIndex) {
        // 检查是否有标题标签
        const headers = messageElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

        if (headers.length > 0) {
            return createAIContainerWithHeaders(messageElement, messageIndex, headers);
        } else {
            return createSimpleAIItem(messageElement, messageIndex);
        }
    }

    // 创建带标题的AI消息容器
    function createAIContainerWithHeaders(messageElement, messageIndex, headers) {
        const aiContainer = document.createElement('div');
        aiContainer.className = 'outline-ai-container';

        // 创建AI消息头部
        const aiHeader = document.createElement('div');
        aiHeader.className = 'outline-ai-header';

        const headerText = document.createElement('span');
        const aiText = messageElement.textContent.substring(0, GLOBAL_CONFIG.features.textLength) +
            (messageElement.textContent.length > GLOBAL_CONFIG.features.textLength ? '...' : '');
        headerText.textContent = `🤖 ${messageIndex}. ${aiText}`;

        const toggleBtn = document.createElement('span');
        toggleBtn.textContent = '▼';
        toggleBtn.className = 'toggle-btn';

        aiHeader.appendChild(headerText);
        aiHeader.appendChild(toggleBtn);

        // 构建标题层级树
        const headerTree = buildHeaderTree(headers);
        const treeContainer = createTreeStructure(headerTree, 0);
        treeContainer.style.display = GLOBAL_CONFIG.features.autoExpand ? 'block' : 'none';

        // 添加展开/收起功能
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isExpanded = treeContainer.style.display !== 'none';
            treeContainer.style.display = isExpanded ? 'none' : 'block';
            toggleBtn.textContent = isExpanded ? '▶' : '▼';
            toggleBtn.classList.toggle('collapsed', isExpanded);
        };

        // 添加点击跳转功能
        aiHeader.onclick = (e) => {
            e.stopPropagation();
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            highlightElement(messageElement);
        };

        aiContainer.appendChild(aiHeader);
        aiContainer.appendChild(treeContainer);

        return aiContainer;
    }

    // 创建简单的AI消息项
    function createSimpleAIItem(messageElement, messageIndex) {
        const aiItem = document.createElement('div');
        aiItem.className = 'outline-ai-item';

        const aiText = messageElement.textContent.substring(0, GLOBAL_CONFIG.features.textLength) +
            (messageElement.textContent.length > GLOBAL_CONFIG.features.textLength ? '...' : '');
        aiItem.textContent = `🤖 ${messageIndex}. ${aiText}`;

        // 添加点击跳转功能
        aiItem.onclick = () => {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            highlightElement(messageElement);
        };

        return aiItem;
    }

    async function getEleWithRetry(getFunc, args = [], judgeRes = true, maxRetries = 10, retryDelay = 1000) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const res = getFunc(...args);
                if (!judgeRes) return true;
                if (res) {
                    console.log(`成功获取到 chatArea，尝试次数: ${attempt + 1}`);
                    return res;
                }

                if (attempt < maxRetries - 1) {
                    console.log(`第 ${attempt + 1} 次获取 chatArea 失败，${retryDelay}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } catch (error) {
                console.error(`获取 chatArea 时发生错误 (尝试 ${attempt + 1}):`, error);
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        console.error(`经过 ${maxRetries} 次尝试后仍无法获取到 chatArea`);
        return null;
    }

    // 设置 MutationObserver 监听
    function setupMutationObserver(chatArea) {
        // 如果已有观察者，先断开连接
        if (GLOBAL_OBJ.currentObserver) {
            GLOBAL_OBJ.currentObserver.disconnect();
            console.log('已断开原有的 MutationObserver');
        }

        // 创建新的观察者
        const observer = new MutationObserver((mutations) => {
            // 检查是否有实际的内容变化
            let hasContentChange = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // 检查是否有新增或删除的消息节点
                    if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                        hasContentChange = true;
                        break;
                    }
                } else if (mutation.type === 'characterData') {
                    hasContentChange = true;
                    break;
                }
            }

            if (hasContentChange && GLOBAL_OBJ.debouncedRefresh) {
                GLOBAL_OBJ.debouncedRefresh();
            }
        });

        // 开始观察
        observer.observe(chatArea, {
            childList: true,
            subtree: true, // 监听子树变化以捕获消息内容更新
            attributes: false,
            characterData: true // 监听文本内容变化
        });

        // 保存观察者引用
        GLOBAL_OBJ.currentObserver = observer;
        GLOBAL_OBJ.currentChatArea = chatArea;

        console.log('已设置新的 MutationObserver 监听:', chatArea);
        return observer;
    }

    async function init() {
        // 加载保存的设置
        loadSettings();

        // 插入CSS样式
        insertStyles();

        // 创建显示按钮
        createShowButton();

        let platform = judgePlatform();
        if (platform === 'unknown') {
            console.log('不支持的平台');
            return;
        }

        const parserConfig = getParserConfig(platform);
        if (!parserConfig) {
            console.log('无法获取解析配置');
            return;
        }
        GLOBAL_OBJ.parserConfig = parserConfig;
        const timeout = parserConfig.timeout ? parserConfig.timeout : 0;


        // 创建强制刷新函数
        const forceRefresh = () => {
            console.log('执行强制刷新...');

            // 清理所有缓存
            clearAllCache();

            // 强制重新获取chatArea
            const newChatArea = GLOBAL_OBJ.getCachedChatArea(true);
            if (newChatArea) {
                // 重新设置 MutationObserver 监听新的 chatArea
                setupMutationObserver(newChatArea);

                // 立即刷新大纲内容
                refreshOutlineItems(GLOBAL_OBJ.outlineContent, GLOBAL_OBJ.parserConfig.determineMessageOwner);
                console.log('强制刷新完成，已重新监听新的 chatArea');
            } else {
                console.error('强制刷新失败：无法获取到chatArea');
            }
        };

        // 将强制刷新函数设置为全局可访问
        GLOBAL_OBJ.forceRefreshOutline = forceRefresh;

        GLOBAL_OBJ.getCachedChatArea = function (force_refresh = false) {
            // 缓存选择器结果
            if (force_refresh || !this._cachedChatArea) {
                this._cachedChatArea = parserConfig.selectChatArea() || null;
                console.log('get chatArea:', this._cachedChatArea)
            }
            return this._cachedChatArea;
        }

        // 将展开/收起函数设置为全局可访问
        GLOBAL_OBJ.toggleAllNodes = toggleAllNodes;
        setTimeout(async function () {
            const outlineEle = initOutlineEle();

            // 获取大纲内容容器
            const outlineContent = outlineEle.querySelector('#outline-content');

            // 保存到全局对象
            GLOBAL_OBJ.outlineContent = outlineContent;

            // 创建防抖的刷新函数
            const debouncedRefresh = debounce(() => {
                refreshOutlineItems(GLOBAL_OBJ.outlineContent, GLOBAL_OBJ.parserConfig.determineMessageOwner);
            }, GLOBAL_CONFIG.features.debouncedInterval);

            GLOBAL_OBJ.debouncedRefresh = debouncedRefresh;

            try {
                // 插入大纲到页面
                const r = await getEleWithRetry(parserConfig.insertOutline, [outlineEle], false, 5, 1000);
                if (!r) throw new EvalError("多次尝试插入大纲失败")
            }
            catch (e) {
                console.error("大纲插入内容失败，将插入到body并固定在右侧:", e)
                // 当插入失败时，直接插入到body并固定在页面右侧
                insertOutlineToBodyFixed(outlineEle);
            }

            // 使用重试机制获取 chatArea
            console.log('开始获取 chatArea...');
            const chatArea = await getEleWithRetry(parserConfig.selectChatArea);

            if (!chatArea) {
                console.error('经过多次重试后仍未找到聊天区域，脚本初始化失败');
                return;
            }

            console.log('成功定位到 chatArea:', chatArea);
            GLOBAL_OBJ.chatArea = chatArea;

            // 初始化大纲内容
            refreshOutlineItems(outlineContent, parserConfig.determineMessageOwner);

            // 设置 MutationObserver 监听聊天区域变化
            setupMutationObserver(chatArea);

            console.log('对话大纲生成脚本已启动');
        }, timeout)

    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();