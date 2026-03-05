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
  }

  let { filterText = '', useRegex = false }: Props = $props();

  let items = $state<OutlineItemType[]>([]);
  let allExpanded = $state(true);
  let outlineContainer: HTMLDivElement;

  function filterItems(items: OutlineItemType[], filter: string, regex: boolean): OutlineItemType[] {
    if (!filter) return items;
    if (regex) {
      const reg= new RegExp(filter, 'i');
      return items.filter((item)=>{
        return reg.test(item.element.textContent);
      })
    }
    
    return items.filter(item => {
      return item.element.textContent.toLowerCase().includes(filter.toLocaleLowerCase());
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
    <OutlineItem {item} {allExpanded} />
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