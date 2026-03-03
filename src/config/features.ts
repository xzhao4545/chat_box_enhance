/**
 * 功能配置
 */
import type { FeaturesConfig } from './types';

/**
 * 功能配置实例
 */
export const FEATURES_CONFIG: FeaturesConfig = {
  autoExpand: true,
  showUserMessages: true,
  showAIMessages: true,
  enableAnimation: true,
  isVisible: true,       // 大纲是否可见
  textLength: 50,        // 大纲展示的字符数
  debouncedInterval: 500 // 大纲更新间隔
};