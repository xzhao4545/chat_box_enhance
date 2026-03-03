/**
 * 主模块
 * 负责刷新大纲和处理初始化逻辑
 */

import { MessageOwner, type ParserConfig, type GlobalObj } from '../types';
import { GLOBAL_CONFIG } from '../config';
import { debounce, getMessageId, isMessageCached, cacheMessage, clearAllCache, getEleWithRetry } from '../utils';
import { createUserOutlineItem, createAIOutlineItem } from '../dom/outline';
import { createShowButton, initOutlineEle, toggleOutlineVisibility } from '../dom/init';
import { updateStyleContent, insertStyles } from '../styles';
import { loadSettings, insertOutlineToBodyFixed, getGlobalObj, toggleAllNodes as toggleAllNodesState } from '../config/global';
import { setupMutationObserver } from './observer';
import { judgePlatform, getParserConfig } from '../platform';

/**
 * 刷新大纲项
 * @param outlineBone 大纲容器元素
 * @param determineMessageOwnerFunc 判断消息所有者的函数
 * @param parserConfig 解析器配置
 * @param globalObj 全局对象
 */
export function refreshOutlineItems(
  outlineBone: Element | null,
  determineMessageOwnerFunc: (ele: Element) => MessageOwner,
  parserConfig: ParserConfig,
  globalObj: GlobalObj
): void {
  if (!outlineBone) return;
  
  const chatArea = globalObj.getCachedChatArea();
  if (!chatArea) {
    console.log('无法定位到对话区域');
    return;
  }
  
  const cd = parserConfig.getMessageList(chatArea);
  if (cd == null) {
    console.log("对话区域无效，大纲生成失败,chatArea:", chatArea);
    return;
  }
  const currentMessageCount = cd.length;

  // 如果消息数量没有变化，检查是否需要更新
  if (currentMessageCount === globalObj.lastMessageCount && currentMessageCount > 0) {
    // 检查最后一条消息是否还在变化（可能是AI正在回复）
    const lastMessage = cd[cd.length - 1];
    const lastMessageId = getMessageId(cd.length - 1, lastMessage);

    if (isMessageCached(globalObj.messageCache.length - 1, lastMessage, lastMessageId)) {
      return; // 没有变化，跳过更新
    }
  }
  console.log('刷新大纲,chatArea:', chatArea);

  // 使用文档片段来减少DOM操作
  const fragment = document.createDocumentFragment();
  let messageIndex = 0;
  let hasChanges = false;
  
  // 遍历对话生成大纲
  for (let i = 0; i < cd.length; i++) {
    const c = cd[i];
    const messageId = getMessageId(i, c);

    // 检查是否可以使用缓存
    if (messageIndex < globalObj.messageCache.length) {
      if (isMessageCached(messageIndex, c, messageId)) {
        fragment.append(globalObj.messageCache[messageIndex].outlineElement);
        messageIndex++;
        continue;
      }
    }

    hasChanges = true;
    let outlineElement: Element | null = null;

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
  if (hasChanges || currentMessageCount !== globalObj.lastMessageCount) {
    // 清空并重新填充
    if ('replaceChildren' in outlineBone) {
      (outlineBone as any).replaceChildren();
    } else {
      (outlineBone as HTMLElement).innerHTML = '';
    }
    outlineBone.appendChild(fragment);
  }

  globalObj.lastMessageCount = currentMessageCount;
}

/**
 * 主初始化函数
 */
export async function init(): Promise<void> {
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

  // 创建全局对象
  const globalObj = getGlobalObj();
  globalObj.parserConfig = parserConfig;
  
  const timeout = parserConfig.timeout || 0;

  // 创建强制刷新函数
  const forceRefresh = () => {
    console.log('执行强制刷新...');

    // 清理所有缓存
    clearAllCache();

    // 强制重新获取chatArea
    const newChatArea = globalObj.getCachedChatArea(true);
    if (newChatArea) {
      // 重新设置 MutationObserver 监听新的 chatArea
      setupMutationObserver(newChatArea);

      // 立即刷新大纲内容
      if (globalObj.outlineContent && globalObj.parserConfig) {
        refreshOutlineItems(globalObj.outlineContent, globalObj.parserConfig.determineMessageOwner, globalObj.parserConfig, globalObj);
      }
      console.log('强制刷新完成，已重新监听新的 chatArea');
    } else {
      console.error('强制刷新失败：无法获取到chatArea');
    }
  };

  // 将强制刷新函数设置为全局可访问
  globalObj.forceRefreshOutline = forceRefresh;

  // 将展开/收起函数设置为全局可访问
  const allExpandedRef = { value: true };
  globalObj.toggleAllNodes = () => {
    if (globalObj.outlineContent) {
      toggleAllNodesState(globalObj.outlineContent, allExpandedRef);
    }
  };

  setTimeout(async function () {
    const outlineEle = initOutlineEle();

    // 获取大纲内容容器
    const outlineContent = outlineEle.querySelector('#outline-content');

    // 保存到全局对象
    globalObj.outlineContent = outlineContent;

    // 创建防抖的刷新函数
    const debouncedRefresh = debounce(() => {
      if (globalObj.outlineContent && globalObj.parserConfig) {
        refreshOutlineItems(globalObj.outlineContent, globalObj.parserConfig.determineMessageOwner, globalObj.parserConfig, globalObj);
      }
    }, GLOBAL_CONFIG.features.debouncedInterval);

    globalObj.debouncedRefresh = debouncedRefresh;

    try {
      // 插入大纲到页面
      const r = await getEleWithRetry(parserConfig.insertOutline, [outlineEle], true, 5, 1000);
      if (!r) throw new EvalError("多次尝试插入大纲失败");
    } catch (e) {
      console.error("大纲插入内容失败，将插入到body并固定在右侧:", e);
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
    globalObj._cachedChatArea = chatArea;

    // 初始化大纲内容
    if (outlineContent) {
      refreshOutlineItems(outlineContent, parserConfig.determineMessageOwner, parserConfig, globalObj);
    }

    // 设置 MutationObserver 监听聊天区域变化
    setupMutationObserver(chatArea);

    console.log('对话大纲生成脚本已启动');
  }, timeout);
}

/**
 * 运行脚本
 */
export function run(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
    });
  } else {
    init();
  }
}