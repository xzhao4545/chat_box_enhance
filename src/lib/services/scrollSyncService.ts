/**
 * 滚动同步服务
 * 负责监听消息列表滚动,同步滚动大纲列表
 */

import { featuresStore } from "../stores";
import { messageCacheManager } from "./messageCacheManager";
import type { ParserConfig } from "../types";
import { logger } from "./logger";
import { get } from "svelte/store";

/**
 * 滚动同步服务类
 */
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
  private lastHighlightElement: Element | null = null;

  constructor() {
    // 监听 syncScroll 变化
    featuresStore.subscribe((features) => {
      if (features.syncScroll) {
        this.bindScrollListener();
      } else {
        this.unbindScrollListener();
      }
    });
  }

  /**
   * 初始化配置
   * @param chatArea 对话区域元素
   * @param parserConfig 解析配置
   */
  public init(chatArea: Element, parserConfig: ParserConfig): void {
    this.chatArea = chatArea;
    this.parserConfig = parserConfig;

    // 获取滚动容器
    if (this.parserConfig.getScrollContainer) {
      this.scrollContainer = this.parserConfig.getScrollContainer(
        this.chatArea,
      );
    }
  }

  /**
   * 绑定滚动监听
   */
  private bindScrollListener(): void {
    this.unbindScrollListener();
    if (!this.chatArea || !this.parserConfig || this.scrollHandler) return;

    if (!this.scrollContainer) {
      logger.warn("未找到滚动容器，滚动同步不可用");
      return;
    }

    // 创建滚动处理函数（带防抖）
    this.scrollHandler = () => {
      if (this.isSyncing) return;

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.syncOutlineScroll();
      }, 300);
    };

    this.scrollContainer.addEventListener("scroll", this.scrollHandler, {
      passive: true,
    });

    logger.info("绑定滚动监听，容器:", this.scrollContainer);
  }

  /**
   * 解绑滚动监听
   */
  private unbindScrollListener(): void {
    if (this.scrollHandler && this.scrollContainer) {
      this.scrollContainer.removeEventListener("scroll", this.scrollHandler);
      logger.debug("解绑滚动监听");
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.scrollHandler = null;
  }

  /**
   * 设置大纲容器引用
   * @param container 大纲容器元素
   */
  setOutlineContainer(container: Element): void {
    this.outlineContainer = container;
  }

  /**
   * 同步大纲滚动到当前可见消息
   */
  syncOutlineScroll(): void {
    if (!this.scrollContainer || !this.outlineContainer) {
      return;
    }

    // 获取当前可见的消息索引
    const visibleIndex = this.findVisibleMessageIndex();
    if (visibleIndex === -1) {
      return;
    }

    // 滚动大纲到对应位置
    this.scrollToOutlineItem(visibleIndex);
  }

  /**
   * 查找当前可见的消息索引
   * @returns 可见消息的索引，或 -1
   */
  private findVisibleMessageIndex(): number {
    if (!this.scrollContainer) return -1;

    const containerTop = this.scrollContainer.getBoundingClientRect().top;
    const messageElements =
      this.scrollContainer.querySelectorAll("[cbe-message-id]");

    let visibleIndex = -1;

    for (let i = 0; i < messageElements.length; i++) {
      const rect = messageElements[i].getBoundingClientRect();

      // 元素顶部在容器顶部下方，说明该元素可见或即将可见
      if (rect.top >= containerTop) {
        const messageId = messageElements[i].getAttribute("cbe-message-id");
        visibleIndex = this.findCacheIndexByMessageId(messageId);
        break;
      }

      // 元素底部在容器顶部下方，说明该元素部分可见
      if (rect.bottom > containerTop) {
        const messageId = messageElements[i].getAttribute("cbe-message-id");
        visibleIndex = this.findCacheIndexByMessageId(messageId);
        break;
      }
    }

    return visibleIndex;
  }

  /**
   * 根据消息ID在缓存中查找索引
   */
  private findCacheIndexByMessageId(messageId: string | null): number {
    if (!messageId) return -1;

    const cache = messageCacheManager.getCache();
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].messageId === messageId) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 滚动大纲到指定索引
   * @param index 大纲项索引
   */
  private scrollToOutlineItem(index: number): void {
    const outlineElement = messageCacheManager.getOutlineElementByIndex(index);
    if (
      outlineElement &&
      this.outlineContainer &&
      this.lastHighlightElement !== outlineElement
    ) {
      this.lastHighlightElement = outlineElement;
      logger.debug("scroll to ", outlineElement);
      this.isSyncing = true;

      // 清除之前的高亮定时器
      if (this.highlightTimer) {
        clearTimeout(this.highlightTimer);
      }

      // 移除之前的高亮
      if (this.currentHighlightedElement) {
        this.currentHighlightedElement.classList.remove("outline-active");
      }
      // 添加新的高亮
      outlineElement.classList.add("outline-active");
      this.currentHighlightedElement = outlineElement;

      // 2秒后自动移除高亮
      this.highlightTimer = setTimeout(() => {
        if (this.currentHighlightedElement) {
          this.currentHighlightedElement.classList.remove("outline-active");
          this.currentHighlightedElement = null;
        }
      }, 1000);

      outlineElement.scrollIntoView({ behavior: "smooth", block: "center" });

      setTimeout(() => {
        this.isSyncing = false;
      }, 300);
    }
  }

  /**
   * 手动同步（点击按钮时调用）
   */
  manualSync(): void {
    logger.info("手动同步大纲滚动");
    this.syncOutlineScroll();
  }

  /**
   * 重新绑定监听（用于强制刷新后）
   * @param chatArea 对话区域元素
   * @param parserConfig 解析配置
   */
  rebind(chatArea: Element, parserConfig: ParserConfig): void {
    this.lastHighlightElement=null;
    const isSync = get(featuresStore).syncScroll;
    this.unbindScrollListener();
    this.init(chatArea, parserConfig);
    if (isSync) {
      this.bindScrollListener();
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.unbindScrollListener();
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
    }
    this.outlineContainer = null;
  }
}

/**
 * 全局滚动同步服务实例
 */
export const scrollSyncService = new ScrollSyncService();
