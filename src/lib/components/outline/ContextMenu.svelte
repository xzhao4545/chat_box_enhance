<script lang="ts">
  import { onMount } from 'svelte';

  export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    danger?: boolean;
  }

  interface Props {
    x: number;
    y: number;
    items: MenuItem[];
    onSelect: (itemId: string) => void;
    onClose: () => void;
  }

  let { x, y, items, onSelect, onClose }: Props = $props();

  let menuElement: HTMLDivElement | undefined = $state();

  // 调整位置以确保菜单在视口内
  let adjustedX = $derived.by(() => {
    if (!menuElement) return x;
    const rect = menuElement.getBoundingClientRect();
    const padding = 8;
    if (rect.right > window.innerWidth - padding) {
      return window.innerWidth - rect.width - padding;
    }
    return x;
  });

  let adjustedY = $derived.by(() => {
    if (!menuElement) return y;
    const rect = menuElement.getBoundingClientRect();
    const padding = 8;
    if (rect.bottom > window.innerHeight - padding) {
      return window.innerHeight - rect.height - padding;
    }
    return y;
  });

  function handleItemClick(item: MenuItem) {
    if (!item.disabled) {
      onSelect(item.id);
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  onMount(() => {
    // 点击外部关闭
    const handleClickOutside = (e: MouseEvent) => {
      if (menuElement && !menuElement.contains(e.target as Node)) {
        onClose();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="context-menu"
  bind:this={menuElement}
  style="left: {adjustedX}px; top: {adjustedY}px;"
  role="menu"
>
  {#each items as item}
    <button
      class="menu-item"
      class:disabled={item.disabled}
      class:danger={item.danger}
      onclick={() => handleItemClick(item)}
      role="menuitem"
      disabled={item.disabled}
    >
      {#if item.icon}
        <span class="menu-icon">{item.icon}</span>
      {/if}
      <span class="menu-label">{item.label}</span>
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 100000;
    min-width: 150px;
    background: var(--outline-bg);
    border: 1px solid var(--outline-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px var(--outline-shadow);
    padding: 4px 0;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    color: var(--outline-text);
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s;
  }

  .menu-item:hover:not(.disabled) {
    background: var(--outline-border);
  }

  .menu-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .menu-item.danger {
    color: #dc3545;
  }

  .menu-icon {
    width: 16px;
    text-align: center;
  }

  .menu-label {
    flex: 1;
  }
</style>