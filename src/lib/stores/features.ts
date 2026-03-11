/**
 * 功能配置状态管理
 */

import { writable } from 'svelte/store';
import type { FeaturesConfig } from '../types';
import { createTaggedLogger, setLogLevel } from '../services/logger';

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

const STORAGE_KEY = 'chat-outline-features';
const gmLogger = createTaggedLogger('GM');

function loadFeaturesFromLocalStorage(): FeaturesConfig {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    gmLogger.debug('loadFeaturesFromLocalStorage result', {
      hasSavedFeatures: Boolean(saved),
      storageKey: STORAGE_KEY
    });

    if (!saved) {
      return defaultFeatures;
    }

    return { ...defaultFeatures, ...JSON.parse(saved) as Partial<FeaturesConfig> };
  } catch (error) {
    gmLogger.warn('Failed to load features from localStorage, fallback to default', error);
    return defaultFeatures;
  }
}

function saveFeaturesToLocalStorage(features: FeaturesConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    gmLogger.debug('Features persisted to localStorage', {
      storageKey: STORAGE_KEY,
      logLevel: features.logLevel,
      syncScroll: features.syncScroll
    });
  } catch (error) {
    gmLogger.warn('Failed to persist features to localStorage', error);
  }
}

function getSafeGMGetValue(): typeof GM.getValue | null {
  if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') {
    gmLogger.debug('GM.getValue is available');
    return GM.getValue.bind(GM);
  }

  gmLogger.warn('GM.getValue is unavailable, fallback to default features', {
    href: window.location.href,
    readyState: document.readyState,
    topWindow: window.top === window
  });
  return null;
}

function getSafeGMSetValue(): typeof GM.setValue | null {
  if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') {
    gmLogger.debug('GM.setValue is available');
    return GM.setValue.bind(GM);
  }

  gmLogger.warn('GM.setValue is unavailable, skip persisting features', {
    href: window.location.href,
    readyState: document.readyState,
    topWindow: window.top === window
  });
  return null;
}

/**
 * 从GM存储加载设置
 */
function loadFeaturesFromStorage(): FeaturesConfig {
  const safeGetValue = getSafeGMGetValue();

  if (!safeGetValue) {
    gmLogger.debug('Fallback to localStorage for loading features');
    return loadFeaturesFromLocalStorage();
  }

  try {
    const saved = safeGetValue<FeaturesConfig | null>(STORAGE_KEY, null);
    gmLogger.debug('loadFeaturesFromStorage result', {
      hasSavedFeatures: Boolean(saved),
      storageKey: STORAGE_KEY
    });

    if (!saved) {
      return defaultFeatures;
    }

    return { ...defaultFeatures, ...saved };
  } catch (error) {
    gmLogger.warn('Failed to load features from GM storage, fallback to default', error);
    gmLogger.debug('Fallback to localStorage after GM storage read failure');
    return loadFeaturesFromLocalStorage();
  }
}

/**
 * 保存设置到GM存储
 */
function saveFeaturesToStorage(features: FeaturesConfig): void {
  const safeSetValue = getSafeGMSetValue();

  if (!safeSetValue) {
    gmLogger.debug('Fallback to localStorage for persisting features');
    saveFeaturesToLocalStorage(features);
    return;
  }

  try {
    safeSetValue(STORAGE_KEY, features);
    gmLogger.debug('Features persisted to GM storage', {
      storageKey: STORAGE_KEY,
      logLevel: features.logLevel,
      syncScroll: features.syncScroll
    });
  } catch (error) {
    gmLogger.warn('Failed to persist features to GM storage', error);
    gmLogger.debug('Fallback to localStorage after GM storage write failure');
    saveFeaturesToLocalStorage(features);
  }
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
