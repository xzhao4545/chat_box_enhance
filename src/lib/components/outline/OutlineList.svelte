<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { outlineStore, allExpandedStore } from '../../stores';
  import OutlineItem from './OutlineItem.svelte';
  import type { OutlineItem as OutlineItemType } from '../../types';

  let items = $state<OutlineItemType[]>([]);
  let allExpanded = $state(true);

  onMount(() => {
    // 订阅store变化
    const unsubscribeOutline = outlineStore.subscribe(value => {
      items = value;
    });
    const unsubscribeAllExpanded = allExpandedStore.subscribe(value => {
      allExpanded = value;
    });

    // 获取初始值
    items = get(outlineStore);
    allExpanded = get(allExpandedStore);

    return () => {
      unsubscribeOutline();
      unsubscribeAllExpanded();
    };
  });
</script>

<div class="outline-content" id="outline-content">
  {#each items as item (item.id)}
    <OutlineItem {item} {allExpanded} />
  {/each}
</div>

<style>
  .outline-content {
    overflow-y: auto;
    height: 90%;
    padding-bottom: 15px;
  }
</style>