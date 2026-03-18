<script lang="ts">
  import { themeStore } from "../../stores";
  import SettingsModal from "./SettingsModal.svelte";
  import { debounce } from '../../utils';

  const TITLE = "对话大纲";

  interface Props {
    onRefresh: () => void;
    onToggleAll: () => void;
    onToggleTheme: () => void;
    onHide: () => void;
    onSync: () => void;
    allExpanded: boolean;
    currentTheme: "light" | "dark";
    onFilterChange: (filter: string, useRegex: boolean) => void;
    viewMode: 'outline' | 'bookmark';
    onTabChange: (tab: 'outline' | 'bookmark') => void;
  }

  let {
    onRefresh,
    onToggleAll,
    onToggleTheme,
    onHide,
    onSync,
    allExpanded,
    currentTheme,
    onFilterChange,
    viewMode,
    onTabChange,
  }: Props = $props();

  let filterText = $state("");
  let useRegex = $state(false);
  let showSettings = $state(false);
  const emitFilterChange = debounce((filter: string, regex: boolean) => {
    onFilterChange(filter, regex);
  }, 150);

  function handleFilterInput(e: Event) {
    filterText = (e.target as HTMLInputElement).value;
    emitFilterChange(filterText, useRegex);
  }

  function toggleRegex() {
    useRegex = !useRegex;
    onFilterChange(filterText, useRegex);
  }
</script>

<header class="chat-outline-header">
  <div class="title-row">
    <h3 class="chat-outline-title">{TITLE}</h3>
    <div class="title-controls">
      <button
        class="outline-btn"
        onclick={() => showSettings = true}
        title="设置"
        aria-label="设置"
      >
        ⚙️
      </button>
      <button
        class="outline-btn"
        onclick={onHide}
        title="隐藏大纲"
        aria-label="隐藏大纲"
      >
        ✕
      </button>
    </div>
  </div>
  
  <!-- 标签页切换 -->
  <div class="tab-container">
    <button
      class="tab-btn"
      class:active={viewMode === 'outline'}
      onclick={() => onTabChange('outline')}
    >
      📋 大纲
    </button>
    <button
      class="tab-btn"
      class:active={viewMode === 'bookmark'}
      onclick={() => onTabChange('bookmark')}
    >
      📚 书签
    </button>
  </div>
  
  <div class="controls-row">
    <!-- 左侧：大纲专有按钮 -->
    <div class="controls-left">
      {#if viewMode === 'outline'}
        <button
          class="outline-btn"
          onclick={onRefresh}
          title="强制刷新大纲"
          aria-label="强制刷新大纲"
        >
          🔄
        </button>
        <button
          class="outline-btn"
          onclick={onSync}
          title="同步大纲位置"
          aria-label="同步大纲位置"
        >
          📍
        </button>
        <button
          class="outline-btn"
          onclick={onToggleAll}
          title={allExpanded ? "收起所有节点" : "展开所有节点"}
          aria-label={allExpanded ? "收起所有节点" : "展开所有节点"}
        >
          {allExpanded ? "📂" : "📁"}
        </button>
      {/if}
    </div>
    <!-- 右侧：通用按钮 -->
    <div class="controls-right">
      <button
        class="outline-btn"
        onclick={onToggleTheme}
        title="切换主题"
        aria-label="切换主题"
      >
        {currentTheme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  </div>
  {#if viewMode === 'outline'}
    <div class="filter-row">
      <input
        type="text"
        class="filter-input"
        placeholder="筛选..."
        value={filterText}
        oninput={handleFilterInput}
      />
      <button
        class="outline-btn regex-btn"
        class:active={useRegex}
        onclick={toggleRegex}
        title={useRegex ? "关闭正则表达式" : "启用正则表达式"}
      >
        .*
      </button>
    </div>
  {/if}
</header>

{#if showSettings}
  <SettingsModal onClose={() => showSettings = false} />
{/if}

<style>
  .chat-outline-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 15px;
    border-bottom: 1px solid var(--outline-border);
    background: var(--outline-header-bg);
    border-radius: var(--outline-radius) var(--outline-radius) 0 0;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chat-outline-title {
    margin: 0;
    color: var(--outline-text);
    font-size: 16px;
    font-weight: bold;
  }

  .title-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tab-container {
    display: flex;
    gap: 2px;
    background: var(--outline-border);
    border-radius: 4px;
    padding: 2px;
  }

  .tab-btn {
    flex: 1;
    padding: 5px 10px;
    border: none;
    background: transparent;
    color: var(--outline-text);
    font-size: 12px;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .tab-btn.active {
    background: var(--outline-bg);
    font-weight: 500;
  }

  .tab-btn:hover:not(.active) {
    opacity: 0.8;
  }

  .controls-row {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .controls-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .controls-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .filter-row {
    display: flex;
    gap: 4px;
  }

  .filter-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-bg);
    color: var(--outline-text);
    font-size: 14px;
  }

  .outline-btn {
    background: none;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    color: var(--outline-text);
    transition: all 0.2s ease;
  }

  .outline-btn:hover {
    background: var(--outline-border);
    transform: scale(1.05);
  }

  .outline-btn.active {
    background: var(--outline-border);
    font-weight: bold;
  }

  .regex-btn.active {
    background: var(--outline-border);
    font-weight: bold;
  }
</style>