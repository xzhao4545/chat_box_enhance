/**
 * 重试机制
 */

import { logger } from '../services/logger';

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
        logger.info(`调用 ${getFunc.name} 获取目标成功，尝试次数: ${attempt + 1}`);
        return res;
      }

      if (attempt < maxRetries - 1) {
        logger.debug(`第 ${attempt + 1} 次调用 ${getFunc.name} 获取目标失败，${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      logger.error(`调用 ${getFunc.name} 获取目标时发生错误 (尝试 ${attempt + 1}):`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  logger.error(`经过 ${maxRetries} 次尝试后仍无法获取到目标`);
  return null;
}