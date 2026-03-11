/**
 * MutationObserver服务
 * 负责监听DOM变化并触发大纲刷新
 */

import { get } from 'svelte/store';
import { debounce } from '../utils';
import { featuresStore } from '../stores';
import { logger } from './logger';

let currentObserver: MutationObserver | null = null;
let debouncedRefresh: (() => void) | null = null;

function getMessageHost(node: Node): Element | null {
  if (node instanceof Element) {
    return node.closest('[cbe-message-id]');
  }

  return node.parentElement?.closest('[cbe-message-id]') || null;
}

function hasRelevantMutation(mutations: MutationRecord[]): boolean {
  let lastMessageHost: Element | null = null;

  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
        return true;
      }
      continue;
    }

    if (mutation.type !== 'characterData') {
      continue;
    }

    const messageHost = getMessageHost(mutation.target);
    if (!messageHost) {
      continue;
    }

    if (!lastMessageHost) {
      const messageList = messageHost.parentElement?.querySelectorAll?.('[cbe-message-id]');
      lastMessageHost = messageList && messageList.length > 0
        ? messageList[messageList.length - 1] as Element
        : null;
    }

    if (!lastMessageHost || messageHost === lastMessageHost) {
      return true;
    }
  }

  return false;
}

/**
 * 设置 MutationObserver 监听
 * @param chatArea 要监听的聊天区域元素
 * @param onRefresh 刷新回调函数
 */
function setupMutationObserver(
  chatArea: Element,
  onRefresh: () => void
): MutationObserver {
  // 如果已有观察者，先断开连接
  if (currentObserver) {
    currentObserver.disconnect();
    logger.debug('已断开原有的 MutationObserver');
  }

  // 获取防抖间隔
  const features = get(featuresStore);

  // 创建防抖刷新函数
  debouncedRefresh = debounce(onRefresh, features.debouncedInterval);

  // 创建新的观察者
  const observer = new MutationObserver((mutations) => {
    if (hasRelevantMutation(mutations) && debouncedRefresh) {
      debouncedRefresh();
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
  currentObserver = observer;

  logger.info('已设置新的 MutationObserver 监听:', chatArea);
  return observer;
}

/**
 * 断开当前观察者
 */
function disconnectObserver(): void {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
    logger.debug('已断开 MutationObserver');
  }
}

/**
 * Observer服务对象
 */
export const observerService = {
  setup: setupMutationObserver,
  disconnect: disconnectObserver
};
