<script lang="ts">
  import { bookmarksStore } from '../../stores';
  import type { Bookmark } from '../../types';

  interface Props {
    bookmark: Bookmark;
    onClose: () => void;
  }

  let { bookmark, onClose }: Props = $props();

  let newName = $state('');
  let isSubmitting = $state(false);

  // 当 bookmark 变化时更新 newName
  $effect(() => {
    newName = bookmark.name;
  });

  function handleSubmit() {
    if (isSubmitting || !newName.trim()) return;

    isSubmitting = true;
    bookmarksStore.updateBookmarkName(bookmark.id, newName.trim());
    isSubmitting = false;
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && newName.trim()) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleOverlayKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={handleOverlayClick} onkeydown={handleOverlayKeydown} role="dialog" aria-modal="true" tabindex="-1">
  <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
    <div class="modal-header">
      <h3>✏️ 重命名书签</h3>
      <button class="close-btn" onclick={onClose}>✕</button>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label for="bookmark-name">书签名称</label>
        <input
          id="bookmark-name"
          type="text"
          bind:value={newName}
          maxlength="100"
        />
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick={onClose}>
        取消
      </button>
      <button
        class="btn btn-primary"
        onclick={handleSubmit}
        disabled={isSubmitting || !newName.trim()}
      >
        {isSubmitting ? '保存中...' : '保存'}
      </button>
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
    z-index: 100000;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: var(--outline-bg);
    border: 1px solid var(--outline-border);
    border-radius: 8px;
    width: 340px;
    max-width: 90vw;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.15s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid var(--outline-border);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--outline-text);
    font-size: 14px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: var(--outline-text);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.15s;
  }

  .close-btn:hover {
    background: var(--outline-border);
  }

  .modal-body {
    padding: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    color: var(--outline-text);
    font-size: 13px;
    font-weight: 500;
  }

  .form-group input {
    padding: 8px 10px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-bg);
    color: var(--outline-text);
    font-size: 13px;
    transition: border-color 0.15s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--outline-primary, #007acc);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 15px;
    border-top: 1px solid var(--outline-border);
  }

  .btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-secondary {
    background: none;
    border: 1px solid var(--outline-border);
    color: var(--outline-text);
  }

  .btn-secondary:hover {
    background: var(--outline-border);
  }

  .btn-primary {
    background: var(--outline-primary, #007acc);
    border: 1px solid var(--outline-primary, #007acc);
    color: white;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>