/**
 * 书签导航服务
 * 负责处理书签跳转逻辑
 */

import { get } from 'svelte/store';
import { bookmarksStore, parserConfigStore } from '../stores';
import type { Bookmark, PendingNavigation } from '../types';
import { getConversationId, isInConversation, buildConversationUrl } from './conversationService';
import { messageCacheManager } from './messageCacheManager';
import { scrollSyncService } from './scrollSyncService';
import { highlightElement } from '../utils';
import { pushPanelNotice } from '../stores/panelStatus';
import { createTaggedLogger } from './logger';

const logger = createTaggedLogger('BookmarkNav');

const PENDING_NAV_KEY = 'chat-outline-pending-nav';
const NAV_TIMEOUT = 30000; // 30秒超时

/**
 * 导航结果
 */
export interface NavigationResult {
  success: boolean;
  message: string;
  needsRedirect?: boolean;
  redirectUrl?: string;
}

/**
 * 书签导航服务
 */
export class BookmarkNavigationService {
  /**
   * 导航到书签位置
   */
  async navigateToBookmark(bookmark: Bookmark): Promise<NavigationResult> {
    const currentConversationId = getConversationId();

    // 检查是否需要跨会话跳转
    if (!isInConversation(bookmark.conversationId)) {
      return this.handleCrossConversationNavigation(bookmark);
    }

    // 当前会话，直接执行跳转
    return this.executeNavigation(bookmark);
  }

  /**
   * 处理跨会话跳转
   */
  private handleCrossConversationNavigation(bookmark: Bookmark): NavigationResult {
    const config = get(parserConfigStore);
    if (!config?.buildConversationUrl) {
      return {
        success: false,
        message: '当前平台不支持跨会话跳转'
      };
    }

    const targetUrl = config.buildConversationUrl(bookmark.conversationId);
    if (!targetUrl) {
      return {
        success: false,
        message: '无法构建目标会话URL'
      };
    }

    // 保存待跳转信息到 sessionStorage
    const pendingNav: PendingNavigation = {
      bookmarkId: bookmark.id,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(PENDING_NAV_KEY, JSON.stringify(pendingNav));
      logger.info('保存待跳转书签', { bookmarkId: bookmark.id });

      return {
        success: true,
        message: '正在跳转到目标会话...',
        needsRedirect: true,
        redirectUrl: targetUrl
      };
    } catch (error) {
      logger.error('保存待跳转信息失败', error);
      return {
        success: false,
        message: '保存跳转信息失败'
      };
    }
  }

  /**
   * 执行跳转（当前会话内）
   */
  private async executeNavigation(bookmark: Bookmark): Promise<NavigationResult> {
    const cache = messageCacheManager.getCache();

    // 查找对应的消息
    const cachedItem = cache.find(item => item.outlineItem.id === bookmark.outlineItemId);

    if (!cachedItem) {
      // 尝试通过消息索引查找
      const byIndex = cache[bookmark.messageIndex];
      if (byIndex) {
        // 找到了消息，但大纲元素ID不匹配，可能是内容发生了变化
        pushPanelNotice('内容可能已变更，尝试跳转到最近位置', 'warning', 3000);
        return this.scrollToElement(byIndex.outlineItem.element, byIndex.outlineElement);
      }

      return {
        success: false,
        message: '未找到对应内容，书签可能已失效'
      };
    }

    return this.scrollToElement(cachedItem.outlineItem.element, cachedItem.outlineElement);
  }

  /**
   * 滚动到元素并高亮
   */
  private scrollToElement(targetElement: Element, outlineElement: Element | null): NavigationResult {
    // 滚动目标元素
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(targetElement);

    // 同步大纲滚动
    if (outlineElement) {
      scrollSyncService.focusOutlineElement(outlineElement);
      outlineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return {
      success: true,
      message: '已跳转到书签位置'
    };
  }

  /**
   * 检查并恢复待跳转的书签
   * 应在页面加载后调用
   */
  checkAndResumePendingNavigation(): Bookmark | null {
    try {
      const saved = sessionStorage.getItem(PENDING_NAV_KEY);
      if (!saved) {
        return null;
      }

      const pendingNav = JSON.parse(saved) as PendingNavigation;

      // 检查是否超时
      if (Date.now() - pendingNav.timestamp > NAV_TIMEOUT) {
        logger.warn('待跳转书签已超时');
        sessionStorage.removeItem(PENDING_NAV_KEY);
        return null;
      }

      // 清除 sessionStorage
      sessionStorage.removeItem(PENDING_NAV_KEY);

      // 查找书签
      const allBookmarks = bookmarksStore.getAllBookmarks();
      const bookmark = allBookmarks.find(b => b.id === pendingNav.bookmarkId);

      if (!bookmark) {
        logger.warn('未找到待跳转的书签', { bookmarkId: pendingNav.bookmarkId });
        return null;
      }

      logger.info('恢复待跳转书签', { bookmarkId: bookmark.id, name: bookmark.name });
      return bookmark;
    } catch (error) {
      logger.error('检查待跳转书签失败', error);
      return null;
    }
  }

  /**
   * 执行待跳转书签的导航
   */
  async resumeNavigation(bookmark: Bookmark): Promise<void> {
    // 等待大纲初始化完成
    await this.waitForOutlineReady();

    const result = await this.executeNavigation(bookmark);

    if (result.success) {
      pushPanelNotice(result.message, 'success', 2000);
    } else {
      pushPanelNotice(result.message, 'error', 3000);
    }
  }

  /**
   * 等待大纲准备就绪
   */
  private waitForOutlineReady(timeout = 5000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        const cache = messageCacheManager.getCache();
        if (cache.length > 0 && cache.some(item => item.outlineElement !== null)) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          logger.warn('等待大纲超时');
          resolve();
          return;
        }

        setTimeout(check, 100);
      };
      check();
    });
  }

  /**
   * 执行跨会话跳转
   */
  executeRedirect(url: string): void {
    logger.info('执行跨会话跳转', { url });
    window.location.href = url;
  }
}

export const bookmarkNavigationService = new BookmarkNavigationService();