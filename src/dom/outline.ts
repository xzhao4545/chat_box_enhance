/**
 * 大纲项创建
 * 负责创建用户消息和AI消息的大纲项
 */

import { MessageOwner } from '../types';
import { GLOBAL_CONFIG } from '../config';
import { buildHeaderTree, createTreeStructure } from './tree';
import { highlightElement } from './highlight';

/**
 * 创建用户消息大纲项
 * @param messageElement 消息元素
 * @param messageIndex 消息索引
 */
export function createUserOutlineItem(messageElement: Element, messageIndex: number): HTMLDivElement {
  const userItem = document.createElement('div');
  userItem.className = 'outline-user-item';

  const textLength = GLOBAL_CONFIG.features.textLength;
  const userText = (messageElement.textContent || '').substring(0, textLength) +
    ((messageElement.textContent || '').length > textLength ? '...' : '');
  userItem.textContent = `👤 ${messageIndex}. ${userText}`;

  // 添加点击跳转功能
  userItem.onclick = () => {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(messageElement);
  };

  return userItem;
}

/**
 * 创建AI消息大纲项
 * @param messageElement 消息元素
 * @param messageIndex 消息索引
 */
export function createAIOutlineItem(messageElement: Element, messageIndex: number): HTMLElement {
  // 检查是否有标题标签
  const headers = messageElement.querySelectorAll('h1, h2, h3, h4, h5, h6');

  if (headers.length > 0) {
    return createAIContainerWithHeaders(messageElement, messageIndex, Array.from(headers));
  } else {
    return createSimpleAIItem(messageElement, messageIndex);
  }
}

/**
 * 创建带标题的AI消息容器
 * @param messageElement 消息元素
 * @param messageIndex 消息索引
 * @param headers 标题元素数组
 */
export function createAIContainerWithHeaders(messageElement: Element, messageIndex: number, headers: Element[]): HTMLDivElement {
  const aiContainer = document.createElement('div');
  aiContainer.className = 'outline-ai-container';

  // 创建AI消息头部
  const aiHeader = document.createElement('div');
  aiHeader.className = 'outline-ai-header';

  const headerText = document.createElement('span');
  const textLength = GLOBAL_CONFIG.features.textLength;
  const aiText = (messageElement.textContent || '').substring(0, textLength) +
    ((messageElement.textContent || '').length > textLength ? '...' : '');
  headerText.textContent = `🤖 ${messageIndex}. ${aiText}`;

  const toggleBtn = document.createElement('span');
  toggleBtn.textContent = '▼';
  toggleBtn.className = 'toggle-btn';

  aiHeader.appendChild(headerText);
  aiHeader.appendChild(toggleBtn);

  // 构建标题层级树
  const headerTree = buildHeaderTree(headers);
  const treeContainer = createTreeStructure(headerTree, 0);
  treeContainer.style.display = GLOBAL_CONFIG.features.autoExpand ? 'block' : 'none';

  // 添加展开/收起功能
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    const isExpanded = treeContainer.style.display !== 'none';
    treeContainer.style.display = isExpanded ? 'none' : 'block';
    toggleBtn.textContent = isExpanded ? '▶' : '▼';
    toggleBtn.classList.toggle('collapsed', isExpanded);
  };

  // 添加点击跳转功能
  aiHeader.onclick = (e) => {
    e.stopPropagation();
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(messageElement);
  };

  aiContainer.appendChild(aiHeader);
  aiContainer.appendChild(treeContainer);

  return aiContainer;
}

/**
 * 创建简单的AI消息项
 * @param messageElement 消息元素
 * @param messageIndex 消息索引
 */
export function createSimpleAIItem(messageElement: Element, messageIndex: number): HTMLDivElement {
  const aiItem = document.createElement('div');
  aiItem.className = 'outline-ai-item';

  const textLength = GLOBAL_CONFIG.features.textLength;
  const aiText = (messageElement.textContent || '').substring(0, textLength) +
    ((messageElement.textContent || '').length > textLength ? '...' : '');
  aiItem.textContent = `🤖 ${messageIndex}. ${aiText}`;

  // 添加点击跳转功能
  aiItem.onclick = () => {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(messageElement);
  };

  return aiItem;
}
