/**
 * MutationObserver管理
 * 负责监听DOM变化并触发大纲刷新
 */

import { GlobalObj } from '../types';
import { getGlobalObj } from '../state';

/**
 * 全局对象引用（将在main模块中设置）
 */
let globalObjRef: GlobalObj = getGlobalObj();

/**
 * 设置 MutationObserver 监听
 * @param chatArea 要监听的聊天区域元素
 */
export function setupMutationObserver(chatArea: Element): MutationObserver {
  // 如果已有观察者，先断开连接
  if (globalObjRef.currentObserver) {
    globalObjRef.currentObserver.disconnect();
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

    if (hasContentChange && globalObjRef.debouncedRefresh) {
      globalObjRef.debouncedRefresh();
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
  if (globalObjRef) {
    globalObjRef.currentObserver = observer;
    globalObjRef.currentChatArea = chatArea;
  }

  console.log('已设置新的 MutationObserver 监听:', chatArea);
  return observer;
}
