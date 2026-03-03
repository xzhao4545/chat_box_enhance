/**
 * 功能配置状态管理
 */

import { writable, get } from 'svelte/store';
import type { FeaturesConfig } from '../types';

/**
 * 默认功能配置
 */
const defaultFeatures: FeaturesConfig = {
  autoExpand: true,
  showUserMessages: true,
  showAIMessages: true,
  enableAnimation: true,
  isVisible: true,
  textLength: 50,
  debouncedInterval: 500
};

/**
 * 从localStorage加载可见性设置
 */
function loadVisibilityFromStorage(): boolean {
  const saved = localStorage.getItem('chat-outline-visible');
  return saved !== 'false'; // 默认可见，只有明确设为false才隐藏
}

/**
 * 功能配置Store
 */
export const featuresStore = writable<FeaturesConfig>({
  ...defaultFeatures,
  isVisible: loadVisibilityFromStorage()
});

/**
 * 切换可见性
 */
export function toggleVisibility(): void {
  featuresStore.update(features => {
    const newVisibility = !features.isVisible;
    localStorage.setItem('chat-outline-visible', String(newVisibility));
    return { ...features, isVisible: newVisibility };
  });
}

/**
 * 全局展开状态
 */
export const allExpandedStore = writable<boolean>(true);

/**
 * 切换全部展开/收起
 */
export function toggleAllExpanded(): void {
  allExpandedStore.update(expanded => !expanded);
}