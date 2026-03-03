/**
 * 主题状态管理
 */

import { writable, derived, get } from 'svelte/store';
import type { ThemeConfig, ThemeColors } from '../types';

/**
 * 默认主题配置
 */
const defaultThemeConfig: ThemeConfig = {
  highlightColor: '#83daff2a',
  highlightTime: 2000,
  currentTheme: 'light',
  colors: {
    light: {
      primary: '#28a745',
      user: '#007acc',
      background: '#ffffff',
      border: '#ddd',
      shadow: 'rgba(0,0,0,0.15)',
      text: '#333',
      headerBg: '#ffffff',
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
  sizes: {
    outlineWidth: '300px',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '14px',
    indentSize: 15
  }
};

/**
 * 从localStorage加载主题设置
 */
function loadThemeFromStorage(): 'light' | 'dark' {
  const saved = localStorage.getItem('chat-outline-theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return 'light';
}

/**
 * 主题Store
 */
export const themeStore = writable<ThemeConfig>({
  ...defaultThemeConfig,
  currentTheme: loadThemeFromStorage()
});

/**
 * 当前颜色派生Store
 */
export const currentColors = derived(themeStore, ($theme) => {
  return $theme.colors[$theme.currentTheme];
});

/**
 * 切换主题
 */
export function toggleTheme(): void {
  themeStore.update(theme => {
    const newTheme = theme.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('chat-outline-theme', newTheme);
    return { ...theme, currentTheme: newTheme };
  });
}

/**
 * 获取当前颜色
 */
export function getCurrentColors(): ThemeColors {
  const theme = get(themeStore);
  return theme.colors[theme.currentTheme];
}