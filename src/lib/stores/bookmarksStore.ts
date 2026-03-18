/**
 * 书签存储
 * 管理书签数据的添加、删除、更新和查询
 */

import { writable, get } from 'svelte/store';
import type { Bookmark, BookmarksData, BookmarksExport } from '../types';
import type { Platform } from '../types';
import { getCurrentPlatform, getConversationId, getConversationName } from '../services/conversationService';
import { createTaggedLogger } from '../services/logger';

const STORAGE_KEY = 'chat-outline-bookmarks';
const EXPORT_VERSION = '1.0.0';

const gmLogger = createTaggedLogger('Bookmarks');

/**
 * 生成唯一ID
 */
function generateBookmarkId(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 从 localStorage 加载书签数据
 */
function loadBookmarksFromStorage(): BookmarksData {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {};
    }
    const data = JSON.parse(saved) as BookmarksData;
    gmLogger.debug('从 localStorage 加载书签', { conversationCount: Object.keys(data).length });
    return data;
  } catch (error) {
    gmLogger.warn('加载书签失败', error);
    return {};
  }
}

/**
 * 保存书签数据到 localStorage
 */
function saveBookmarksToStorage(data: BookmarksData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    gmLogger.debug('书签已保存到 localStorage');
  } catch (error) {
    gmLogger.error('保存书签失败', error);
  }
}

/**
 * 书签数据 Store
 */
function createBookmarksStore() {
  const { subscribe, set, update } = writable<BookmarksData>(loadBookmarksFromStorage());

  // 自动保存到 localStorage
  subscribe(data => {
    saveBookmarksToStorage(data);
  });

  return {
    subscribe,
    
    /**
     * 添加书签
     */
    addBookmark(params: {
      name: string;
      conversationId: string;
      outlineItemType: 'message' | 'header';
      messageHash: string;
      messageIndex: number;
    }): Bookmark {
      const platform = getCurrentPlatform();
      const bookmark: Bookmark = {
        id: generateBookmarkId(),
        name: params.name,
        conversationId: params.conversationId,
        platform,
        outlineItemType: params.outlineItemType,
        messageHash: params.messageHash,
        messageIndex: params.messageIndex,
        createdAt: Date.now()
      };

      update(data => {
        if (!data[params.conversationId]) {
          data[params.conversationId] = [];
        }
        data[params.conversationId].push(bookmark);
        return { ...data };
      });

      gmLogger.info('添加书签', { id: bookmark.id, name: bookmark.name });
      return bookmark;
    },
    
    /**
     * 删除书签
     */
    removeBookmark(bookmarkId: string): void {
      update(data => {
        for (const conversationId of Object.keys(data)) {
          const index = data[conversationId].findIndex(b => b.id === bookmarkId);
          if (index !== -1) {
            data[conversationId].splice(index, 1);
            // 如果会话下没有书签了，删除该会话条目
            if (data[conversationId].length === 0) {
              delete data[conversationId];
            }
            gmLogger.info('删除书签', { id: bookmarkId });
            break;
          }
        }
        return { ...data };
      });
    },
    
    /**
     * 更新书签名称
     */
    updateBookmarkName(bookmarkId: string, newName: string): void {
      update(data => {
        for (const conversationId of Object.keys(data)) {
          const bookmark = data[conversationId].find(b => b.id === bookmarkId);
          if (bookmark) {
            bookmark.name = newName;
            gmLogger.info('更新书签名称', { id: bookmarkId, newName });
            break;
          }
        }
        return { ...data };
      });
    },
    
    /**
     * 获取指定会话的书签列表
     */
    getBookmarksByConversation(conversationId: string): Bookmark[] {
      const data = get({ subscribe });
      return data[conversationId] || [];
    },
    
    /**
     * 获取当前会话的书签列表
     */
    getCurrentConversationBookmarks(): Bookmark[] {
      const conversationId = getConversationId();
      return this.getBookmarksByConversation(conversationId);
    },
    
    /**
     * 获取所有书签（扁平化列表）
     */
    getAllBookmarks(): Bookmark[] {
      const data = get({ subscribe });
      return Object.values(data).flat();
    },
    
    /**
     * 获取所有书签（按会话分组）
     */
    getAllBookmarksGrouped(): BookmarksData {
      return get({ subscribe });
    },
    
    /**
     * 按平台过滤书签
     */
    filterByPlatform(platform: Platform): Bookmark[] {
      const data = get({ subscribe });
      return Object.values(data)
        .flat()
        .filter(b => b.platform === platform);
    },
    
    /**
     * 搜索书签（按名称）
     */
    searchBookmarks(query: string, conversationId?: string): Bookmark[] {
      const data = get({ subscribe });
      const lowerQuery = query.toLowerCase();
      
      const searchInList = (bookmarks: Bookmark[]): Bookmark[] => {
        return bookmarks.filter(b => b.name.toLowerCase().includes(lowerQuery));
      };
      
      if (conversationId) {
        return searchInList(data[conversationId] || []);
      }
      
      return searchInList(Object.values(data).flat());
    },
    
    /**
     * 检查指定消息索引是否已有书签
     */
    hasBookmarkForMessageIndex(messageIndex: number, conversationId?: string): boolean {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId] || [];
      return bookmarks.some(b => b.messageIndex === messageIndex);
    },
    
    /**
     * 获取指定消息索引的书签
     */
    getBookmarkByMessageIndex(messageIndex: number, conversationId?: string): Bookmark | undefined {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId] || [];
      return bookmarks.find(b => b.messageIndex === messageIndex);
    },
    
    /**
     * 导出书签
     */
    exportBookmarks(): BookmarksExport {
      const data = get({ subscribe });
      return {
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        platform: getCurrentPlatform(),
        bookmarks: { ...data }
      };
    },
    
    /**
     * 导入书签
     */
    importBookmarks(exportData: BookmarksExport, merge = true): number {
      const importedBookmarks: Bookmark[] = [];
      
      update(data => {
        for (const [conversationId, bookmarks] of Object.entries(exportData.bookmarks)) {
          if (!merge) {
            // 覆盖模式
            data[conversationId] = bookmarks;
            importedBookmarks.push(...bookmarks);
          } else {
            // 合并模式
            if (!data[conversationId]) {
              data[conversationId] = [];
            }
            for (const bookmark of bookmarks) {
              // 检查是否已存在相同 messageIndex 的书签
              const exists = data[conversationId].some(
                b => b.messageIndex === bookmark.messageIndex
              );
              if (!exists) {
                data[conversationId].push(bookmark);
                importedBookmarks.push(bookmark);
              }
            }
          }
        }
        return { ...data };
      });
      
      gmLogger.info('导入书签', { count: importedBookmarks.length, merge });
      return importedBookmarks.length;
    },
    
    /**
     * 清空所有书签
     */
    clearAll(): void {
      set({});
      gmLogger.info('清空所有书签');
    },
    
    /**
     * 清空指定会话的书签
     */
    clearConversation(conversationId: string): void {
      update(data => {
        delete data[conversationId];
        return { ...data };
      });
      gmLogger.info('清空会话书签', { conversationId });
    }
  };
}

export const bookmarksStore = createBookmarksStore();

/**
 * 书签统计信息
 */
export function getBookmarksStats(): {
  total: number;
  byConversation: { [conversationId: string]: number };
} {
  const data = get(bookmarksStore);
  const byConversation: { [conversationId: string]: number } = {};
  let total = 0;
  
  for (const [conversationId, bookmarks] of Object.entries(data)) {
    byConversation[conversationId] = bookmarks.length;
    total += bookmarks.length;
  }
  
  return { total, byConversation };
}