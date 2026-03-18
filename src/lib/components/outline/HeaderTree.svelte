<script lang="ts">
  import type { HeaderTreeNode } from '../../types';
  import { highlightElement } from '../../utils';
  import { scrollSyncService } from '../../services/scrollSyncService';
  import { bookmarksStore } from '../../stores';
  import { buildMessageHash } from '../../utils/outlineBuilder';
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
    }) => void;
    parentMessageIndex?: number;
  }

  let { nodes, depth = 0, allExpanded = true, onContextMenu, parentMessageIndex = 0 }: Props = $props();

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

  function handleContextMenu(e: MouseEvent, node: HeaderTreeNode) {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, {
        outlineItemType: 'header',
        messageIndex: parentMessageIndex,
        messageText: node.text,
        messageHash: buildMessageHash(parentMessageIndex, node.text)
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

  // 检查节点是否有书签（基于 messageIndex）
  function hasBookmark(): boolean {
    return bookmarksStore.hasBookmarkForMessageIndex(parentMessageIndex);
  }
</script>

<div class="tree-container" style="margin-left: {depth * 15}px;">
  {#each nodes as node}
    <div class="tree-node-wrapper">
      <div
        class="tree-node header-level-{node.level}"
        class:has-bookmark={hasBookmark()}
        use:registerNode={node.id}
        onclick={(e) => scrollToElement(node.element, e)}
        oncontextmenu={(e) => handleContextMenu(e, node)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && scrollToElement(node.element, e)}
      >
        <span class="node-text">
          {#if hasBookmark()}<span class="bookmark-indicator">🔖</span>{/if}
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
        <HeaderTree nodes={node.children} depth={depth + 1} {allExpanded} {onContextMenu} {parentMessageIndex} />
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