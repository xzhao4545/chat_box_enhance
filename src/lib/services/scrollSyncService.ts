/**
 * 滚动同步服务
 * 负责监听消息列表滚动，并同步滚动大纲列表
 */

import { get } from 'svelte/store';
import { getEleWithRetry } from '../utils';
import { featuresStore } from '../stores';
import { pushPanelNotice, setServiceStatus } from '../stores/panelStatus';
import type { ParserConfig } from '../types';
import { logger } from './logger';
import { messageCacheManager } from './messageCacheManager';

const BIND_RETRY_COUNT = 5;
const BIND_RETRY_DELAY = 1000;
const MAX_AUTO_RETRY_COUNT = 5;

type ScrollStatusState = 'idle' | 'ready' | 'warning' | 'error' | 'syncing';

interface ScrollAnchor {
  id: string;
  type: 'message' | 'header';
  targetElement: Element;
  outlineElement: Element;
  topOffset: number;
  depth: number;
}

export class ScrollSyncService {
  private scrollContainer: Element | null = null;
  private scrollHandler: ((event: Event) => void) | null = null;
  private isSyncing = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private outlineContainer: Element | null = null;
  private chatArea: Element | null = null;
  private parserConfig: ParserConfig | null = null;
  private currentHighlightedElement: Element | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;
  private lastHighlightElement: Element | null | undefined = null;
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private postRefreshCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private isBinding = false;
  private retryGeneration = 0;
  private autoRetryCount = 0;
  private lastSyncScrollEnabled: boolean | null = null;
  private lastVisibleIndex = -1;
  private intersectionObserver: IntersectionObserver | null = null;
  private visibleMessageMetrics = new Map<string, { top: number; bottom: number }>();
  private manualNavigationUntil = 0;
  private headerOutlineElements = new Map<string, Element>();
  private scrollAnchors: ScrollAnchor[] = [];

  public setLastHighlightElement(element: Element | null | undefined): void {
    this.lastHighlightElement = element;
  }

  public focusOutlineElement(outlineElement: Element | null | undefined): void {
    if (!outlineElement) {
      return;
    }

    this.manualNavigationUntil = Date.now() + 800;
    this.lastHighlightElement = outlineElement;
  }

  public registerHeaderOutlineElement(nodeId: string, outlineElement: Element): void {
    this.headerOutlineElements.set(nodeId, outlineElement);
    this.rebuildScrollAnchors();
  }

  public unregisterHeaderOutlineElement(nodeId: string): void {
    if (this.headerOutlineElements.delete(nodeId)) {
      this.rebuildScrollAnchors();
    }
  }

  constructor() {
    featuresStore.subscribe((features) => {
      if (this.lastSyncScrollEnabled === features.syncScroll) {
        return;
      }

      this.lastSyncScrollEnabled = features.syncScroll;

      if (features.syncScroll) {
        void this.bindScrollListenerWithRetry('sync-toggle', true);
      } else {
        this.clearAutoRetryTimer();
        this.unbindScrollListener();
        this.autoRetryCount = 0;
        this.updateStatus('idle', '滚动监听开关已关闭');
      }
    });
  }

  public init(chatArea: Element, parserConfig: ParserConfig): void {
    this.chatArea = chatArea;
    this.parserConfig = parserConfig;
    this.scrollContainer = null;
    this.autoRetryCount = 0;

    this.updateStatus('syncing', '正在获取滚动容器并绑定监听');
    void this.bindScrollListenerWithRetry('init', true);
  }

  public setOutlineContainer(container: Element): void {
    this.outlineContainer = container;

    if (!this.chatArea) {
      this.handleAbnormalState('warning', '大纲容器已就绪，但聊天区域尚未绑定', false);
      return;
    }

    if (this.scrollHandler) {
      this.updateStatus('ready', '滚动监听已成功绑定');
      this.triggerInitialSync();
      return;
    }

    this.updateStatus('syncing', '大纲容器已就绪，等待滚动监听绑定');
    void this.bindScrollListenerWithRetry('outline-ready', true);
  }

