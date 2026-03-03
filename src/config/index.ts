/**
 * 全局配置入口
 */

export * from './types';
export * from './theme';
export * from './features';
export * from './global';

import type { GlobalConfig } from './types';
import { THEME_CONFIG } from './theme';
import { FEATURES_CONFIG } from './features';

/**
 * 全局配置实例
 */
export const GLOBAL_CONFIG: GlobalConfig = {
  theme: THEME_CONFIG,
  features: FEATURES_CONFIG,
  text: {
    title: "对话大纲"
  }
};
