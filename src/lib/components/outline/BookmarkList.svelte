<script lang="ts">
  import { bookmarksStore } from '../../stores';
  import type { Bookmark } from '../../types';

  interface Props {
    bookmarks: Bookmark[];
    onNavigate?: (bookmark: Bookmark) => void;
    onContextMenu?: (e: MouseEvent, bookmark: Bookmark) => void;
  }

  let { bookmarks, onNavigate, onContextMenu }: Props = $props();

  // 格式化时间
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  }

  // 点击书签
  function handleClick(bookmark: Bookmark) {
    onNavigate?.(bookmark);
  }

  // 右键菜单
  function handleContextMenu(e: MouseEvent, bookmark: Bookmark) {
    e.preventDefault();
    onContextMenu?.(e, bookmark);
  }

  // 键盘导航
  function handleKeydown(e: KeyboardEvent, bookmark: Bookmark) {
    if (e.key === 'Enter') {
      handleClick(bookmark);
    }
  }
</script>

{#if bookmarks.length === 0}
  <div class="empty-state">
    <span class="empty-icon">📚</span>
    <p>暂无书签</p>
    <p class="hint">在大纲上右键可添加书签</p>
  </div>
{:else}
  <div class="bookmark-list">
    {#each bookmarks as bookmark (bookmark.id)}
      <div
        class="bookmark-item"
        onclick={() => handleClick(bookmark)}
        oncontextmenu={(e) => handleContextMenu(e, bookmark)}
        onkeydown={(e) => handleKeydown(e, bookmark)}
        role="button"
        tabindex="0"
      >
        <span class="bookmark-icon">
          {#if bookmark.outlineItemType === 'header'}📑{:else}🔖{/if}
        </span>
        <span class="bookmark-name">{bookmark.name}</span>
        <span class="bookmark-meta">
          #{bookmark.messageIndex + 1} · {formatDate(bookmark.createdAt)}
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    color: var(--outline-text);
    opacity: 0.6;
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .empty-state p {
    margin: 2px 0;
    font-size: 13px;
  }

  .hint {
    font-size: 11px !important;
    opacity: 0.7;
  }

  .bookmark-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 8px;
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--outline-bg);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s;
    font-size: 12px;
  }

  .bookmark-item:hover {
    background: var(--outline-node-hover-bg);
  }

  .bookmark-item:focus {
    outline: 1px solid var(--outline-primary, #007acc);
    outline-offset: -1px;
  }

  .bookmark-icon {
    font-size: 12px;
    flex-shrink: 0;
    opacity: 0.8;
  }

  .bookmark-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--outline-text);
  }

  .bookmark-meta {
    flex-shrink: 0;
    font-size: 10px;
    color: var(--outline-text);
    opacity: 0.5;
  }
</style>