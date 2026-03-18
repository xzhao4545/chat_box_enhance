/**
 * 书签存储
 * 管理书签数据的添加、删除、更新和查询
 */

import { writable, get } from 'svelte/store';
import type { Bookmark, BookmarksData, BookmarksExport, ConversationBookmarks } from '../types';
import { getConversationId, getConversationName, getCurrentPlatform } from '../services/conversationService';
import { createTaggedLogger } from '../services/logger';

const STORAGE_KEY = 'chat-outline-bookmarks';
const EXPORT_VERSION = '2.0.0';

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
    const parsed = JSON.parse(saved);
    
    // 兼容旧版本数据格式（v1.x）
    // 旧格式: { [conversationId]: Bookmark[] }
    // 新格式: { [conversationId]: { name: string | null, bookmarks: Bookmark[] } }
    const data: BookmarksData = {};
    for (const [conversationId, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        // 旧格式，迁移到新格式
        data[conversationId] = {
          name: null,
          bookmarks: (value as Bookmark[]).map(b => ({
            id: b.id,
            name: b.name,
            outlineItemType: b.outlineItemType,
            messageIndex: b.messageIndex,
            messageHash: b.messageHash,
            headerPath: b.headerPath,
            createdAt: b.createdAt
          }))
        };
      } else {
        // 新格式
        data[conversationId] = value as ConversationBookmarks;
      }
    }
    
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
      headerPath?: string;
    }): Bookmark {
      const bookmark: Bookmark = {
        id: generateBookmarkId(),
        name: params.name,
        outlineItemType: params.outlineItemType,
        messageHash: params.messageHash,
        messageIndex: params.messageIndex,
        headerPath: params.headerPath,
        createdAt: Date.now()
      };

      update(data => {
        if (!data[params.conversationId]) {
          // 首次创建该会话的书签，获取会话名
          const convName = getConversationName();
          data[params.conversationId] = {
            name: convName,
            bookmarks: []
          };
        }
        data[params.conversationId].bookmarks.push(bookmark);
        return { ...data };
      });

      gmLogger.info('添加书签', { id: bookmark.id, name: bookmark.name, headerPath: params.headerPath });
      return bookmark;
    },
    
    /**
     * 删除书签
     */
    removeBookmark(bookmarkId: string): void {
      update(data => {
        for (const conversationId of Object.keys(data)) {
          const index = data[conversationId].bookmarks.findIndex(b => b.id === bookmarkId);
          if (index !== -1) {
            data[conversationId].bookmarks.splice(index, 1);
            // 如果会话下没有书签了，删除该会话条目
            if (data[conversationId].bookmarks.length === 0) {
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
          const bookmark = data[conversationId].bookmarks.find(b => b.id === bookmarkId);
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
      return data[conversationId]?.bookmarks || [];
    },
    
    /**
     * 获取指定会话的信息（名称和书签列表）
     */
    getConversationData(conversationId: string): ConversationBookmarks | undefined {
      const data = get({ subscribe });
      return data[conversationId];
    },
    
    /**
     * 获取当前会话的书签列表
     */
    getCurrentConversationBookmarks(): Bookmark[] {
      const conversationId = getConversationId();
      return this.getBookmarksByConversation(conversationId);
    },
    
    /**
     * 获取所有书签（扁平化列表，包含会话ID）
     */
    getAllBookmarks(): Array<Bookmark & { conversationId: string }> {
      const data = get({ subscribe });
      const result: Array<Bookmark & { conversationId: string }> = [];
      for (const [conversationId, convData] of Object.entries(data)) {
        for (const bookmark of convData.bookmarks) {
          result.push({ ...bookmark, conversationId });
        }
      }
      return result;
    },
    
    /**
     * 获取所有书签（按会话分组）
     */
    getAllBookmarksGrouped(): BookmarksData {
      return get({ subscribe });
    },
    
    /**
     * 获取所有会话信息列表（用于书签面板展示）
     */
    getAllConversations(): Array<{ conversationId: string; name: string | null; bookmarkCount: number }> {
      const data = get({ subscribe });
      return Object.entries(data).map(([conversationId, convData]) => ({
        conversationId,
        name: convData.name,
        bookmarkCount: convData.bookmarks.length
      }));
    },
    
    /**
     * 搜索书签（按名称）
     */
    searchBookmarks(query: string, conversationId?: string): Array<Bookmark & { conversationId: string }> {
      const data = get({ subscribe });
      const lowerQuery = query.toLowerCase();
      
      const result: Array<Bookmark & { conversationId: string }> = [];
      
      const searchInConv = (convId: string, bookmarks: Bookmark[]) => {
        for (const b of bookmarks) {
          if (b.name.toLowerCase().includes(lowerQuery)) {
            result.push({ ...b, conversationId: convId });
          }
        }
      };
      
      if (conversationId) {
        const convData = data[conversationId];
        if (convData) {
          searchInConv(conversationId, convData.bookmarks);
        }
      } else {
        for (const [convId, convData] of Object.entries(data)) {
          searchInConv(convId, convData.bookmarks);
        }
      }
      
      return result;
    },
    
    /**
     * 检查指定消息索引是否已有书签（仅 message 类型）
     */
    hasBookmarkForMessageIndex(messageIndex: number, conversationId?: string): boolean {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.some(b => b.messageIndex === messageIndex && b.outlineItemType === 'message');
    },
    
    /**
     * 检查指定标题是否已有书签
     */
    hasBookmarkForHeader(messageIndex: number, headerPath: string, conversationId?: string): boolean {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.some(b => 
        b.messageIndex === messageIndex && 
        b.outlineItemType === 'header' && 
        b.headerPath === headerPath
      );
    },
    
    /**
     * 获取指定消息的书签（message 类型）
     */
    getBookmarkByMessageIndex(messageIndex: number, conversationId?: string): Bookmark | undefined {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.find(b => b.messageIndex === messageIndex && b.outlineItemType === 'message');
    },
    
    /**
     * 获取指定标题的书签
     */
    getBookmarkByHeaderPath(messageIndex: number, headerPath: string, conversationId?: string): Bookmark | undefined {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.find(b => 
        b.messageIndex === messageIndex && 
        b.outlineItemType === 'header' && 
        b.headerPath === headerPath
      );
    },
    
    /**
     * 获取指定消息索引的所有书签
     */
    getBookmarksForMessage(messageIndex: number, conversationId?: string): Bookmark[] {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.filter(b => b.messageIndex === messageIndex);
    },
    
    /**
     * 检查消息是否有任何书签
     */
    hasAnyBookmarkForMessage(messageIndex: number, conversationId?: string): boolean {
      const data = get({ subscribe });
      const convId = conversationId || getConversationId();
      const bookmarks = data[convId]?.bookmarks || [];
      return bookmarks.some(b => b.messageIndex === messageIndex);
    },
    
    /**
     * 根据 bookmarkId 获取完整的书签信息（包含 conversationId）
     */
    getBookmarkById(bookmarkId: string): (Bookmark & { conversationId: string }) | undefined {
      const data = get({ subscribe });
      for (const [conversationId, convData] of Object.entries(data)) {
        const bookmark = convData.bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
          return { ...bookmark, conversationId };
        }
      }
      return undefined;
    },
    
    /**
     * 导出书签
     */
    exportBookmarks(): BookmarksExport {
      const data = get({ subscribe });
      return {
        version: EXPORT_VERSION,
        exportedAt: Date.now(),
        data: { ...data }
      };
    },
    
    /**
     * 导入书签
     */
    importBookmarks(exportData: BookmarksExport, merge = true): number {
      let importedCount = 0;
      
      update(data => {
        for (const [conversationId, convData] of Object.entries(exportData.data)) {
          if (!merge) {
            // 覆盖模式
            data[conversationId] = convData;
            importedCount += convData.bookmarks.length;
          } else {
            // 合并模式
            if (!data[conversationId]) {
              data[conversationId] = convData;
              importedCount += convData.bookmarks.length;
            } else {
              for (const bookmark of convData.bookmarks) {
                const exists = data[conversationId].bookmarks.some(
                  b => b.messageIndex === bookmark.messageIndex && 
                       b.outlineItemType === bookmark.outlineItemType &&
                       b.headerPath === bookmark.headerPath
                );
                if (!exists) {
                  data[conversationId].bookmarks.push(bookmark);
                  importedCount++;
                }
              }
            }
          }
        }
        return { ...data };
      });
      
      gmLogger.info('导入书签', { count: importedCount, merge });
      return importedCount;
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
  
  for (const [conversationId, convData] of Object.entries(data)) {
    byConversation[conversationId] = convData.bookmarks.length;
    total += convData.bookmarks.length;
  }
  
  return { total, byConversation };
}