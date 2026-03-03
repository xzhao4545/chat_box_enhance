/**
 * 高亮效果
 * 负责元素高亮显示功能
 */

import { GLOBAL_CONFIG } from '../config';

/**
 * 高亮元素
 * @param element 要高亮的元素
 */
export function highlightElement(element: Element): void {
  // 移除可能存在的高亮类
  element.classList.remove('highlight-animation');

  // 强制重排以确保类被移除
  (element as HTMLElement).offsetHeight;

  // 添加高亮类
  element.classList.add('highlight-animation');

  // 在动画结束后移除类
  setTimeout(() => {
    element.classList.remove('highlight-animation');
  }, GLOBAL_CONFIG.theme.highlightTime);
}
