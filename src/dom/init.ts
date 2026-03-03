/**
 * 大纲元素初始化
 * 负责创建大纲容器和显示按钮
 */

import { GLOBAL_CONFIG } from '../config';
import { GlobalObj } from '../types';
import { updateStyleContent } from '../styles';
import { getGlobalObj } from '../state';

/**
 * 全局对象引用（将在main模块中设置）
 */
let globalObjRef: GlobalObj = getGlobalObj();

/**
 * 初始化大纲元素
 */
export function initOutlineEle(): HTMLDivElement {
  const outlineEle = document.createElement('div');
  outlineEle.id = 'chat-outline';

  // 创建头部容器
  const header = document.createElement('div');
  header.className = 'chat-outline-header';

  // 添加标题
  const title = document.createElement('h3');
  title.textContent = GLOBAL_CONFIG.text.title;
  title.className = 'chat-outline-title';
  header.appendChild(title);

  // 创建控制按钮容器
  const controls = document.createElement('div');
  controls.className = 'outline-controls';

  // 刷新按钮
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'outline-btn';
  refreshBtn.innerHTML = '🔄';
  refreshBtn.title = '强制刷新大纲';
  refreshBtn.onclick = () => {
    // 触发强制刷新
    if (globalObjRef?.forceRefreshOutline) {
      globalObjRef.forceRefreshOutline();
    }
  };

  // 展开/收起所有节点按钮
  const toggleAllBtn = document.createElement('button');
  toggleAllBtn.className = 'outline-btn';
  toggleAllBtn.innerHTML = '📂';
  toggleAllBtn.title = '展开/收起所有节点';
  toggleAllBtn.onclick = () => {
    if (globalObjRef?.toggleAllNodes) {
      globalObjRef.toggleAllNodes();
      // 更新按钮图标
      toggleAllBtn.innerHTML = globalObjRef.allExpanded ? '📂' : '📁';
      toggleAllBtn.title = globalObjRef.allExpanded ? '收起所有节点' : '展开所有节点';
    }
  };

  // 主题切换按钮
  const themeBtn = document.createElement('button');
  themeBtn.className = 'outline-btn';
  themeBtn.innerHTML = GLOBAL_CONFIG.theme.currentTheme === 'light' ? '🌙' : '☀️';
  themeBtn.title = '切换主题';
  themeBtn.onclick = () => {
    toggleTheme();
    themeBtn.innerHTML = GLOBAL_CONFIG.theme.currentTheme === 'light' ? '🌙' : '☀️';
  };

  // 隐藏按钮
  const hideBtn = document.createElement('button');
  hideBtn.className = 'outline-btn';
  hideBtn.innerHTML = '✕';
  hideBtn.title = '隐藏大纲';
  hideBtn.onclick = toggleOutlineVisibility;

  controls.appendChild(refreshBtn);
  controls.appendChild(toggleAllBtn);
  controls.appendChild(themeBtn);
  controls.appendChild(hideBtn);
  header.appendChild(controls);

  outlineEle.appendChild(header);

  // 创建大纲内容容器
  const outlineContent = document.createElement('div');
  outlineContent.id = 'outline-content';
  outlineEle.appendChild(outlineContent);

  return outlineEle;
}

/**
 * 切换主题
 */
function toggleTheme(): void {
  GLOBAL_CONFIG.theme.currentTheme = GLOBAL_CONFIG.theme.currentTheme === 'light' ? 'dark' : 'light';

  // 更新样式
  const style = document.getElementById('chat-outline-styles') as HTMLStyleElement | null;
  if (style) {
    updateStyleContent(style);
  }

  // 保存主题设置到localStorage
  localStorage.setItem('chat-outline-theme', GLOBAL_CONFIG.theme.currentTheme);
}

/**
 * 切换大纲可见性
 */
export function toggleOutlineVisibility(): void {
  GLOBAL_CONFIG.features.isVisible = !GLOBAL_CONFIG.features.isVisible;

  const outlineEle = document.getElementById('chat-outline');
  const showBtn = document.getElementById('show-outline-btn');

  if (outlineEle) {
    outlineEle.style.display = GLOBAL_CONFIG.features.isVisible ? 'block' : 'none';
  }

  if (showBtn) {
    showBtn.style.display = GLOBAL_CONFIG.features.isVisible ? 'none' : 'flex';
  }

  // 保存可见性设置到localStorage
  localStorage.setItem('chat-outline-visible', String(GLOBAL_CONFIG.features.isVisible));
}

/**
 * 创建显示按钮
 */
export function createShowButton(): void {
  // 检查是否已存在显示按钮
  if (document.getElementById('show-outline-btn')) {
    return;
  }

  const showBtn = document.createElement('button');
  showBtn.id = 'show-outline-btn';
  showBtn.innerHTML = '📋';
  showBtn.title = '显示对话大纲';
  showBtn.onclick = toggleOutlineVisibility;

  document.body.appendChild(showBtn);
}
