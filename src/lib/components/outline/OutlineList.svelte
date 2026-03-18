<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { outlineStore, allExpandedStore, featuresStore } from '../../stores';
  import OutlineItem from './OutlineItem.svelte';
  import type { OutlineItem as OutlineItemType } from '../../types';
  import { scrollSyncService } from '../../services/scrollSyncService';

  interface Props {
    filterText?: string;
    useRegex?: boolean;
    onContextMenu?: (e: MouseEvent, context: {
      outlineItemType: 'message' | 'header';
      messageIndex: number;
      messageText: string;
      messageHash: string;
    }) => void;
  }

  let { filterText = '', useRegex = false, onContextMenu }: Props = $props();

  let items = $state<OutlineItemType[]>([]);
  let allExpanded = $state(true);
  let outlineContainer: HTMLDivElement;

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
    <OutlineItem {item} {allExpanded} {onContextMenu} />
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
