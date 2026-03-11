import { mount, unmount } from 'svelte';
import OutlinePanel from '../components/outline/OutlinePanel.svelte';
import type { ParserConfig } from '../types';
import { getEleWithRetry } from '../utils';
import { logger } from './logger';
import { observerService } from './observer';
import { outlineService } from './outline';
import { scrollSyncService } from './scrollSyncService';

type OutlineComponentInstance = Record<string, any> | null;

interface StartResult {
  isFixedRight: boolean;
  isReady: boolean;
}

class OutlineRuntimeService {
  private parserConfig: ParserConfig | null = null;
  private outlineContainer: Element | null = null;
  private outlineInstance: OutlineComponentInstance = null;
  private isFixedRight = false;
  private destroyed = false;

  public async start(parserConfig: ParserConfig): Promise<StartResult> {
    this.destroy();

    this.destroyed = false;
    this.parserConfig = parserConfig;
    this.isFixedRight = false;

    parserConfig.init?.();

    const timeout = parserConfig.timeout || 0;
    if (timeout > 0) {
      await this.delay(timeout);
    }

    if (this.destroyed) {
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    await this.resolveOutlineContainer();

    if (this.destroyed) {
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    this.mountOutlinePanel();

    const chatArea = await this.resolveChatArea();
    if (!chatArea || this.destroyed) {
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    this.initializeOutlineRuntime(chatArea);

    logger.info('对话大纲生成脚本已启动');
    return { isFixedRight: this.isFixedRight, isReady: true };
  }

  public refresh(): void {
    if (!this.parserConfig) {
      logger.warn('刷新大纲失败：parserConfig 不存在');
      return;
    }

    outlineService.refresh(this.parserConfig);
  }

  public forceRefresh(): void {
    if (!this.parserConfig) {
      logger.warn('强制刷新失败：parserConfig 不存在');
      return;
    }

    outlineService.forceRefresh(this.parserConfig);
  }

  public destroy(): void {
    this.destroyed = true;
    observerService.disconnect();
    scrollSyncService.destroy();

    if (this.outlineInstance) {
      unmount(this.outlineInstance);
      this.outlineInstance = null;
    }

    this.outlineContainer = null;
    this.parserConfig = null;
    this.isFixedRight = false;
  }

  private async resolveOutlineContainer(): Promise<void> {
    try {
      this.outlineContainer = await getEleWithRetry(
        this.parserConfig!.getOutlineContainer,
        [],
        true,
        5,
        1000
      );

      if (!this.outlineContainer) {
        throw new Error('无法找到大纲挂载目标，将使用固定右侧模式');
      }

      logger.info('成功获取大纲挂载目标:', this.outlineContainer);
      this.parserConfig?.afterGetContainer?.(this.outlineContainer);
    } catch (error) {
      logger.error('大纲挂载失败，将插入到 body 并固定在右侧:', error);
      this.isFixedRight = true;
      this.outlineContainer = document.body;
    }
  }

  private mountOutlinePanel(): void {
    if (!this.outlineContainer) {
      return;
    }

    const existingOutline = this.outlineContainer.querySelector('.chat-outline');
    if (existingOutline) {
      logger.debug('发现已有大纲组件，跳过重复挂载');
      return;
    }

    this.outlineInstance = mount(OutlinePanel, {
      target: this.outlineContainer as HTMLElement,
      props: {
        onRefresh: () => this.forceRefresh(),
        isFixedRight: this.isFixedRight
      }
    });
  }

  private async resolveChatArea(): Promise<Element | null> {
    logger.info('开始获取 chatArea...');
    const chatArea = await getEleWithRetry(this.parserConfig!.selectChatArea);

    if (!chatArea) {
      logger.error('经过多次重试后仍未找到聊天区域，脚本初始化失败');
      return null;
    }

    logger.info('成功定位到 chatArea:', chatArea);
    this.parserConfig?.afterGetChatArea?.(chatArea);
    return chatArea;
  }

  private initializeOutlineRuntime(chatArea: Element): void {
    this.refresh();
    scrollSyncService.init(chatArea, this.parserConfig!);

    observerService.setup(chatArea, () => {
      this.refresh();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
}

export const outlineRuntimeService = new OutlineRuntimeService();
