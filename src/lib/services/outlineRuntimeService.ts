import { mount, unmount } from 'svelte';
import OutlinePanel from '../components/outline/OutlinePanel.svelte';
import { pushPanelNotice, resetServiceStatus, setServiceStatus } from '../stores/panelStatus';
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
    setServiceStatus('outlineRuntime', {
      state: 'syncing',
      message: '正在初始化大纲运行时'
    });

    this.destroy(false);

    this.destroyed = false;
    this.parserConfig = parserConfig;
    this.isFixedRight = false;

    parserConfig.init?.();

    const timeout = parserConfig.timeout || 0;
    if (timeout > 0) {
      await this.delay(timeout);
    }

    if (this.destroyed) {
      setServiceStatus('outlineRuntime', {
        state: 'warning',
        message: '初始化被中断'
      });
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    setServiceStatus('outlineRuntime', {
      state: 'syncing',
      message: '正在获取大纲挂载容器'
    });
    await this.resolveOutlineContainer();

    if (this.destroyed) {
      setServiceStatus('outlineRuntime', {
        state: 'warning',
        message: '挂载前初始化被中断'
      });
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    this.mountOutlinePanel();

    setServiceStatus('outlineRuntime', {
      state: 'syncing',
      message: '正在获取 chatArea'
    });
    const chatArea = await this.resolveChatArea();
    if (!chatArea || this.destroyed) {
      setServiceStatus('outlineRuntime', {
        state: 'error',
        message: 'chatArea 获取失败，无法完成绑定'
      });
      return { isFixedRight: this.isFixedRight, isReady: false };
    }

    setServiceStatus('outlineRuntime', {
      state: 'syncing',
      message: 'chatArea 已获取，正在绑定监听'
    });
    this.initializeOutlineRuntime(chatArea);

    setServiceStatus('outlineRuntime', {
      state: 'ready',
      message: this.isFixedRight
        ? 'chatArea 已获取，监听已绑定，当前使用右侧固定模式'
        : 'chatArea 已获取，MutationObserver 已绑定'
    });
    logger.info('对话大纲脚本已启动');

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
      setServiceStatus('outlineRuntime', {
        state: 'error',
        message: '运行时未初始化，无法刷新大纲'
      });
      return;
    }

    outlineService.forceRefresh(this.parserConfig);
    setServiceStatus('outlineRuntime', {
      state: 'ready',
      message: 'chatArea 已获取，监听保持绑定，大纲已刷新'
    });
  }

  public async forceRebind(): Promise<boolean> {
    if (!this.parserConfig) {
      setServiceStatus('outlineRuntime', {
        state: 'error',
        message: '运行时未初始化，无法重新获取并绑定监听'
      });
      pushPanelNotice('运行时未初始化，无法重新绑定', 'error');
      return false;
    }

    const parserConfig = this.parserConfig;

    setServiceStatus('outlineRuntime', {
      state: 'syncing',
      message: '正在重新获取 chatArea 并绑定监听'
    });
    pushPanelNotice('正在重新获取 chatArea 并绑定监听...', 'info', 2000);

    const result = await this.start(parserConfig);
    if (result.isReady) {
      pushPanelNotice('大纲运行时重新绑定完成', 'success');
      return true;
    }

    setServiceStatus('outlineRuntime', {
      state: 'error',
      message: '重新获取 chatArea 或绑定监听失败'
    });
    pushPanelNotice('大纲运行时重新绑定失败', 'error');
    return false;
  }

  public destroy(resetStatus = true): void {
    this.destroyed = true;
    observerService.disconnect();
    scrollSyncService.destroy(false);

    if (this.outlineInstance) {
      unmount(this.outlineInstance);
      this.outlineInstance = null;
    }

    this.outlineContainer = null;
    this.parserConfig = null;
    this.isFixedRight = false;

    if (resetStatus) {
      resetServiceStatus();
    }
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
        throw new Error('未找到大纲挂载容器');
      }

      logger.info('成功获取大纲挂载目标:', this.outlineContainer);
      this.parserConfig?.afterGetContainer?.(this.outlineContainer);
    } catch (error) {
      logger.error('大纲挂载失败，回退到 body 右侧固定模式:', error);
      this.isFixedRight = true;
      this.outlineContainer = document.body;
      setServiceStatus('outlineRuntime', {
        state: 'warning',
        message: '未找到宿主容器，已回退到右侧固定模式'
      });
    }
  }

  private mountOutlinePanel(): void {
    if (!this.outlineContainer) {
      return;
    }

    const existingOutline = this.outlineContainer.querySelector('.chat-outline');
    if (existingOutline) {
      logger.debug('已存在大纲组件，跳过重复挂载');
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
      logger.error('多次重试后仍未找到聊天区域，初始化失败');
      setServiceStatus('outlineRuntime', {
        state: 'error',
        message: '未找到 chatArea，请检查页面是否加载完成'
      });
      return null;
    }

    logger.info('成功定位 chatArea:', chatArea);
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
