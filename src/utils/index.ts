/**
 * 工具函数
 * 包含防抖、缓存、消息ID生成、重试等工具函数
 */

import { CachedMessage, GlobalObj } from '../types';
import { getGlobalObj } from '../state';

/**
 * 全局状态对象
 * 这是一个引用，将在state模块中初始化
 */
let globalObjRef: GlobalObj = getGlobalObj();

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 获取消息的唯一标识
 * @param index 消息索引
 * @param messageElement 消息元素
 */
export function getMessageId(index: number, messageElement: Element): string {
  const text = messageElement.textContent || '';
  const idLength = globalObjRef.idLength || 10;
  
  // 获取消息唯一标识
  if (text.length <= idLength * 2) {
    return index + text;
  }
  return index + text.substring(0, idLength) + text.substring(text.length - idLength, text.length);
}

/**
 * 检查消息是否已缓存且未变化
 * @param index 消息索引
 * @param messageElement 消息元素
 * @param messageId 消息ID
 */
export function isMessageCached(index: number, messageElement: Element, messageId: string): boolean {
  if (!globalObjRef || !globalObjRef.messageCache[index]) {
    return false;
  }

  if (globalObjRef.messageCache[index].messageId !== messageId) {
    return false;
  }

  const cached = globalObjRef.messageCache[index];
  // 简单检查内容长度是否变化（适用于正在生成的消息）
  return cached.originalElement === messageElement && cached.textLength === messageElement.textContent.length;
}

/**
 * 缓存消息信息
 * @param messageElement 消息元素
 * @param messageId 消息ID
 * @param outlineElement 大纲元素
 */
export function cacheMessage(messageElement: Element, messageId: string, outlineElement: Element): void {
  if (!globalObjRef) return;
  
  globalObjRef.messageCache.push({
    messageId: messageId,
    textLength: messageElement.textContent.length,
    outlineElement: outlineElement, //保存大纲元素的引用
    originalElement: messageElement, // 保存原始消息元素的引用
    timestamp: Date.now()
  });
}

/**
 * 强制清理所有缓存
 */
export function clearAllCache(): void {
  if (!globalObjRef) return;
  
  globalObjRef.messageCache = [];
  globalObjRef.lastMessageCount = 0;
  console.log('已清理所有缓存');
}

/**
 * 带重试机制的获取元素函数
 * @param getFunc 获取元素的函数
 * @param args 函数参数
 * @param judgeRes 是否判断结果
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试间隔（毫秒）
 */
export async function getEleWithRetry<T>(
  getFunc: (...args: any[]) => T,
  args: any[] = [],
  judgeRes: boolean = true,
  maxRetries: number = 10,
  retryDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = getFunc(...args);
      if (!judgeRes) return true as any;
      if (res) {
        console.log(`调用 ${getFunc.name} 获取目标成功，尝试次数: ${attempt + 1}`);
        return res;
      }

      if (attempt < maxRetries - 1) {
        console.log(`第 ${attempt + 1} 次调用 ${getFunc.name} 获取目标失败，${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.error(`调用 ${getFunc.name} 获取目标时发生错误 (尝试 ${attempt + 1}):`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(`经过 ${maxRetries} 次尝试后仍无法获取到 chatArea`);
  return null;
}
