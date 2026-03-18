/**
 * 书签上下文管理器
 * 用于管理右键菜单的显示和添加书签弹窗
 */

import { writable, get } from 'svelte/store';
import { bookmarksStore, featuresStore } from '../stores';
import type { ContextMenuContext, Bookmark } from '../types';
import { getConversationId } from './conversationService';

/**
 * 菜单项定义
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * 右键菜单状态
 */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  context: ContextMenuContext | null;
  bookmark: Bookmark | null; // 用于书签列表的右键菜单
}

/**
 * 添加书签弹窗状态
 */
export interface AddBookmarkModalState {
  visible: boolean;
  context: ContextMenuContext | null;
}

/**
 * 重命名书签弹窗状态
 */
export interface RenameBookmarkModalState {
  visible: boolean;
  bookmark: Bookmark | null;
}

// 右键菜单状态 store
export const contextMenuState = writable<ContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  context: null,
  bookmark: null
});

// 添加书签弹窗状态 store
export const addBookmarkModalState = writable<AddBookmarkModalState>({
  visible: false,
  context: null
});

// 重命名书签弹窗状态 store
export const renameBookmarkModalState = writable<RenameBookmarkModalState>({
  visible: false,
  bookmark: null
});

/**
 * 显示大纲项右键菜单
 */
export function showContextMenu(event: MouseEvent, context: ContextMenuContext): void {
  event.preventDefault();
  event.stopPropagation();

  const hasBookmark = bookmarksStore.hasBookmarkForMessageId(context.messageId);
  const existingBookmark = bookmarksStore.getBookmarkByMessageId(context.messageId);

  const items: MenuItem[] = [];

  if (hasBookmark && existingBookmark) {
    // 已有书签：显示删除选项
    items.push({
      id: 'delete',
      label: '删除书签',
      icon: '🗑️',
      danger: true
    });
    items.push({
      id: 'rename',
      label: '重命名',
      icon: '✏️'
    });
  } else {
    // 无书签：显示添加选项
    items.push({
      id: 'add',
      label: '添加书签',
      icon: '🔖'
    });
  }

  contextMenuState.set({
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    context,
    bookmark: existingBookmark ?? null
  });
}

/**
 * 显示书签列表项右键菜单
 */
export function showBookmarkContextMenu(event: MouseEvent, bookmark: Bookmark): void {
  event.preventDefault();
  event.stopPropagation();

  const items: MenuItem[] = [
    {
      id: 'navigate',
      label: '跳转到书签',
      icon: '📍'
    },
    {
      id: 'rename',
      label: '重命名',
      icon: '✏️'
    },
    {
      id: 'delete',
      label: '删除书签',
      icon: '🗑️',
      danger: true
    }
  ];

  contextMenuState.set({
    visible: true,
    x: event.clientX,
    y: event.clientY,
    items,
    context: null,
    bookmark
  });
}

/**
 * 隐藏右键菜单
 */
export function hideContextMenu(): void {
  contextMenuState.set({
    visible: false,
    x: 0,
    y: 0,
    items: [],
    context: null,
    bookmark: null
  });
}

/**
 * 处理菜单项选择
 */
export function handleMenuSelect(itemId: string): { action: string; bookmark?: Bookmark } {
  const state = get(contextMenuState);
  const resultBookmark = state.bookmark ? state.bookmark : undefined;
  const result = { action: itemId, bookmark: resultBookmark };

  switch (itemId) {
    case 'add':
      // 显示添加书签弹窗
      if (state.context) {
        addBookmarkModalState.set({
          visible: true,
          context: state.context
        });
      }
      break;

    case 'delete':
      // 删除书签
      if (state.bookmark) {
        bookmarksStore.removeBookmark(state.bookmark.id);
      } else if (state.context) {
        const bookmark = bookmarksStore.getBookmarkByMessageId(state.context.messageId);
        if (bookmark) {
          bookmarksStore.removeBookmark(bookmark.id);
        }
      }
      break;

    case 'rename':
      // 显示重命名弹窗
      if (state.bookmark) {
        renameBookmarkModalState.set({
          visible: true,
          bookmark: state.bookmark
        });
      } else if (state.context) {
        const bookmark = bookmarksStore.getBookmarkByMessageId(state.context.messageId);
        if (bookmark) {
          renameBookmarkModalState.set({
            visible: true,
            bookmark
          });
        }
      }
      break;

    case 'navigate':
      // 跳转由外部处理
      break;
  }

  hideContextMenu();
  return result;
}

/**
 * 隐藏添加书签弹窗
 */
export function hideAddBookmarkModal(): void {
  addBookmarkModalState.set({
    visible: false,
    context: null
  });
}

/**
 * 隐藏重命名书签弹窗
 */
export function hideRenameBookmarkModal(): void {
  renameBookmarkModalState.set({
    visible: false,
    bookmark: null
  });
}

/**
 * 获取默认书签名称长度
 */
export function getDefaultNameLength(): number {
  return get(featuresStore).bookmarkGetTextLength || 20;
}

/**
 * 构建大纲元素的上下文信息
 */
export function buildOutlineItemContext(
  messageId: string,
  outlineItemType: 'message' | 'header',
  messageIndex: number,
  messageText: string,
  messageHash: string,
  element: Element
): ContextMenuContext {
  return {
    messageId,
    outlineItemType,
    messageIndex,
    messageText,
    messageHash,
    element
  };
}