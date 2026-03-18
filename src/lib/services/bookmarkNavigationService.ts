/**
 * 书签导航服务
 * 负责处理书签跳转逻辑
 */

import { get } from 'svelte/store';
import { bookmarksStore, parserConfigStore } from '../stores';
import type { Bookmark, PendingNavigation, HeaderTreeNode } from '../types';
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
   * 定位策略：
   * 1. 通过 messageIndex 找到消息位置
   * 2. 用 hash 验证内容是否变更
   * 3. 如果是 header 类型，根据 headerPath 找到对应标题
   */
  private async executeNavigation(bookmark: Bookmark): Promise<NavigationResult> {
    const cache = messageCacheManager.getCache();

    // 1. 通过消息索引查找
    const cachedItem = cache[bookmark.messageIndex];

    if (cachedItem) {
      // 找到了消息，验证 hash 是否一致
      const currentHash = cachedItem.messageHash;
      if (currentHash !== bookmark.messageHash) {
        // 内容已变更，弹出警告
        pushPanelNotice('内容已变更，书签位置可能不准确', 'warning', 3000);
      }

      // 如果是 header 类型且有 headerPath，尝试定位到具体标题
      if (bookmark.outlineItemType === 'header' && bookmark.headerPath) {
        const headerNode = this.findHeaderByPath(
          cachedItem.outlineItem.headers || [],
          bookmark.headerPath
        );
        if (headerNode) {
          // 获取 header 对应的大纲元素
          const headerOutlineElement = scrollSyncService.getHeaderOutlineElement(headerNode.id);
          return this.scrollToElement(headerNode.element, headerOutlineElement || cachedItem.outlineElement);
        }
        // 找不到标题，跳转到消息位置
        pushPanelNotice('标题结构已变更，跳转到消息位置', 'warning', 3000);
      }

      return this.scrollToElement(cachedItem.outlineItem.element, cachedItem.outlineElement);
    }

    // 2. 索引超出范围，尝试找最后一条消息
    if (cache.length > 0) {
      const lastItem = cache[cache.length - 1];
      pushPanelNotice('消息索引超出范围，跳转到最近位置', 'warning', 3000);
      return this.scrollToElement(lastItem.outlineItem.element, lastItem.outlineElement);
    }

    return {
      success: false,
      message: '未找到对应内容，书签可能已失效'
    };
  }

  /**
   * 根据路径查找标题节点
   * @param headers 标题树
   * @param headerPath 路径，如 "0.1.2"
   * @returns 返回找到的 HeaderTreeNode，未找到返回 null
   */
  private findHeaderByPath(headers: HeaderTreeNode[], headerPath: string): HeaderTreeNode | null {
    if (!headerPath) return null;

    const indices = headerPath.split('.').map(s => parseInt(s, 10));
    let currentNodes = headers;
    let targetNode: HeaderTreeNode | null = null;

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (index < 0 || index >= currentNodes.length) {
        logger.warn('标题路径索引越界', { headerPath, index, level: i });
        return null;
      }

      targetNode = currentNodes[index];
      currentNodes = targetNode.children;
    }

    return targetNode;
  }

  /**
   * 滚动到元素并高亮
   */
  private scrollToElement(targetElement: Element, outlineElement: Element | null): NavigationResult {
    // 滚动目标元素
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightElement(targetElement);

    // 同步大纲滚动并高亮
    if (outlineElement) {
      scrollSyncService.focusOutlineElement(outlineElement);
      scrollSyncService.applyOutlineFocus(outlineElement);
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

      logger.info('恢复待跳转书签', { 
        bookmarkId: bookmark.id, 
        name: bookmark.name,
        headerPath: bookmark.headerPath 
      });
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