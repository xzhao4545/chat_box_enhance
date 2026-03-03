<script lang="ts">
  import { onMount, mount, unmount } from 'svelte';
  import { get } from 'svelte/store';
  import OutlinePanel from './lib/components/outline/OutlinePanel.svelte';
  import { themeStore, parserConfigStore } from './lib/stores';
  import { judgePlatform, setPlatform } from './lib/stores/platform';
  import { setupMutationObserver, disconnectObserver } from './lib/services/observer';
  import { refreshOutlineItems, forceRefresh } from './lib/services/outline';
  import { getEleWithRetry } from './lib/utils';
  import type { ParserConfig } from './lib/types';

  let isReady = $state(false);
  let isFixedRight = $state(false);
  let parserConfig: ParserConfig | null = $state(null);
  let outlineContainer: Element | null = $state(null);
  let outlineInstance: Record<string, any> | null = null;

  $effect(() => {
    document.documentElement.setAttribute('cbe-data-theme', $themeStore.currentTheme);
  });

  onMount(() => {
    // 判断平台
    const platform = judgePlatform();
    if (platform === 'unknown') {
      console.log('不支持的平台');
      return;
    }

    // 设置平台
    setPlatform(platform);
    parserConfig = get(parserConfigStore);

    if (!parserConfig) {
      console.log('无法获取解析配置');
      return;
    }
    parserConfig.init?.();
    const timeout = parserConfig.timeout || 0;

    const timeoutId = setTimeout(async () => {
      try {
        // 获取大纲应该挂载的目标容器
        outlineContainer = await getEleWithRetry(parserConfig!.getOutlineContainer, [], true, 5, 1000);
        
        if (!outlineContainer) {
          throw new Error('无法找到大纲挂载目标，将使用固定右侧模式');
        }

        console.log('成功获取大纲挂载目标:', outlineContainer);
      } catch (e) {
        console.error('大纲挂载失败，将插入到body并固定在右侧:', e);
        isFixedRight = true;
        // 创建body作为回退容器
        outlineContainer = document.body;
      }

      // 在目标容器中动态挂载OutlinePanel
      if (outlineContainer) {
        // 清理可能存在的旧实例（HMR场景）
        const existingOutline = outlineContainer.querySelector('.chat-outline');
        if (existingOutline) {
          console.log('发现已有大纲组件，跳过重复挂载');
        } else {
          outlineInstance = mount(OutlinePanel, {
            target: outlineContainer as HTMLElement,
            props: {
              onRefresh: handleRefresh,
              isFixedRight
            }
          });
        }
      }

      // 获取chatArea
      console.log('开始获取 chatArea...');
      const chatArea = await getEleWithRetry(parserConfig!.selectChatArea);

      if (!chatArea) {
        console.error('经过多次重试后仍未找到聊天区域，脚本初始化失败');
        return;
      }

      console.log('成功定位到 chatArea:', chatArea);

      // 初始化大纲内容
      refreshOutlineItems(parserConfig!);

      // 设置 MutationObserver
      setupMutationObserver(chatArea, () => {
        if (parserConfig) {
          refreshOutlineItems(parserConfig);
        }
      });

      isReady = true;
      console.log('对话大纲生成脚本已启动');
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      disconnectObserver();
      // 卸载动态挂载的组件
      if (outlineInstance) {
        unmount(outlineInstance);
        outlineInstance = null;
      }
    };
  });

  // 清理函数
  function cleanupOutline() {
    if (outlineInstance) {
      unmount(outlineInstance);
      outlineInstance = null;
    }
  }

  function handleRefresh() {
    if (parserConfig) {
      forceRefresh(parserConfig);
    }
  }
</script>