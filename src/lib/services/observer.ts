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

    if (hasContentChange && debouncedRefresh) {
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
