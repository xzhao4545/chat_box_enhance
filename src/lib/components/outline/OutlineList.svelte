<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { outlineStore, allExpandedStore, featuresStore, bookmarksStore } from '../../stores';
  import OutlineItem from './OutlineItem.svelte';
  import type { OutlineItem as OutlineItemType } from '../../types';
  import { scrollSyncService } from '../../services/scrollSyncService';
  import { getConversationId } from '../../services/conversationService';

  interface Props {
    filterText?: string;
    useRegex?: boolean;
    onContextMenu?: (e: MouseEvent, context: {
      outlineItemType: 'message' | 'header';
      messageIndex: number;
      messageText: string;
      messageHash: string;
      headerPath?: string;
      headerText?: string;
    }) => void;
  }

  let { filterText = '', useRegex = false, onContextMenu }: Props = $props();

  let items = $state<OutlineItemType[]>([]);
  let allExpanded = $state(true);
  let outlineContainer: HTMLDivElement;

  // 书签状态缓存（优化性能：只在父组件计算一次）
  // messageBookmarks: 存储有 message 类型书签的 messageIndex
  // headerBookmarks: 存储有 header 类型书签的 Map<messageIndex, Set<headerPath>>
  let messageBookmarks = $state<Set<number>>(new Set());
  let headerBookmarks = $state<Map<number, Set<string>>>(new Map());

  // 统一计算书签状态
  $effect(() => {
    const storeData = $bookmarksStore;
    const conversationId = getConversationId();
    const bookmarks = conversationId ? (storeData[conversationId] || []) : [];
    
    const msgBookmarks = new Set<number>();
    const hdrBookmarks = new Map<number, Set<string>>();
    
    for (const bookmark of bookmarks) {
      if (bookmark.outlineItemType === 'message') {
        msgBookmarks.add(bookmark.messageIndex);
      } else if (bookmark.outlineItemType === 'header' && bookmark.headerPath) {
        let headerSet = hdrBookmarks.get(bookmark.messageIndex);
        if (!headerSet) {
          headerSet = new Set();
          hdrBookmarks.set(bookmark.messageIndex, headerSet);
        }
        headerSet.add(bookmark.headerPath);
      }
    }
    
    messageBookmarks = msgBookmarks;
    headerBookmarks = hdrBookmarks;
  });

  function filterItems(items: OutlineItemType[], filter: string, regex: boolean): OutlineItemType[] {
    if (!filter) return items;
    if (regex) {
      try {
        const reg = new RegExp(filter, 'i');
        return items.filter((item) => reg.test(item.searchText));
      } catch {
        return items;
      }
    }
    
    return items.filter(item => {
      return item.searchText.toLocaleLowerCase().includes(filter.toLocaleLowerCase());
    });
  }
  let showItems = $derived.by<OutlineItemType[]>(()=>{
    return filterItems(items, filterText, useRegex);
  });

  onMount(() => {
    const unsubscribeOutline = outlineStore.subscribe(value => {
      items = value;
    });
    const unsubscribeAllExpanded = allExpandedStore.subscribe(value => {
      allExpanded = value;
    });

    items = get(outlineStore);
    allExpanded = get(allExpandedStore);

    if (outlineContainer) {
      scrollSyncService.setOutlineContainer(outlineContainer);
    }

    return () => {
      unsubscribeOutline();
      unsubscribeAllExpanded();
    };
  });
</script>

<div class="outline-content" id="outline-content" bind:this={outlineContainer}>
  {#each showItems as item (item.id)}
    <OutlineItem 
      {item} 
      {allExpanded} 
      {onContextMenu} 
      hasBookmark={messageBookmarks.has(item.index)}
      headerBookmarks={headerBookmarks.get(item.index) || new Set()}
    />
  {/each}
</div>

<style>
  .outline-content {
    overflow-y: auto;
    flex: 1;
    padding-bottom: 15px;
    position: relative;
    scroll-behavior: smooth;
  }
</style>
