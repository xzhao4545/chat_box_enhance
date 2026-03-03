/**
 * 配置相关类型定义
 */

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  primary: string;
  user: string;
  background: string;
  border: string;
  shadow: string;
  text: string;
  headerBg: string;
  headers: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
  };
}

/**
 * 主题尺寸配置
 */
export interface ThemeSizes {
  outlineWidth: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  indentSize: number;
}

/**
 * 主题配置
 */
export interface ThemeConfig {
  highlightColor: string;
  highlightTime: number;
  currentTheme: 'light' | 'dark';
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  sizes: ThemeSizes;
}

/**
 * 功能配置
 */
export interface FeaturesConfig {
  autoExpand: boolean;
  showUserMessages: boolean;
  showAIMessages: boolean;
  enableAnimation: boolean;
  isVisible: boolean;
  textLength: number;
  debouncedInterval: number;
}

/**
 * 文本配置
 */
export interface TextConfig {
  title: string;
}

/**
 * 全局配置接口
 */
export interface GlobalConfig {
  theme: ThemeConfig;
  features: FeaturesConfig;
  text: TextConfig;
}