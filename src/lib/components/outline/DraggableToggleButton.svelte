<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { logger } from '../../services/logger';

  interface Props {
    onClick: () => void;
    title?: string;
    ariaLabel?: string;
  }

  let { onClick, title = '显示对话大纲', ariaLabel = '显示对话大纲' }: Props = $props();

  const STORAGE_KEY = 'chat_outline_button_position';
  const BUTTON_SIZE = 40;

  // 按钮位置（相对于视口顶部的百分比，0-100）
  let positionY = $state(50); // 默认居中
  let isDragging = $state(false);
  let dragStartY = $state(0);
  let initialPositionY = $state(0);

  // 从 localStorage 加载位置
  function loadPosition() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.y === 'number') {
          positionY = Math.max(0, Math.min(100, parsed.y));
        }
      }
    } catch (e) {
      logger.warn('Failed to load button position:', e);
    }
  }

  // 保存位置到 localStorage
  function savePosition() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ y: positionY }));
    } catch (e) {
      logger.warn('Failed to save button position:', e);
    }
  }

  // 处理鼠标按下事件
  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    dragStartY = event.clientY;
    initialPositionY = positionY;

    // 添加全局事件监听
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 阻止默认行为，防止选中文本等
    event.preventDefault();
  }

  // 处理触摸开始事件
  function handleTouchStart(event: TouchEvent) {
    isDragging = true;
    dragStartY = event.touches[0].clientY;
    initialPositionY = positionY;

    // 添加全局事件监听
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // 阻止默认行为
    event.preventDefault();
  }

  // 处理鼠标移动事件
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    updatePosition(event.clientY);
  }

  // 处理触摸移动事件
  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) return;
    updatePosition(event.touches[0].clientY);
    event.preventDefault();
  }

  // 更新按钮位置
  function updatePosition(clientY: number) {
    const deltaY = clientY - dragStartY;
    const viewportHeight = window.innerHeight;

    // 将像素偏移转换为百分比
    const deltaPercent = (deltaY / viewportHeight) * 100;
    let newPosition = initialPositionY + deltaPercent;

    // 限制位置不超出屏幕
    // 考虑到按钮高度，确保按钮不会完全移出视口
    const minPosition = (BUTTON_SIZE / 2 / viewportHeight) * 100; // 顶部留一半按钮可见
    const maxPosition = 100 - (BUTTON_SIZE / 2 / viewportHeight) * 100; // 底部留一半按钮可见

    positionY = Math.max(minPosition, Math.min(maxPosition, newPosition));
  }

  // 处理鼠标释放事件
  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      savePosition();
      cleanupListeners();
    }
  }

  // 处理触摸结束事件
  function handleTouchEnd() {
    if (isDragging) {
      isDragging = false;
      savePosition();
      cleanupListeners();
    }
  }

  // 清理事件监听器
  function cleanupListeners() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  }

  // 处理点击事件（区分拖拽和点击）
  let dragThreshold = 5; // 像素阈值，超过此值视为拖拽而非点击
  let hasDragged = $state(false);

  function handleClick() {
    if (!hasDragged) {
      onClick();
    }
  }

  // 在拖拽开始时重置标志
  $effect(() => {
    if (isDragging) {
      hasDragged = false;
    }
  });

  // 监听位置变化来判断是否发生了拖拽
  $effect(() => {
    if (isDragging && Math.abs(positionY - initialPositionY) > dragThreshold) {
      hasDragged = true;
    }
  });

  // 窗口大小改变时重新计算边界
  function handleResize() {
    const viewportHeight = window.innerHeight;
    const minPosition = (BUTTON_SIZE / 2 / viewportHeight) * 100;
    const maxPosition = 100 - (BUTTON_SIZE / 2 / viewportHeight) * 100;

    // 如果当前位置超出边界，调整到边界内
    if (positionY < minPosition) {
      positionY = minPosition;
      savePosition();
    } else if (positionY > maxPosition) {
      positionY = maxPosition;
      savePosition();
    }
  }

  onMount(() => {
    loadPosition();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    cleanupListeners();
    window.removeEventListener('resize', handleResize);
  });
</script>

<button
  id="show-outline-btn"
  class="draggable-toggle-button"
  class:is-dragging={isDragging}
  style="top: {positionY}%; transform: translateY(-50%)"
  onclick={handleClick}
  onmousedown={handleMouseDown}
  ontouchstart={handleTouchStart}
  {title}
  aria-label={ariaLabel}
>
  📋
</button>

<style>
  .draggable-toggle-button {
    position: fixed;
    right: 2px;
    background: var(--outline-bg);
    border: 1px solid var(--outline-border);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 16px;
    color: var(--outline-text);
    box-shadow: 0 2px 8px var(--outline-shadow);
    transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .draggable-toggle-button:hover {
    background: var(--outline-border);
    box-shadow: 0 4px 12px var(--outline-shadow);
  }

  .draggable-toggle-button.is-dragging {
    cursor: grabbing;
    box-shadow: 0 6px 16px var(--outline-shadow);
    transition: none; /* 拖拽时禁用过渡，使移动更流畅 */
  }

  .draggable-toggle-button:not(.is-dragging):hover {
    transform: translateY(-50%) scale(1.1);
  }

  /* 拖拽时的视觉反馈 */
  .draggable-toggle-button:active {
    cursor: grabbing;
  }
</style>
