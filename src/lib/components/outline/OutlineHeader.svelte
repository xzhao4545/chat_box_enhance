<script lang="ts">
  import { themeStore } from '../../stores';

  const TITLE = '对话大纲';

  interface Props {
    onRefresh: () => void;
    onToggleAll: () => void;
    onToggleTheme: () => void;
    onHide: () => void;
    allExpanded: boolean;
    currentTheme: 'light' | 'dark';
  }

  let { onRefresh, onToggleAll, onToggleTheme, onHide, allExpanded, currentTheme }: Props = $props();
</script>

<header class="chat-outline-header">
  <h3 class="chat-outline-title">{TITLE}</h3>
  <div class="outline-controls">
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
      onclick={onToggleAll}
      title={allExpanded ? '收起所有节点' : '展开所有节点'}
      aria-label={allExpanded ? '收起所有节点' : '展开所有节点'}
    >
      {allExpanded ? '📂' : '📁'}
    </button>
    <button
      class="outline-btn"
      onclick={onToggleTheme}
      title="切换主题"
      aria-label="切换主题"
    >
      {currentTheme === 'light' ? '🌙' : '☀️'}
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
</header>

<style>
  .chat-outline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 15px;
    padding-right: 15px;
    border-bottom: 1px solid var(--outline-border);
    background: var(--outline-header-bg);
    border-radius: var(--outline-radius) var(--outline-radius) 0 0;
    height: 10%;
  }

  .chat-outline-title {
    margin: 0;
    color: var(--outline-text);
    font-size: 16px;
    font-weight: bold;
  }

  .outline-controls {
    display: flex;
    gap: 8px;
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
</style>