  public manualSync(): void {
    logger.info('手动同步大纲滚动');
    this.lastHighlightElement = null;
    this.lastVisibleIndex = -1;
    this.visibleMessageMetrics.clear();
    this.refreshAnchorOffsets();
    this.syncOutlineScroll();
  }

  public schedulePostRefreshCheck(): void {
    if (!get(featuresStore).syncScroll) {
      return;
    }

    if (this.postRefreshCheckTimer) {
      clearTimeout(this.postRefreshCheckTimer);
    }

    this.postRefreshCheckTimer = setTimeout(() => {
      this.postRefreshCheckTimer = null;
      void this.performPostRefreshCheck();
    }, 500);
  }

  public async forceRebind(): Promise<boolean> {
    if (!this.parserConfig) {
      this.handleAbnormalState('error', '未找到解析配置，无法重新绑定滚动监听', false);
      pushPanelNotice('滚动监听重新绑定失败：解析配置不存在', 'error');
      return false;
    }

    const nextChatArea = await getEleWithRetry(
      this.parserConfig.selectChatArea,
      [],
      true,
      BIND_RETRY_COUNT,
      BIND_RETRY_DELAY
    );

    if (!nextChatArea) {
      this.handleAbnormalState('error', '未找到聊天区域，无法重新绑定滚动监听', false);
      pushPanelNotice('滚动监听重新绑定失败：未找到聊天区域', 'error');
      return false;
    }

    this.chatArea = nextChatArea;
    this.autoRetryCount = 0;
    this.updateStatus('syncing', '正在重新获取滚动容器并绑定监听');

    const isBound = await this.bindScrollListenerWithRetry('manual-rebind', false, false);
    if (!isBound) {
      pushPanelNotice('滚动监听重新绑定失败，请检查页面是否已稳定', 'error');
      return false;
    }

    pushPanelNotice('滚动监听重新绑定完成', 'success');
    return true;
  }

  public rebind(chatArea: Element, parserConfig: ParserConfig): void {
    this.lastHighlightElement = null;
    this.chatArea = chatArea;
    this.parserConfig = parserConfig;
    this.scrollContainer = null;
    this.autoRetryCount = 0;
    this.disconnectIntersectionObserver();
    this.scrollAnchors = [];
    this.unbindScrollListener();

    if (!get(featuresStore).syncScroll) {
      this.updateStatus('idle', '滚动监听开关已关闭');
      return;
    }

    this.updateStatus('syncing', '正在重新获取滚动容器并绑定监听');
    void this.bindScrollListenerWithRetry('rebind', true);
  }

  public destroy(resetStatus = true): void {
    this.clearAutoRetryTimer();
    this.clearPostRefreshCheckTimer();
    this.disconnectIntersectionObserver();
    this.unbindScrollListener();

    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
      this.highlightTimer = null;
    }

    this.scrollContainer = null;
    this.outlineContainer = null;
    this.chatArea = null;
    this.parserConfig = null;
    this.currentHighlightedElement = null;
    this.lastHighlightElement = null;
    this.lastVisibleIndex = -1;
    this.visibleMessageMetrics.clear();
    this.headerOutlineElements.clear();
    this.scrollAnchors = [];
    this.manualNavigationUntil = 0;
    this.isBinding = false;
    this.retryGeneration += 1;
    this.autoRetryCount = 0;

