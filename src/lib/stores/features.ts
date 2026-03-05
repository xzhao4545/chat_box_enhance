/**
 * 功能配置状态管理
 */

import { writable } from 'svelte/store';
import type { FeaturesConfig } from '../types';
import { GM_getValue, GM_setValue } from '$';
import { setLogLevel } from '../services/logger';

/**
 * 默认功能配置
 */
const defaultFeatures: FeaturesConfig = {
  autoExpand: true,
  showUserMessages: true,
  showAIMessages: true,
  isVisible: true,
  textLength: 50,
  debouncedInterval: 500,
  syncScroll: true,
  logLevel: 'info'
};

/**
 * 从GM存储加载设置
 */
function loadFeaturesFromStorage(): FeaturesConfig {
  const saved = GM_getValue<FeaturesConfig | null>('chat-outline-features', null);
  if (!saved) return defaultFeatures;
  return { ...defaultFeatures, ...saved };
}

/**
 * 保存设置到GM存储
 */
function saveFeaturesToStorage(features: FeaturesConfig): void {
  GM_setValue('chat-outline-features', features);
}

/**
 * 功能配置Store
 */
export const featuresStore = writable<FeaturesConfig>(loadFeaturesFromStorage());

// 自动保存到GM存储并同步日志级别
featuresStore.subscribe(features => {
  saveFeaturesToStorage(features);
  setLogLevel(features.logLevel);
});

/**
 * 切换可见性
 */
export function toggleVisibility(): void {
  featuresStore.update(features => ({
    ...features,
    isVisible: !features.isVisible
  }));
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

/**
 * 切换滚动同步
 */
export function toggleSyncScroll(): void {
  featuresStore.update(features => ({
    ...features,
    syncScroll: !features.syncScroll
  }));
}