/**
 * 样式管理
 * 负责插入和更新CSS样式
 */

import { GLOBAL_CONFIG, getCurrentColors } from '../config';

/**
 * 样式元素的ID
 */
const STYLE_ID = 'chat-outline-styles';

/**
 * 插入CSS样式到页面
 */
export function insertStyles(): void {
  if (document.getElementById(STYLE_ID)) return; // 避免重复插入

  const style = document.createElement('style');
  style.id = STYLE_ID;
  updateStyleContent(style);

  document.head.appendChild(style);
}

/**
 * 更新样式内容
 * @param style style元素
 */
export function updateStyleContent(style: HTMLStyleElement): void {
  const colors = getCurrentColors();
  const config = GLOBAL_CONFIG;

  style.textContent = `
    /* 大纲容器样式 */
    #chat-outline {
      width: ${config.theme.sizes.outlineWidth};
      background: ${colors.background};
      border-radius: ${config.theme.sizes.borderRadius};
      padding: 0;
      box-shadow: 0 4px 12px ${colors.shadow};
      font-size: ${config.theme.sizes.fontSize};
      transition: all 0.3s ease;
      display: ${config.features.isVisible ? 'block' : 'none'};
      height: 100dvh;
    }
    
    /* 固定在右侧的大纲样式 */
    #chat-outline.outline-fixed-right {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 10000;
      height: 100vh;
      border-radius: ${config.theme.sizes.borderRadius} 0 0 ${config.theme.sizes.borderRadius};
      border-right: none;
      box-shadow: -4px 0 12px ${colors.shadow};
    }
    
    /* 大纲头部样式 */
    .chat-outline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-left: 15px;
      border-bottom: 1px solid ${colors.border};
      background: ${colors.headerBg};
      border-radius: ${config.theme.sizes.borderRadius} ${config.theme.sizes.borderRadius} 0 0;
      height: 10%;
    }
    
    /* 大纲标题样式 */
    .chat-outline-title {
      margin: 0;
      color: ${colors.text};
      font-size: 16px;
      font-weight: bold;
    }
    
    /* 控制按钮容器 */
    .outline-controls {
      display: flex;
      gap: 8px;
    }
    
    /* 控制按钮样式 */
    .outline-btn {
      background: none;
      border: 1px solid ${colors.border};
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
      color: ${colors.text};
      transition: all 0.2s ease;
    }
    
    .outline-btn:hover {
      background: ${colors.border};
      transform: scale(1.05);
    }
    
    #outline-content {
      overflow-y: auto;
      height: 90%;
    }
    
    /* 用户消息项样式 */
    .outline-user-item {
      margin: 8px 15px;
      padding: 8px;
      background: ${config.theme.currentTheme === 'light' ? '#f0f8ff' : '#3a3a3a'};
      border-left: 3px solid ${colors.user};
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      color: ${colors.text};
    }
    
    .outline-user-item:hover {
      background: ${config.theme.currentTheme === 'light' ? '#e6f3ff' : '#4a4a4a'};
    }
    
    /* AI消息容器样式 */
    .outline-ai-container {
      margin: 8px 15px;
      border-left: 3px solid ${colors.primary};
      border-radius: 4px;
      background: ${config.theme.currentTheme === 'light' ? '#f8f8f8' : '#3a3a3a'};
    }
    
    /* AI消息头部样式 */
    .outline-ai-header {
      padding: 8px;
      cursor: pointer;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
      color: ${colors.text};
    }
    
    .outline-ai-header:hover {
      background: ${config.theme.currentTheme === 'light' ? '#f0f0f0' : '#4a4a4a'};
    }
    
    /* AI消息简单项样式 */
    .outline-ai-item {
      margin: 8px 15px;
      padding: 8px;
      background: ${config.theme.currentTheme === 'light' ? '#f8f8f8' : '#3a3a3a'};
      border-left: 3px solid ${colors.primary};
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
      color: ${colors.text};
    }
    
    .outline-ai-item:hover {
      background: ${config.theme.currentTheme === 'light' ? '#f0f0f0' : '#4a4a4a'};
    }
    
    /* 树形节点样式 */
    .tree-node {
      margin: 4px 0;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
      color: ${colors.text};
    }
    
    .tree-node:hover {
      background: ${config.theme.currentTheme === 'light' ? '#e9ecef' : '#4a4a4a'} !important;
    }
    
    .tree-node-level-0 {
      background: ${config.theme.currentTheme === 'light' ? '#e9ecef' : '#404040'};
      font-size: 14px;
    }
    
    .tree-node-level-1 {
      background: ${config.theme.currentTheme === 'light' ? '#f1f3f4' : '#383838'};
      font-size: 13px;
    }
    
    .tree-node-level-2 {
      background: ${config.theme.currentTheme === 'light' ? '#f8f9fa' : '#353535'};
      font-size: 12px;
    }
    
    .tree-node-level-3 {
      background: ${config.theme.currentTheme === 'light' ? '#f8f9fa' : '#353535'};
      font-size: 11px;
    }
    
    /* 切换按钮样式 */
    .toggle-btn {
      font-size: 14px;
      transition: transform 0.2s;
      cursor: pointer;
      margin-left: 8px;
      user-select: none;
      color: ${colors.text};
      padding: 4px;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      min-height: 20px;
      line-height: 1;
    }
    
    .toggle-btn:hover {
      background-color: ${colors.border};
      transform: scale(1.1);
    }
    
    .toggle-btn.collapsed {
      transform: rotate(-90deg);
    }
    
    .toggle-btn.collapsed:hover {
      background-color: ${colors.border};
      transform: rotate(-90deg) scale(1.1);
    }
    
    /* 标题级别边框颜色 */
    .header-level-1 { border-left: 2px solid ${colors.headers.h1}; }
    .header-level-2 { border-left: 2px solid ${colors.headers.h2}; }
    .header-level-3 { border-left: 2px solid ${colors.headers.h3}; }
    .header-level-4 { border-left: 2px solid ${colors.headers.h4}; }
    .header-level-5 { border-left: 2px solid ${colors.headers.h5}; }
    .header-level-6 { border-left: 2px solid ${colors.headers.h6}; }
    
    /* 动画效果 */
    .highlight-animation {
      animation: highlight 0.5s ease-in-out;
    }
    
    @keyframes highlight {
      0% { background-color: transparent; }
      50% { background-color: ${config.theme.highlightColor}; }
      100% { background-color: transparent; }
    }
    
    /* 性能优化：使用 transform 和 opacity 进行动画 */
    .tree-node, .outline-user-item, .outline-ai-item, .outline-ai-header {
      will-change: transform;
      backface-visibility: hidden;
    }
    
    /* 显示按钮样式 */
    #show-outline-btn {
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 16px;
      color: ${colors.text};
      box-shadow: 0 2px 8px ${colors.shadow};
      transition: all 0.3s ease;
      z-index: 9999;
      display: ${config.features.isVisible ? 'none' : 'flex'};
      align-items: center;
      justify-content: center;
    }
    
    #show-outline-btn:hover {
      background: ${colors.border};
      transform: translateY(-50%) scale(1.1);
    }
  `;
}
