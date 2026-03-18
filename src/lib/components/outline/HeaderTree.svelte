<script lang="ts">
  import type { HeaderTreeNode } from '../../types';
  import { highlightElement } from '../../utils';
  import { scrollSyncService } from '../../services/scrollSyncService';
  // 自导入用于递归渲染（Svelte 5 推荐方式）
  import HeaderTree from './HeaderTree.svelte';

  interface Props {
    nodes: HeaderTreeNode[];
    depth?: number;
    allExpanded?: boolean;
    onContextMenu?: (e: MouseEvent, context: {
      outlineItemType: 'message' | 'header';
      messageIndex: number;
      messageText: string;
      messageHash: string;
      headerPath?: string;
      headerText?: string;
    }) => void;
    parentMessageIndex?: number;
    parentMessageText?: string;
    parentMessageHash?: string;
    currentPath?: string; // 当前标题路径
    headerBookmarks?: Set<string>; // 该消息下有书签的标题路径
  }

  let { 
    nodes, 
    depth = 0, 
    allExpanded = true, 
    onContextMenu, 
    parentMessageIndex = 0,
    parentMessageText = '',
    parentMessageHash = '',
    currentPath = '',
    headerBookmarks = new Set<string>()
  }: Props = $props();

  // 展开状态
  let expandedStates = $state<Record<string, boolean>>({});

  // 初始化展开状态
  $effect(() => {
    if (allExpanded !== undefined) {
      nodes.forEach((node) => {
        if (expandedStates[node.id] !== allExpanded) {
          expandedStates[node.id] = allExpanded;
        }
      });
    }
  });

  function toggleExpand(nodeId: string, e: Event) {
    e.stopPropagation();
    expandedStates[nodeId] = !expandedStates[nodeId];
  }

  function scrollToElement(element: Element, e: Event) {
    e.stopPropagation();
    scrollSyncService.focusOutlineElement(e.currentTarget as Element);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(element);
  }

  function handleContextMenu(e: MouseEvent, node: HeaderTreeNode, nodePath: string) {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, {
        outlineItemType: 'header',
        messageIndex: parentMessageIndex,
        messageText: parentMessageText,
        messageHash: parentMessageHash,
        headerPath: nodePath,
        headerText: node.text
      });
    }
  }

  function registerNode(element: Element, nodeId: string) {
    scrollSyncService.registerHeaderOutlineElement(nodeId, element);

    return {
      destroy() {
        scrollSyncService.unregisterHeaderOutlineElement(nodeId);
      }
    };
  }

  // 检查节点是否有书签（使用父组件传入的 Set，O(1) 查找）
  function hasHeaderBookmark(nodePath: string): boolean {
    return headerBookmarks.has(nodePath);
  }

  // 构建子节点的路径
  function buildChildPath(index: number): string {
    if (currentPath) {
      return `${currentPath}.${index}`;
    }
    return `${index}`;
  }
</script>

<div class="tree-container" style="margin-left: {depth * 15}px;">
  {#each nodes as node, index}
    {@const nodePath = buildChildPath(index)}
    <div class="tree-node-wrapper">
      <div
        class="tree-node header-level-{node.level}"
        class:has-bookmark={hasHeaderBookmark(nodePath)}
        use:registerNode={node.id}
        onclick={(e) => scrollToElement(node.element, e)}
        oncontextmenu={(e) => handleContextMenu(e, node, nodePath)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && scrollToElement(node.element, e)}
      >
        <span class="node-text">
          {#if hasHeaderBookmark(nodePath)}<span class="bookmark-indicator">🔖</span>{/if}
          {node.text}
        </span>
        {#if node.children.length > 0}
          <button
            class="toggle-btn"
            onclick={(e) => toggleExpand(node.id, e)}
            aria-label={expandedStates[node.id] ? '收起' : '展开'}
          >
            {expandedStates[node.id] ? '▼' : '▶'}
          </button>
        {/if}
      </div>

      {#if node.children.length > 0 && expandedStates[node.id]}
        <HeaderTree 
          nodes={node.children} 
          depth={depth + 1} 
          {allExpanded} 
          {onContextMenu} 
          {parentMessageIndex}
          {parentMessageText}
          {parentMessageHash}
          currentPath={nodePath}
          {headerBookmarks}
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  .tree-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tree-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .tree-node:hover {
    background-color: var(--outline-node-hover-bg);
  }

  .tree-node.has-bookmark {
    border-left: 2px solid var(--outline-bookmark-border, #ffc107);
  }

  .node-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--outline-text);
  }

  .bookmark-indicator {
    margin-right: 4px;
    font-size: 12px;
  }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--outline-text);
    padding: 4px;
    border-radius: 3px;
    transition: transform 0.2s, background-color 0.2s;
  }

  .toggle-btn:hover {
    background-color: var(--outline-border);
    transform: scale(1.1);
  }

  /* 标题级别边框颜色 */
  .header-level-1 { border-left: 2px solid var(--header-h1); }
  .header-level-2 { border-left: 2px solid var(--header-h2); }
  .header-level-3 { border-left: 2px solid var(--header-h3); }
  .header-level-4 { border-left: 2px solid var(--header-h4); }
  .header-level-5 { border-left: 2px solid var(--header-h5); }
  .header-level-6 { border-left: 2px solid var(--header-h6); }
</style>