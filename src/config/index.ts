/**
 * 全局配置
 * 包含主题配置、功能配置和文本配置
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

/**
 * 全局配置实例
 */
export const GLOBAL_CONFIG: GlobalConfig = {
  // 主题配置
  theme: {
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
  },

  // 功能配置
  features: {
    autoExpand: true,
    showUserMessages: true,
    showAIMessages: true,
    enableAnimation: true,
    isVisible: true, // 大纲是否可见
    textLength: 50,  //大纲展示的字符数
    debouncedInterval: 500  //大纲更新间隔
  },
  text: {
    title: "对话大纲"
  }
};

/**
 * 获取当前主题颜色
 */
export function getCurrentColors(): ThemeColors {
  return GLOBAL_CONFIG.theme.colors[GLOBAL_CONFIG.theme.currentTheme];
}
