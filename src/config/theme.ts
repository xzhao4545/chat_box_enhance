/**
 * 主题配置
 */

import type { ThemeConfig, ThemeColors } from './types';

/**
 * 主题配置实例
 */
export const THEME_CONFIG: ThemeConfig = {
  // 高亮配置
  highlightColor: '#83daff2a',
  highlightTime: 2000,

  // 当前主题模式
  currentTheme: 'light', // 'light' 或 'dark'

  // 颜色配置
  colors: {
    light: {
      primary: '#28a745',
      user: '#007acc',
      background: '#ffffff',
      border: '#ddd',
      shadow: 'rgba(0,0,0,0.15)',
      text: '#333',
      headerBg: '#ffffff',

      // 标题级别颜色
      headers: {
        h1: '#dc3545',
        h2: '#fd7e14',
        h3: '#ffc107',
        h4: '#28a745',
        h5: '#17a2b8',
        h6: '#6f42c1'
      }
    },
    dark: {
      primary: '#4caf50',
      user: '#64b5f6',
      background: '#2d2d2d',
      border: '#555',
      shadow: 'rgba(0,0,0,0.3)',
      text: '#e0e0e0',
      headerBg: '#2d2d2d',

      // 标题级别颜色
      headers: {
        h1: '#f48fb1',
        h2: '#ffab91',
        h3: '#fff176',
        h4: '#81c784',
        h5: '#4dd0e1',
        h6: '#b39ddb'
      }
    }
  },

  // 尺寸配置
  sizes: {
    outlineWidth: '300px',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '14px',
    indentSize: 15
  }
};

/**
 * 获取当前主题颜色
 */
export function getCurrentColors(): ThemeColors {
  return THEME_CONFIG.colors[THEME_CONFIG.currentTheme];
}