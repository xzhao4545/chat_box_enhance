/**
 * 全局状态管理
 * 存储运行时需要全局访问的变量和函数
 */

import { GlobalObj } from "../types";
import { GLOBAL_CONFIG } from "../config";


const globalObj:GlobalObj={
    // 缓存相关变量
    messageCache: [],
    lastMessageCount: 0,
    MAX_CACHE_SIZE: 100, // 最大缓存条目数
    idLength: 10,

    getCachedChatArea(force_refresh = false): Element | null {
      // 缓存选择器结果
      if (force_refresh || !this._cachedChatArea) {
        this._cachedChatArea = this.parserConfig?.selectChatArea() || null;
        console.log("get chatArea:", this._cachedChatArea);
      }
      return this._cachedChatArea;
    },

    // 运行时对象
    currentObserver: null,
    currentChatArea: null,
    outlineContent: null,
    parserConfig: null,
    debouncedRefresh: null,

    // 内部缓存
    _cachedChatArea: null,

    // 展开/收起状态
    allExpanded: true, // 默认展开状态

    // 强制刷新函数
    forceRefreshOutline: null,
    toggleAllNodes: null,
  };

/**
 * 创建全局对象
 */
export function getGlobalObj(): GlobalObj {
  return globalObj;
}

/**
 * 展开或收起所有节点
 * @param outlineContent 大纲内容容器
 * @param allExpandedRef 展开状态的引用
 */
export function toggleAllNodes(
  outlineContent: Element | null,
  allExpandedRef: { value: boolean },
): void {
  if (!outlineContent) {
    console.log("大纲内容容器不存在");
    return;
  }

  const newState = !allExpandedRef.value;
  allExpandedRef.value = newState;

  // 查找所有的切换按钮和对应的容器
  const toggleButtons = outlineContent.querySelectorAll(".toggle-btn");

  // 处理AI消息容器的展开/收起
  toggleButtons.forEach((btn) => {
    const container = (btn as HTMLElement).parentElement?.nextElementSibling;
    if (container && container instanceof HTMLElement) {
      container.style.display = newState ? "block" : "none";
      btn.textContent = newState ? "▼" : "▶";
      btn.classList.toggle("collapsed", !newState);
    }
  });

  // 处理树形结构的展开/收起
  const treeNodes = outlineContent.querySelectorAll(".tree-node");
  treeNodes.forEach((node) => {
    const toggleBtn = (node as HTMLElement).querySelector(".toggle-btn");
    if (toggleBtn) {
      const nodeWrapper = (toggleBtn as HTMLElement).parentElement
        ?.parentElement;
      const childContainer = nodeWrapper?.querySelector("div:last-child");
      if (
        childContainer &&
        childContainer instanceof HTMLElement &&
        childContainer !== node
      ) {
        childContainer.style.display = newState ? "block" : "none";
        toggleBtn.textContent = newState ? "▼" : "▶";
        toggleBtn.classList.toggle("collapsed", !newState);
      }
    }
  });

  console.log(`已${newState ? "展开" : "收起"}所有节点`);
}

/**
 * 从localStorage加载设置
 */
export function loadSettings(): void {
  const savedTheme = localStorage.getItem("chat-outline-theme");
  if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
    GLOBAL_CONFIG.theme.currentTheme = savedTheme;
  }

  const savedVisible = localStorage.getItem("chat-outline-visible");
  if (savedVisible !== null) {
    GLOBAL_CONFIG.features.isVisible = savedVisible === "true";
  }
}

/**
 * 当大纲插入失败时，将其插入到body并固定在页面右侧
 * @param outlineEle 大纲元素
 */
export function insertOutlineToBodyFixed(outlineEle: Element): void {
  // 添加固定定位的样式类
  outlineEle.classList.add("outline-fixed-right");

  // 插入到body
  document.body.appendChild(outlineEle);
}
