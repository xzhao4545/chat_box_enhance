<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { serviceStatusStore, type ServiceStatusItem } from '../../stores/panelStatus';
  import { outlineRuntimeService } from '../../services/outlineRuntimeService';
  import { scrollSyncService } from '../../services/scrollSyncService';

  let items = $state<ServiceStatusItem[]>([]);

  const colorMap: Record<ServiceStatusItem['state'], string> = {
    idle: '#94a3b8',
    ready: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    syncing: '#3b82f6'
  };

  onMount(() => {
    const unsubscribe = serviceStatusStore.subscribe((status) => {
      items = [status.outlineRuntime, status.scrollSync];
    });

    const current = get(serviceStatusStore);
    items = [current.outlineRuntime, current.scrollSync];

    return () => {
      unsubscribe();
    };
  });

  function getTooltip(item: ServiceStatusItem): string {
    const time = new Date(item.updatedAt).toLocaleTimeString();
    return `${item.label}：${item.message}（最近更新 ${time}，点击可重新获取并绑定）`;
  }

  async function handleClick(item: ServiceStatusItem) {
    if (item.key === 'outlineRuntime') {
      await outlineRuntimeService.forceRebind();
      return;
    }

    scrollSyncService.forceRebind();
  }
</script>

<div class="service-status-bar" aria-label="服务状态栏">
  {#each items as item (item.key)}
    <button
      class="status-dot-button"
      type="button"
      title={getTooltip(item)}
      aria-label={getTooltip(item)}
      onclick={() => handleClick(item)}
    >
      <span class="status-light" style={`--status-color: ${colorMap[item.state]}`}></span>
    </button>
  {/each}
</div>

<style>
  .service-status-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 8px 12px 10px;
    border-top: 1px solid var(--outline-border);
    background: color-mix(in srgb, var(--outline-header-bg) 70%, transparent);
  }

  .status-dot-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  .status-dot-button:hover .status-light {
    transform: scale(1.12);
  }

  .status-light {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--status-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-color) 20%, transparent);
    transition: transform 0.2s ease;
  }
</style>
