<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { themeStore, featuresStore, allExpandedStore, toggleTheme, toggleVisibility, toggleAllExpanded } from '../../stores';
  import OutlineHeader from './OutlineHeader.svelte';
  import OutlineList from './OutlineList.svelte';
  import DraggableToggleButton from './DraggableToggleButton.svelte';
  import PanelNoticeStack from './PanelNoticeStack.svelte';
  import ServiceStatusBar from './ServiceStatusBar.svelte';
  import BookmarkPanel from './BookmarkPanel.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import AddBookmarkModal from './AddBookmarkModal.svelte';
  import RenameBookmarkModal from './RenameBookmarkModal.svelte';
  import { scrollSyncService } from '../../services/scrollSyncService';
  import { bookmarkNavigationService } from '../../services/bookmarkNavigationService';
  import {
    contextMenuState,
    addBookmarkModalState,
    renameBookmarkModalState,
    showContextMenu,
    hideContextMenu,
    handleMenuSelect,
    hideAddBookmarkModal,
    hideRenameBookmarkModal,
    getDefaultNameLength,
    buildOutlineItemContext
  } from '../../services/bookmarkContextService';
  import type { Bookmark } from '../../types';

  interface Props {
    onRefresh: () => void;
    isFixedRight?: boolean;
  }

  let { onRefresh, isFixedRight = false }: Props = $props();

  let currentTheme = $state<'light' | 'dark'>('light');
  let allExpanded = $state(true);
  let isVisible = $state(true);
  let filterText = $state('');
  let useRegex = $state(false);

  // 视图模式：大纲 / 书签
  let viewMode = $state<'outline' | 'bookmark'>('outline');

  // 从 stores 获取状态
  let menuState = $state(get(contextMenuState));
  let addModalState = $state(get(addBookmarkModalState));
  let renameModalState = $state(get(renameBookmarkModalState));

  onMount(() => {
    // 订阅store变化
    const unsubscribeTheme = themeStore.subscribe(theme => {
      currentTheme = theme.currentTheme;
    });
    const unsubscribeAllExpanded = allExpandedStore.subscribe(value => {
      allExpanded = value;
    });
    const unsubscribeFeatures = featuresStore.subscribe(features => {
      isVisible = features.isVisible;
    });
    const unsubscribeMenu = contextMenuState.subscribe(state => {
      menuState = state;
    });
    const unsubscribeAddModal = addBookmarkModalState.subscribe(state => {
      addModalState = state;
    });
    const unsubscribeRenameModal = renameBookmarkModalState.subscribe(state => {
      renameModalState = state;
    });

    // 获取初始值
    const theme = get(themeStore);
    currentTheme = theme.currentTheme;
    allExpanded = get(allExpandedStore);
    isVisible = get(featuresStore).isVisible;

    // 检查并恢复待跳转的书签
    const pendingBookmark = bookmarkNavigationService.checkAndResumePendingNavigation();
    if (pendingBookmark) {
      // 延迟执行跳转，等待大纲渲染完成
      setTimeout(() => {
        bookmarkNavigationService.resumeNavigation(pendingBookmark);
      }, 500);
    }

    return () => {
      unsubscribeTheme();
      unsubscribeAllExpanded();
      unsubscribeFeatures();
      unsubscribeMenu();
      unsubscribeAddModal();
      unsubscribeRenameModal();
    };
  });

  function handleToggleAll() {
    toggleAllExpanded();
  }

  function handleToggleTheme() {
    toggleTheme();
  }

  function handleHide() {
    toggleVisibility();
  }

  function handleSync() {
    scrollSyncService.manualSync();
  }

  function handleFilterChange(filter: string, regex: boolean) {
    filterText = filter;
    useRegex = regex;
  }

  function handleTabChange(tab: 'outline' | 'bookmark') {
    viewMode = tab;
  }

  // 处理大纲项右键菜单
  function handleContextMenu(e: MouseEvent, context: {
    outlineItemType: 'message' | 'header';
    messageIndex: number;
    messageText: string;
    messageHash: string;
  }) {
    const fullContext = buildOutlineItemContext(
      context.outlineItemType,
      context.messageIndex,
      context.messageText,
      context.messageHash,
      e.target as Element
    );
    showContextMenu(e, fullContext);
  }

  // 处理书签导航
  async function handleBookmarkNavigate(bookmark: Bookmark) {
    const result = await bookmarkNavigationService.navigateToBookmark(bookmark);
    
    if (result.needsRedirect && result.redirectUrl) {
      bookmarkNavigationService.executeRedirect(result.redirectUrl);
    } else if (result.success) {
      // 切换到大纲视图
      viewMode = 'outline';
    }
  }

  // 处理菜单选择
  function handleMenuSelectWrapper(itemId: string) {
    const result = handleMenuSelect(itemId);
    // 如果是跳转操作且有待跳转的书签
    if (itemId === 'navigate' && result.bookmark) {
      handleBookmarkNavigate(result.bookmark);
    }
  }
</script>

{#if isVisible}
  <div
    id="chat-outline"
    class="chat-outline"
    class:outline-fixed-right={isFixedRight}
  >
    <OutlineHeader
      onRefresh={onRefresh}
      onToggleAll={handleToggleAll}
      onToggleTheme={handleToggleTheme}
      onHide={handleHide}
      onSync={handleSync}
      onFilterChange={handleFilterChange}
      viewMode={viewMode}
      onTabChange={handleTabChange}
      {allExpanded}
      {currentTheme}
    />
    <PanelNoticeStack />
    
    {#if viewMode === 'outline'}
      <OutlineList {filterText} {useRegex} onContextMenu={handleContextMenu} />
    {:else}
      <BookmarkPanel onNavigate={handleBookmarkNavigate} />
    {/if}
    
    <ServiceStatusBar />
  </div>

  <!-- 右键菜单 -->
  {#if menuState.visible}
    <ContextMenu
      x={menuState.x}
      y={menuState.y}
      items={menuState.items}
      onSelect={handleMenuSelectWrapper}
      onClose={hideContextMenu}
    />
  {/if}

  <!-- 添加书签弹窗 -->
  {#if addModalState.visible && addModalState.context}
    <AddBookmarkModal
      context={addModalState.context}
      defaultNameLength={getDefaultNameLength()}
      onClose={hideAddBookmarkModal}
    />
  {/if}

  <!-- 重命名书签弹窗 -->
  {#if renameModalState.visible && renameModalState.bookmark}
    <RenameBookmarkModal
      bookmark={renameModalState.bookmark}
      onClose={hideRenameBookmarkModal}
    />
  {/if}
{:else}
  <DraggableToggleButton onClick={toggleVisibility} />
{/if}

<style>
  .chat-outline {
    width: var(--outline-width);
    background: var(--outline-bg);
    border-radius: var(--outline-radius);
    padding: 0;
    box-shadow: 0 4px 12px var(--outline-shadow);
    font-size: var(--outline-font-size);
    transition: background-color 0.3s ease;
    height: 100dvh;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .outline-fixed-right {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 10000;
    height: 100vh;
    border-radius: var(--outline-radius) 0 0 var(--outline-radius);
    border-right: none;
    box-shadow: -4px 0 12px var(--outline-shadow);
  }
</style>