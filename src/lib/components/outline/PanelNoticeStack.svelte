<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { panelNoticeStore, removePanelNotice, type PanelNotice } from '../../stores/panelStatus';

  let notices = $state<PanelNotice[]>([]);

  const classMap: Record<PanelNotice['level'], string> = {
    info: 'notice-info',
    success: 'notice-success',
    warning: 'notice-warning',
    error: 'notice-error'
  };

  onMount(() => {
    const unsubscribe = panelNoticeStore.subscribe((value) => {
      notices = value;
    });

    notices = get(panelNoticeStore);

    return () => {
      unsubscribe();
    };
  });
</script>

{#if notices.length > 0}
  <div class="panel-notice-stack">
    {#each notices as notice (notice.id)}
      <div class={`panel-notice ${classMap[notice.level]}`} role="status" aria-live="polite">
        <span class="notice-text">{notice.message}</span>
        <button
          class="notice-close"
          type="button"
          aria-label="关闭提示"
          onclick={() => removePanelNotice(notice.id)}
        >
          ×
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .panel-notice-stack {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 42px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .panel-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--outline-border);
    box-shadow: 0 8px 20px var(--outline-shadow);
    backdrop-filter: blur(10px);
    pointer-events: auto;
  }

  .notice-info {
    background: color-mix(in srgb, #3b82f6 18%, var(--outline-bg));
  }

  .notice-success {
    background: color-mix(in srgb, #22c55e 18%, var(--outline-bg));
  }

  .notice-warning {
    background: color-mix(in srgb, #f59e0b 18%, var(--outline-bg));
  }

  .notice-error {
    background: color-mix(in srgb, #ef4444 18%, var(--outline-bg));
  }

  .notice-text {
    color: var(--outline-text);
    font-size: 13px;
    line-height: 1.4;
  }

  .notice-close {
    flex: none;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--outline-text);
    cursor: pointer;
  }
</style>
