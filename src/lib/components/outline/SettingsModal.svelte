<script lang="ts">
  import { featuresStore } from "../../stores/features";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let features = $state($featuresStore);

  $effect(() => {
    features = $featuresStore;
  });

  function updateFeature(key: keyof typeof features, value: any) {
    featuresStore.update(f => ({ ...f, [key]: value }));
  }
</script>

<div class="modal-overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="0">
  <div class="modal-content" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h3>设置</h3>
      <button class="close-btn" onclick={onClose}>✕</button>
    </div>
    <div class="modal-body">
      <label>
        <input
          type="checkbox"
          checked={features.autoExpand}
          onchange={(e) => updateFeature('autoExpand', e.currentTarget.checked)}
        />
        自动展开节点
      </label>
      <label>
        <input
          type="checkbox"
          checked={features.showUserMessages}
          onchange={(e) => updateFeature('showUserMessages', e.currentTarget.checked)}
        />
        显示用户消息
      </label>
      <label>
        <input
          type="checkbox"
          checked={features.showAIMessages}
          onchange={(e) => updateFeature('showAIMessages', e.currentTarget.checked)}
        />
        显示AI回复
      </label>
      <label>
        <input
          type="checkbox"
          checked={features.syncScroll}
          onchange={(e) => updateFeature('syncScroll', e.currentTarget.checked)}
        />
        同步滚动
      </label>
      <label>
        文本长度限制
        <input
          type="number"
          min="10"
          max="200"
          value={features.textLength}
          onchange={(e) => updateFeature('textLength', parseInt(e.currentTarget.value))}
        />
      </label>
      <label>
        更新间隔 (ms)
        <input
          type="number"
          min="100"
          max="2000"
          step="100"
          value={features.debouncedInterval}
          onchange={(e) => updateFeature('debouncedInterval', parseInt(e.currentTarget.value))}
        />
      </label>
      <label>
        日志级别
        <select
          value={features.logLevel}
          onchange={(e) => updateFeature('logLevel', e.currentTarget.value)}
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </label>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .modal-content {
    background: var(--outline-bg);
    border: 1px solid var(--outline-border);
    border-radius: 8px;
    width: 400px;
    max-width: 90vw;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid var(--outline-border);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--outline-text);
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--outline-text);
    padding: 0;
    width: 24px;
    height: 24px;
  }

  .close-btn:hover {
    opacity: 0.7;
  }

  .modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--outline-text);
    font-size: 14px;
  }

  input[type="checkbox"] {
    cursor: pointer;
  }

  input[type="number"] {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-header-bg);
    color: var(--outline-text);
    font-size: 14px;
  }

  select {
    padding: 4px 8px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-header-bg);
    color: var(--outline-text);
    font-size: 14px;
    cursor: pointer;
  }
</style>
