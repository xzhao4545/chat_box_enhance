<script lang="ts">
  import { bookmarksStore } from '../../stores';
  import type { ContextMenuContext } from '../../types';

  interface Props {
    context: ContextMenuContext;
    defaultNameLength: number;
    onClose: () => void;
    onAdded?: () => void;
  }

  let { context, defaultNameLength, onClose, onAdded }: Props = $props();

  // 默认名称：取消息前 N 个字符
  let defaultName = $derived(
    context.messageText.substring(0, defaultNameLength) + 
    (context.messageText.length > defaultNameLength ? '...' : '')
  );

  let customName = $state('');
  let isSubmitting = $state(false);

  // 是否已存在书签
  let hasExistingBookmark = $derived(
    bookmarksStore.hasBookmarkForMessageIndex(context.messageIndex)
  );

  // 最终使用的名称
  let finalName = $derived(customName.trim() || defaultName);

  function handleSubmit() {
    if (isSubmitting || hasExistingBookmark) return;

    isSubmitting = true;

    import('../../services/conversationService').then(({ getConversationId }) => {
      const conversationId = getConversationId();

      bookmarksStore.addBookmark({
        name: finalName,
        conversationId,
        outlineItemType: context.outlineItemType,
        messageHash: context.messageHash,
        messageIndex: context.messageIndex
      });

      isSubmitting = false;
      onAdded?.();
      onClose();
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !hasExistingBookmark) {
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
      <h3>🔖 添加书签</h3>
      <button class="close-btn" onclick={onClose}>✕</button>
    </div>

    <div class="modal-body">
      {#if hasExistingBookmark}
        <div class="warning-message">
          ⚠️ 该位置已存在书签，无法重复添加
        </div>
      {:else}
        <div class="form-group">
          <label for="bookmark-name">书签名称</label>
          <input
            id="bookmark-name"
            type="text"
            placeholder={defaultName}
            bind:value={customName}
            maxlength="100"
          />
          <span class="hint">
            留空则使用默认名称：{defaultName}
          </span>
        </div>

        <div class="preview">
          <span class="preview-label">预览：</span>
          <span class="preview-name">{finalName}</span>
        </div>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick={onClose}>
        取消
      </button>
      {#if !hasExistingBookmark}
        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '添加中...' : '确定'}
        </button>
      {/if}
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
    width: 380px;
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
    padding: 15px;
    border-bottom: 1px solid var(--outline-border);
  }

  .modal-header h3 {
    margin: 0;
    color: var(--outline-text);
    font-size: 16px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
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
    padding: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    color: var(--outline-text);
    font-size: 14px;
    font-weight: 500;
  }

  .form-group input {
    padding: 8px 12px;
    border: 1px solid var(--outline-border);
    border-radius: 4px;
    background: var(--outline-bg);
    color: var(--outline-text);
    font-size: 14px;
    transition: border-color 0.15s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--outline-primary, #007acc);
  }

  .hint {
    font-size: 12px;
    color: var(--outline-text);
    opacity: 0.7;
  }

  .preview {
    margin-top: 15px;
    padding: 10px;
    background: var(--outline-header-bg);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-label {
    font-size: 12px;
    color: var(--outline-text);
    opacity: 0.7;
  }

  .preview-name {
    font-size: 14px;
    color: var(--outline-text);
    font-weight: 500;
    word-break: break-all;
  }

  .warning-message {
    padding: 12px;
    background: rgba(255, 193, 7, 0.15);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 4px;
    color: var(--outline-text);
    font-size: 14px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 15px;
    border-top: 1px solid var(--outline-border);
  }

  .btn {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
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