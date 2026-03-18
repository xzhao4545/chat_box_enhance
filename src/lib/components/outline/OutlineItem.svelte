<script lang="ts">
  import { MessageOwner, type OutlineItem as OutlineItemType } from '../../types';
  import HeaderTree from './HeaderTree.svelte';
  import { highlightElement } from '../../utils';
  import { messageCacheManager } from '../../services/messageCacheManager';
  import { scrollSyncService } from '../../services/scrollSyncService';
  import { bookmarksStore } from '../../stores';

  interface Props {
    item: OutlineItemType;
    allExpanded?: boolean;
    onContextMenu?: (e: MouseEvent, context: {
      outlineItemId: string;
      outlineItemType: 'message' | 'header';
      messageIndex: number;
      messageText: string;
      messageHash: string;
    }) => void;
  }

  let { item, allExpanded = true, onContextMenu }: Props = $props();

  let isExpanded = $state(true);
  let containerElement: HTMLDivElement | undefined = $state();

  // 是否有书签
  let hasBookmark = $state(false);

  // 检查是否有书签
  $effect(() => {
    hasBookmark = bookmarksStore.hasBookmarkForOutlineItem(item.id);
  });

  function scrollToElement() {
    scrollSyncService.focusOutlineElement(containerElement);
    item.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(item.element);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      scrollToElement();
    }
  }

  function toggleExpand(e: Event) {
    e.stopPropagation();
    isExpanded = !isExpanded;
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, {
        outlineItemId: item.id,
        outlineItemType: 'message',
        messageIndex: item.index,
        messageText: item.searchText,
        messageHash: item.id // 使用 id 作为 hash 的简化版本
      });
    }
  }

  $effect(() => {
    isExpanded = allExpanded;
  });

  // 组件挂载后保存 DOM 引用到缓存
  $effect(() => {
    if (containerElement && item.id) {
      messageCacheManager.updateOutlineElement(item.id, containerElement);
      scrollSyncService.scheduleRebuildScrollAnchors();
    }
  });
</script>

{#if item.type === MessageOwner.User}
  <!-- 用户消息项 -->
  <div 
    class="outline-user-item" 
    class:has-bookmark={hasBookmark}
    bind:this={containerElement} 
    onclick={scrollToElement} 
    onkeydown={handleKeydown} 
    oncontextmenu={handleContextMenu}
    role="button" 
    tabindex="0"
  >
    {#if hasBookmark}<span class="bookmark-indicator">🔖</span>{/if}
    👤 {item.index+1}. {item.text}
  </div>
{:else if item.type === MessageOwner.Assistant}
  {#if item.headers && item.headers.length > 0}
    <!-- AI消息容器（带标题） -->
    <div class="outline-ai-container" bind:this={containerElement}>
      <div 
        class="outline-ai-header" 
        class:has-bookmark={hasBookmark}
        onclick={scrollToElement} 
        onkeydown={handleKeydown} 
        oncontextmenu={handleContextMenu}
        role="button" 
        tabindex="0"
      >
        <span class="header-text">
          {#if hasBookmark}<span class="bookmark-indicator">🔖</span>{/if}
          🤖 {item.index+1}. {item.text}
        </span>
        <button
          class="toggle-btn"
          onclick={toggleExpand}
          aria-label={isExpanded ? '收起' : '展开'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      {#if isExpanded}
        <div class="outline-ai-content">
          <HeaderTree nodes={item.headers} allExpanded={allExpanded} onContextMenu={onContextMenu} parentMessageIndex={item.index} />
        </div>
      {/if}
    </div>
  {:else}
    <!-- AI消息简单项 -->
    <div 
      class="outline-ai-item" 
      class:has-bookmark={hasBookmark}
      bind:this={containerElement} 
      onclick={scrollToElement} 
      onkeydown={handleKeydown} 
      oncontextmenu={handleContextMenu}
      role="button" 
      tabindex="0"
    >
      {#if hasBookmark}<span class="bookmark-indicator">🔖</span>{/if}
      🤖 {item.index}. {item.text}
    </div>
  {/if}
{/if}

<style>
  .outline-user-item {
    margin: 8px 15px;
    padding: 8px;
    background: var(--outline-user-bg);
    border-left: 3px solid var(--outline-user-border);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    color: var(--outline-text);
    font-size: 14px;
    position: relative;
  }

  .outline-user-item:hover {
    background: var(--outline-user-hover-bg);
  }

  .has-bookmark {
    border-left-color: var(--outline-bookmark-border, #ffc107);
  }

  .bookmark-indicator {
    margin-right: 4px;
    font-size: 12px;
  }

  .outline-ai-container {
    margin: 8px 15px;
    border-left: 3px solid var(--outline-ai-border);
    border-radius: 4px;
    background: var(--outline-ai-bg);
    transition: background-color 0.2s;
  }

  .outline-ai-header {
    padding: 8px;
    cursor: pointer;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
    color: var(--outline-text);
  }

  .outline-ai-header:hover {
    background: var(--outline-ai-hover-bg);
  }

  .outline-ai-header.has-bookmark {
    border-left-color: var(--outline-bookmark-border, #ffc107);
  }

  .header-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .outline-ai-content {
    padding: 0 8px 8px 8px;
  }

  .outline-ai-item {
    margin: 8px 15px;
    padding: 8px;
    background: var(--outline-ai-bg);
    border-left: 3px solid var(--outline-ai-border);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    color: var(--outline-text);
    font-size: 14px;
  }

  .outline-ai-item:hover {
    background: var(--outline-ai-hover-bg);
  }

  .outline-ai-item.has-bookmark {
    border-left-color: var(--outline-bookmark-border, #ffc107);
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
    margin-left: 8px;
  }

  .toggle-btn:hover {
    background-color: var(--outline-border);
    transform: scale(1.1);
  }

  :global(.outline-active) {
    background: var(--outline-active-bg) !important;
    outline: 2px solid var(--outline-active-border);
    outline-offset: -1px;
  }
</style>
