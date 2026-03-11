<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { themeStore, featuresStore, allExpandedStore, toggleTheme, toggleVisibility, toggleAllExpanded } from '../../stores';
  import OutlineHeader from './OutlineHeader.svelte';
  import OutlineList from './OutlineList.svelte';
  import DraggableToggleButton from './DraggableToggleButton.svelte';
  import PanelNoticeStack from './PanelNoticeStack.svelte';
  import ServiceStatusBar from './ServiceStatusBar.svelte';
  import { scrollSyncService } from '../../services/scrollSyncService';

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

    // 获取初始值
    const theme = get(themeStore);
    currentTheme = theme.currentTheme;
    allExpanded = get(allExpandedStore);
    isVisible = get(featuresStore).isVisible;

    return () => {
      unsubscribeTheme();
      unsubscribeAllExpanded();
      unsubscribeFeatures();
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
      {allExpanded}
      {currentTheme}
    />
    <PanelNoticeStack />
    <OutlineList {filterText} {useRegex} />
    <ServiceStatusBar />
  </div>
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
    transition: all 0.3s ease;
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
