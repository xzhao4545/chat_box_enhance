/**
 * 消息缓存辅助函数
 */

/**
 * 生成id
 */
let idCounter = 0;
export function generateUniqueId(): string {
  return `${Date.now()}-${++idCounter}`;
}