    if (resetStatus) {
      this.updateStatus('idle', '滚动监听尚未初始化');
    }
  }

  public syncOutlineScroll(): void {
    if (!this.scrollContainer || !this.outlineContainer) {
      this.handleAbnormalState('warning', '缺少滚动容器或大纲容器，无法执行同步', false);
      return;
    }

    if (Date.now() < this.manualNavigationUntil) {
      return;
    }

    if (!this.scrollHandler) {
      this.handleAbnormalState('warning', '滚动监听未绑定，正在尝试自动重试');
      return;
    }

    const activeAnchor = this.findActiveAnchor();
    if (activeAnchor) {
      this.scrollToOutlineAnchor(activeAnchor);
      return;
    }

    const visibleIndex = this.findVisibleMessageIndex();
    if (visibleIndex === -1) {
      this.updateStatus('warning', '未找到当前可见消息，滚动监听暂不可用');
      return;
    }

    this.scrollToOutlineItem(visibleIndex);
  }

  private async bindScrollListenerWithRetry(
    reason: string,
    allowAutoRetry: boolean,
    shouldTriggerInitialSync = true
  ): Promise<boolean> {
    if (this.isBinding) {
      return false;
    }

    if (!get(featuresStore).syncScroll) {
      this.updateStatus('idle', '滚动监听开关已关闭');
      return false;
    }

    if (!this.chatArea || !this.parserConfig) {
      this.handleAbnormalState('warning', '聊天区域或解析配置未就绪，无法绑定滚动监听', false);
      return false;
    }

    this.isBinding = true;
    this.retryGeneration += 1;
    const generation = this.retryGeneration;

    this.clearAutoRetryTimer();
    this.unbindScrollListener();
    this.updateStatus('syncing', `正在绑定滚动监听（${reason}）`);

    try {
      const resolvedContainer = await this.resolveScrollContainerWithRetry();

      if (generation !== this.retryGeneration) {
        return false;
      }

      if (!resolvedContainer) {
        this.handleAbnormalState('warning', '未找到滚动容器，已进入自动重试', allowAutoRetry);
        return false;
      }

      this.scrollContainer = resolvedContainer;
      this.scrollHandler = () => {
        if (this.isSyncing) {
          return;
        }

        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
          this.syncOutlineScroll();
        }, 300);
      };

      this.scrollContainer.addEventListener('scroll', this.scrollHandler, {
        passive: true
      });

      logger.info('绑定滚动监听成功，容器:', this.scrollContainer);
      this.autoRetryCount = 0;
      this.updateStatus('ready', '滚动监听已成功绑定');
      this.observeVisibleMessages();

      if (shouldTriggerInitialSync) {
        this.triggerInitialSync();
      }

      return true;
    } catch (error) {
      logger.error('绑定滚动监听时发生异常:', error);
      this.handleAbnormalState('error', '绑定滚动监听时发生异常，已进入自动重试', allowAutoRetry);
      return false;
    } finally {
      if (generation === this.retryGeneration) {
        this.isBinding = false;
      }
    }
  }

  private async resolveScrollContainerWithRetry(): Promise<Element | null> {
    if (!this.chatArea || !this.parserConfig) {
      return null;
    }

    if (!this.parserConfig.getScrollContainer) {
      return this.chatArea;
    }

    return getEleWithRetry(
      () => this.parserConfig?.getScrollContainer?.(this.chatArea as Element) ?? null,
      [],
      true,
      BIND_RETRY_COUNT,
      BIND_RETRY_DELAY
    );
  }

  private handleAbnormalState(
    state: 'warning' | 'error',
    message: string,
    allowAutoRetry = true
  ): void {
    this.updateStatus(state, message);

    if (allowAutoRetry) {
      this.scheduleAutoRetry(message);
    }
  }

  private scheduleAutoRetry(message: string): void {
    if (!get(featuresStore).syncScroll || !this.chatArea || !this.parserConfig) {
      return;
    }

    if (this.autoRetryTimer || this.isBinding) {
      return;
    }

    if (this.autoRetryCount >= MAX_AUTO_RETRY_COUNT) {
      this.updateStatus('error', `滚动监听自动重试失败，已达 ${MAX_AUTO_RETRY_COUNT} 次上限`);
      pushPanelNotice(`滚动监听自动重试失败：${message}`, 'error');
      return;
    }

    this.autoRetryCount += 1;
    this.autoRetryTimer = setTimeout(async () => {
      this.autoRetryTimer = null;

      const isBound = await this.bindScrollListenerWithRetry(
        `auto-retry-${this.autoRetryCount}`,
        true,
        true
      );

      if (!isBound && this.autoRetryCount >= MAX_AUTO_RETRY_COUNT) {
        this.updateStatus('error', `滚动监听自动重试失败，已达 ${MAX_AUTO_RETRY_COUNT} 次上限`);
        pushPanelNotice(`滚动监听自动重试失败：${message}`, 'error');
      }
    }, BIND_RETRY_DELAY);
  }

  private clearAutoRetryTimer(): void {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
  }

  private clearPostRefreshCheckTimer(): void {
    if (this.postRefreshCheckTimer) {
      clearTimeout(this.postRefreshCheckTimer);
      this.postRefreshCheckTimer = null;
    }
  }

  private async performPostRefreshCheck(): Promise<void> {
    if (!get(featuresStore).syncScroll) {
      return;
    }

    if (!this.chatArea || !this.parserConfig) {
      this.updateStatus('warning', '等待聊天区域初始化完成');
      return;
    }

    if (!this.isOutlineReady()) {
      this.updateStatus('syncing', '等待大纲初始化完成');
      return;
    }

    this.rebuildScrollAnchors();
    this.observeVisibleMessages();

    if (this.needsRebind()) {
      this.updateStatus('syncing', '大纲已刷新，正在校正滚动监听绑定');
      await this.bindScrollListenerWithRetry('post-refresh', true, false);
      return;
    }

    this.syncOutlineScroll();
  }

  private isOutlineReady(): boolean {
    if (!this.outlineContainer) {
      return false;
    }

    if (messageCacheManager.getCache().length === 0) {
      return false;
    }

    return messageCacheManager.getCache().some((item) => Boolean(item.outlineElement));
  }

  private needsRebind(): boolean {
    return !this.scrollContainer || !this.scrollHandler || this.isBinding;
  }

  private triggerInitialSync(): void {
    if (!this.outlineContainer || !this.scrollContainer || !this.scrollHandler) {
      return;
    }

    setTimeout(() => {
      if (!this.outlineContainer || !this.scrollContainer || !this.scrollHandler) {
        return;
      }

      this.syncOutlineScroll();
    }, 0);
  }

  public rebuildScrollAnchors(): void {
    if (!this.scrollContainer) {
      this.scrollAnchors = [];
      return;
    }

    const nextAnchors: ScrollAnchor[] = [];
    for (const cachedItem of messageCacheManager.getCache()) {
      if (cachedItem.outlineElement) {
        nextAnchors.push({
          id: cachedItem.outlineItem.id,
          type: 'message',
          targetElement: cachedItem.outlineItem.element,
          outlineElement: cachedItem.outlineElement,
          topOffset: 0,
          depth: 0,
        });
      }

      if (cachedItem.outlineItem.headers) {
        this.appendHeaderAnchors(cachedItem.outlineItem.headers, nextAnchors);
      }
    }

    this.scrollAnchors = nextAnchors;
    this.refreshAnchorOffsets();
  }

  public refreshAnchorOffsets(): void {
    if (!this.scrollContainer || this.scrollAnchors.length === 0) {
      return;
    }

    const containerRect = this.scrollContainer.getBoundingClientRect();
    const scrollTop = this.getScrollTop();

    for (const anchor of this.scrollAnchors) {
      const rect = anchor.targetElement.getBoundingClientRect();
      anchor.topOffset = rect.top - containerRect.top + scrollTop;
    }

    this.scrollAnchors.sort((left, right) => {
      if (left.topOffset !== right.topOffset) {
        return left.topOffset - right.topOffset;
      }

      if (left.depth !== right.depth) {
        return left.depth - right.depth;
      }

      return left.type === right.type ? 0 : left.type === 'message' ? -1 : 1;
    });
  }

  private appendHeaderAnchors(headers: NonNullable<ReturnType<typeof messageCacheManager.getCache>[number]['outlineItem']['headers']>, anchors: ScrollAnchor[]): void {
    for (const header of headers) {
      const outlineElement = this.headerOutlineElements.get(header.id);
      if (outlineElement) {
        anchors.push({
          id: header.id,
          type: 'header',
          targetElement: header.element,
          outlineElement,
          topOffset: 0,
          depth: header.level,
        });
      }

      if (header.children.length > 0) {
        this.appendHeaderAnchors(header.children, anchors);
      }
    }
  }

  private observeVisibleMessages(): void {
    if (!this.scrollContainer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.disconnectIntersectionObserver();
    this.visibleMessageMetrics.clear();

    const cache = messageCacheManager.getCache();
    if (cache.length === 0) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const messageId = (entry.target as Element).getAttribute('cbe-message-id');
          if (!messageId) {
            continue;
          }

          if (!entry.isIntersecting) {
            this.visibleMessageMetrics.delete(messageId);
            continue;
          }

          this.visibleMessageMetrics.set(messageId, {
            top: entry.boundingClientRect.top,
            bottom: entry.boundingClientRect.bottom,
          });
        }
      },
      {
        root: this.scrollContainer,
        threshold: [0, 0.1, 0.5],
        rootMargin: '0px 0px -60% 0px'
      }
    );

    for (const item of cache) {
      this.intersectionObserver.observe(item.outlineItem.element);
    }
  }

  private disconnectIntersectionObserver(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.visibleMessageMetrics.clear();
  }

  private unbindScrollListener(): void {
    if (this.scrollHandler && this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
      logger.debug('解绑滚动监听');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.scrollHandler = null;
  }

  private findVisibleMessageIndex(): number {
    const observedIndex = this.findVisibleMessageIndexFromObserver();
    if (observedIndex !== -1) {
      this.lastVisibleIndex = observedIndex;
      return observedIndex;
    }

    if (!this.scrollContainer) {
      return -1;
    }

    const containerTop = this.scrollContainer.getBoundingClientRect().top + 10;
    const cache = messageCacheManager.getCache();
    if (cache.length === 0) {
      this.lastVisibleIndex = -1;
      return -1;
    }

    const nearIndex = this.findVisibleMessageIndexNear(cache, containerTop);
    if (nearIndex !== -1) {
      this.lastVisibleIndex = nearIndex;
      return nearIndex;
    }

    const fallbackIndex = this.findVisibleMessageIndexFull(cache, containerTop);
    this.lastVisibleIndex = fallbackIndex;
    return fallbackIndex;
  }

  private findActiveAnchor(): ScrollAnchor | null {
    if (!this.scrollContainer || this.scrollAnchors.length === 0) {
      return null;
    }

    this.refreshAnchorOffsets();

    const currentTop = this.getScrollTop() + Math.max(24, this.getContainerClientHeight() * 0.18);
    let left = 0;
    let right = this.scrollAnchors.length - 1;
    let answer = -1;

    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      if (this.scrollAnchors[middle].topOffset <= currentTop) {
        answer = middle;
        left = middle + 1;
      } else {
        right = middle - 1;
      }
    }

    if (answer === -1) {
      return this.scrollAnchors[0] || null;
    }

    return this.refineActiveAnchor(answer, currentTop);
  }

  private refineActiveAnchor(index: number, currentTop: number): ScrollAnchor | null {
    let bestAnchor = this.scrollAnchors[index] || null;
    if (!bestAnchor) {
      return null;
    }

    const tolerance = 36;
    for (let current = index + 1; current < this.scrollAnchors.length; current++) {
      const candidate = this.scrollAnchors[current];
      if (candidate.topOffset > currentTop + tolerance) {
        break;
      }

      if (candidate.type === 'header' && candidate.depth >= bestAnchor.depth) {
        bestAnchor = candidate;
      }
    }

    return bestAnchor;
  }

  private findVisibleMessageIndexFromObserver(): number {
    if (!this.scrollContainer || this.visibleMessageMetrics.size === 0) {
      return -1;
    }

    const rootTop = this.scrollContainer.getBoundingClientRect().top + 10;
    let targetMessageId: string | null = null;
    let targetTop = Number.POSITIVE_INFINITY;

    for (const [messageId, metrics] of this.visibleMessageMetrics.entries()) {
      if (metrics.bottom <= rootTop) {
        continue;
      }

      if (metrics.top < targetTop) {
        targetTop = metrics.top;
        targetMessageId = messageId;
      }
    }

    return messageCacheManager.getCacheIndexByMessageId(targetMessageId);
  }

  private findVisibleMessageIndexNear(cache: ReturnType<typeof messageCacheManager.getCache>, containerTop: number): number {
    if (this.lastVisibleIndex < 0 || this.lastVisibleIndex >= cache.length) {
      return -1;
    }

    const maxOffset = 5;
    const start = Math.max(0, this.lastVisibleIndex - maxOffset);
    const end = Math.min(cache.length - 1, this.lastVisibleIndex + maxOffset);

    for (let index = start; index <= end; index++) {
      const rect = cache[index].outlineItem.element.getBoundingClientRect();
      if (rect.top >= containerTop || rect.bottom > containerTop) {
        return index;
      }
    }

    return -1;
  }

  private findVisibleMessageIndexFull(cache: ReturnType<typeof messageCacheManager.getCache>, containerTop: number): number {
    for (let index = 0; index < cache.length; index++) {
      const rect = cache[index].outlineItem.element.getBoundingClientRect();
      if (rect.top >= containerTop || rect.bottom > containerTop) {
        return index;
      }
    }

    return -1;
  }

  private scrollToOutlineItem(index: number): void {
    const outlineElement = messageCacheManager.getOutlineElementByIndex(index);

    if (!outlineElement || !this.outlineContainer) {
      return;
    }

    if (this.lastHighlightElement === outlineElement) {
      this.updateStatus('ready', `滚动监听已成功绑定，最近同步到第 ${index + 1} 条消息`);
      return;
    }

    logger.debug('scroll to ', outlineElement);
    this.isSyncing = true;
    this.updateStatus('syncing', `滚动监听已触发，正在同步第 ${index + 1} 条消息`);
    this.applyOutlineFocus(outlineElement);

    setTimeout(() => {
      this.isSyncing = false;
      this.updateStatus('ready', `滚动监听已成功绑定，最近同步到第 ${index + 1} 条消息`);
    }, 300);
  }

  private scrollToOutlineAnchor(anchor: ScrollAnchor): void {
    if (this.lastHighlightElement === anchor.outlineElement) {
      this.updateStatus('ready', `滚动监听已成功绑定，最近同步到${anchor.type === 'header' ? '标题' : '消息'}锚点`);
      return;
    }

    this.isSyncing = true;
    this.updateStatus('syncing', `滚动监听已触发，正在同步到${anchor.type === 'header' ? '标题' : '消息'}锚点`);
    this.applyOutlineFocus(anchor.outlineElement);

    setTimeout(() => {
      this.isSyncing = false;
      this.updateStatus('ready', `滚动监听已成功绑定，最近同步到${anchor.type === 'header' ? '标题' : '消息'}锚点`);
    }, 300);
  }

  private applyOutlineFocus(outlineElement: Element): void {
    this.lastHighlightElement = outlineElement;

    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }

    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.classList.remove('outline-active');
    }

    outlineElement.classList.add('outline-active');
    this.currentHighlightedElement = outlineElement;

    this.highlightTimer = setTimeout(() => {
      if (this.currentHighlightedElement) {
        this.currentHighlightedElement.classList.remove('outline-active');
        this.currentHighlightedElement = null;
      }
    }, 1000);

    outlineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private getScrollTop(): number {
    return (this.scrollContainer as HTMLElement | null)?.scrollTop || 0;
  }

  private getContainerClientHeight(): number {
    return (this.scrollContainer as HTMLElement | null)?.clientHeight || 0;
  }

  private updateStatus(state: ScrollStatusState, message: string): void {
    setServiceStatus('scrollSync', {
      state,
      message
    });
  }
}

export const scrollSyncService = new ScrollSyncService();
