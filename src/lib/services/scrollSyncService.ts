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

  public setLastHighlightElement(element: Element | null | undefined): void {
    this.lastHighlightElement = element;
  }

  constructor() {
    featuresStore.subscribe((features) => {
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

    if (!this.scrollHandler) {
      this.handleAbnormalState('warning', '滚动监听未绑定，正在尝试自动重试');
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
    if (!this.scrollContainer) {
      return -1;
    }

    const containerTop = this.scrollContainer.getBoundingClientRect().top+10;
    const messageElements = this.scrollContainer.querySelectorAll('[cbe-message-id]');

    let visibleIndex = -1;

    for (let i = 0; i < messageElements.length; i++) {
      const rect = messageElements[i].getBoundingClientRect();

      if (rect.top >= containerTop || rect.bottom > containerTop) {
        const messageId = messageElements[i].getAttribute('cbe-message-id');
        visibleIndex = this.findCacheIndexByMessageId(messageId);
        break;
      }
    }

    return visibleIndex;
  }

  private findCacheIndexByMessageId(messageId: string | null): number {
    if (!messageId) {
      return -1;
    }

    const cache = messageCacheManager.getCache();
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].messageId === messageId) {
        return i;
      }
    }

    return -1;
  }

  private scrollToOutlineItem(index: number): void {
    const outlineElement = messageCacheManager.getOutlineElementByIndex(index);

    if (!outlineElement || !this.outlineContainer || this.lastHighlightElement === outlineElement) {
      return;
    }

    this.lastHighlightElement = outlineElement;
    logger.debug('scroll to ', outlineElement);
    this.isSyncing = true;
    this.updateStatus('syncing', `滚动监听已触发，正在同步第 ${index + 1} 条消息`);

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

    setTimeout(() => {
      this.isSyncing = false;
      this.updateStatus('ready', `滚动监听已成功绑定，最近同步到第 ${index + 1} 条消息`);
    }, 300);
  }

  private updateStatus(state: ScrollStatusState, message: string): void {
    setServiceStatus('scrollSync', {
      state,
      message
    });
  }
}

export const scrollSyncService = new ScrollSyncService();
