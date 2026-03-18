<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { bookmarksStore } from '../../stores';
  import type { Bookmark, BookmarksData } from '../../types';
  import BookmarkList from './BookmarkList.svelte';
  import { getConversationId } from '../../services/conversationService';
  import { showBookmarkContextMenu, handleMenuSelect } from '../../services/bookmarkContextService';

  interface Props {
    onNavigate?: (bookmark: Bookmark) => void;
  }

  let { onNavigate }: Props = $props();

  // 视图模式：当前会话 / 所有会话
  let viewMode = $state<'current' | 'all'>('current');

  // 搜索关键词
  let searchQuery = $state('');

  // 书签数据（按会话分组）
  let bookmarksData = $state<BookmarksData>({});

  // 会话折叠状态
  let collapsedConversations = $state<Set<string>>(new Set());

  // 当前会话ID
  let currentConversationId = $state('');

  // 获取会话显示名称
  function getConversationDisplayName(conversationId: string): string {
    if (conversationId === currentConversationId) {
      return '当前会话';
    }
    // 截取会话ID前8位显示
    return conversationId.length > 12 ? conversationId.substring(0, 12) + '...' : conversationId;
  }

  // 过滤后的书签数据
  let filteredData = $derived(() => {
    const result: { conversationId: string; bookmarks: Bookmark[] }[] = [];

    if (viewMode === 'current') {
      const bookmarks = bookmarksData[currentConversationId] || [];
      const filtered = filterBookmarks(bookmarks);
      if (filtered.length > 0) {
        result.push({ conversationId: currentConversationId, bookmarks: filtered });
      }
    } else {
      // 全部模式：按会话分组
      for (const [conversationId, bookmarks] of Object.entries(bookmarksData)) {
        const filtered = filterBookmarks(bookmarks);
        if (filtered.length > 0) {
          result.push({ conversationId, bookmarks: filtered });
        }
      }
      // 按最新书签时间排序会话
      result.sort((a, b) => {
        const aLatest = Math.max(...a.bookmarks.map(b => b.createdAt));
        const bLatest = Math.max(...b.bookmarks.map(b => b.createdAt));
        return bLatest - aLatest;
      });
    }

    return result;
  });

  // 过滤书签
  function filterBookmarks(bookmarks: Bookmark[]): Bookmark[] {
    if (!searchQuery.trim()) return bookmarks;
    const query = searchQuery.toLowerCase();
    return bookmarks.filter(b => b.name.toLowerCase().includes(query));
  }

  // 总书签数
  let totalBookmarks = $derived(() => {
    let count = 0;
    for (const item of filteredData()) {
      count += item.bookmarks.length;
    }
    return count;
  });

  // 订阅书签存储
  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    currentConversationId = getConversationId();

    unsubscribe = bookmarksStore.subscribe(data => {
      bookmarksData = data;
    });

    return () => {
      unsubscribe?.();
    };
  });

  // 处理书签导航
  function handleNavigate(bookmark: Bookmark) {
    onNavigate?.(bookmark);
  }

  // 处理书签右键菜单
  function handleContextMenu(e: MouseEvent, bookmark: Bookmark) {
    showBookmarkContextMenu(e, bookmark);
  }

  // 处理搜索输入
  function handleSearchInput(e: Event) {
    searchQuery = (e.target as HTMLInputElement).value;
  }

  // 切换会话折叠
  function toggleConversation(conversationId: string) {
    const newCollapsed = new Set(collapsedConversations);
    if (newCollapsed.has(conversationId)) {
      newCollapsed.delete(conversationId);
    } else {
      newCollapsed.add(conversationId);
    }
    collapsedConversations = newCollapsed;
  }

  // 检查是否折叠
  function isCollapsed(conversationId: string): boolean {
    return collapsedConversations.has(conversationId);
  }
</script>

<div class="bookmark-panel">
  <div class="bookmark-toolbar">
    <div class="view-toggle">
      <button
        class="toggle-btn"
        class:active={viewMode === 'current'}
        onclick={() => viewMode = 'current'}
      >
        当前
      </button>
      <button
        class="toggle-btn"
        class:active={viewMode === 'all'}
        onclick={() => viewMode = 'all'}
      >
        全部
      </button>
    </div>
    <input
      type="text"
      class="search-input"
      placeholder="搜索书签..."
      value={searchQuery}
      oninput={handleSearchInput}
    />
  </div>

  <div class="bookmark-content">
    {#if filteredData().length === 0}
      <div class="empty-state">
        <span class="empty-icon">📚</span>
        <p>暂无书签</p>
        <p class="hint">在大纲上右键可添加书签</p>
      </div>
    {:else}
      {#each filteredData() as group (group.conversationId)}
        <div class="conversation-group">
          {#if viewMode === 'all'}
            <div
              class="conversation-header"
              onclick={() => toggleConversation(group.conversationId)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && toggleConversation(group.conversationId)}
            >
              <span class="toggle-icon">{isCollapsed(group.conversationId) ? '▶' : '▼'}</span>
              <span class="conversation-name">{getConversationDisplayName(group.conversationId)}</span>
              <span class="conversation-count">{group.bookmarks.length}</span>
            </div>
          {/if}
          {#if !isCollapsed(group.conversationId)}
            <BookmarkList
              bookmarks={group.bookmarks}
              onNavigate={handleNavigate}
              onContextMenu={handleContextMenu}
            />
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <div class="bookmark-footer">
    <span class="bookmark-count">
      共 {totalBookmarks()} 个书签
    </span>
  </div>
</div>

<style>
  .bookmark-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .bookmark-toolbar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--outline-border);
    background: var(--outline-header-bg);
  }

  .view-toggle {
    display: flex;
    gap: 2px;
    background: var(--outline-border);
    border-radius: 4px;
    padding: 2px;
  }

  .toggle-btn {
    flex: 1;
    padding: 5px 10px;
    border: none;
    background: transparent;
    color: var(--outline-text);
    font-size: 12px;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: var(--outline-bg);
    font-weight: 500;
  }

  .toggle-btn:hover:not(.active) {
    opacity: 0.8;
  }

  .search-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-bg);
    color: var(--outline-text);
    font-size: 12px;
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--outline-primary, #007acc);
  }

  .search-input::placeholder {
    color: var(--outline-text);
    opacity: 0.5;
  }

  .bookmark-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

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

  .conversation-group {
    border-bottom: 1px solid var(--outline-border);
  }

  .conversation-group:last-child {
    border-bottom: none;
  }

  .conversation-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--outline-header-bg);
    cursor: pointer;
    font-size: 12px;
    color: var(--outline-text);
    transition: background-color 0.15s;
  }

  .conversation-header:hover {
    background: var(--outline-node-hover-bg);
  }

  .toggle-icon {
    font-size: 10px;
    opacity: 0.6;
  }

  .conversation-name {
    flex: 1;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .conversation-count {
    min-width: 18px;
    height: 18px;
    font-size: 10px;
    opacity: 0.8;
    background: var(--outline-border);
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .bookmark-footer {
    padding: 6px 12px;
    border-top: 1px solid var(--outline-border);
    background: var(--outline-header-bg);
  }

  .bookmark-count {
    font-size: 11px;
    color: var(--outline-text);
    opacity: 0.6;
  }
</style>