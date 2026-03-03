/**
 * 树形结构管理
 * 负责构建标题层级树和创建可展开收起的树形DOM结构
 */

import { HeaderTreeNode } from '../types';
import { GLOBAL_CONFIG } from '../config';
import { highlightElement } from './highlight';

/**
 * 构建标题层级树结构
 * @param headers HTML标题元素数组
 */
export function buildHeaderTree(headers: Element[]): HeaderTreeNode[] {
  const tree: HeaderTreeNode[] = [];
  const stack: HeaderTreeNode[] = [];

  headers.forEach(header => {
    const tagName = header.tagName;
    const level = parseInt(tagName.charAt(1)); // h1->1, h2->2, etc.
    
    const node: HeaderTreeNode = {
      element: header,
      level: level,
      text: header.textContent || '',
      children: []
    };

    // 找到合适的父节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return tree;
}

/**
 * 创建可展开收起的树形结构DOM元素
 * @param nodes 树节点数组
 * @param depth 当前深度
 */
export function createTreeStructure(nodes: HeaderTreeNode[], depth: number): HTMLDivElement {
  const container = document.createElement('div');
  container.style.marginLeft = `${depth * GLOBAL_CONFIG.theme.sizes.indentSize}px`;

  nodes.forEach(node => {
    const nodeWrapper = document.createElement('div');

    const nodeElement = document.createElement('div');
    nodeElement.className = `tree-node tree-node-level-${Math.min(depth, 3)} header-level-${node.level}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = node.text;

    nodeElement.appendChild(textSpan);

    // 如果有子节点，添加展开/收起按钮
    if (node.children.length > 0) {
      const toggleBtn = document.createElement('span');
      toggleBtn.textContent = '▼';
      toggleBtn.className = 'toggle-btn';
      nodeElement.appendChild(toggleBtn);

      // 创建子节点容器
      const childContainer = createTreeStructure(node.children, depth + 1);
      childContainer.style.display = GLOBAL_CONFIG.features.autoExpand ? 'block' : 'none';

      // 添加展开/收起功能
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isExpanded = childContainer.style.display !== 'none';
        childContainer.style.display = isExpanded ? 'none' : 'block';
        toggleBtn.textContent = isExpanded ? '▶' : '▼';
        toggleBtn.classList.toggle('collapsed', isExpanded);
      };

      nodeWrapper.appendChild(childContainer);
    }

    // 添加点击跳转功能（点击文本部分）
    nodeElement.onclick = (e) => {
      e.stopPropagation();
      node.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      highlightElement(node.element);
    };

    nodeWrapper.insertBefore(nodeElement, nodeWrapper.firstChild);
    container.appendChild(nodeWrapper);
  });

  return container;
}
