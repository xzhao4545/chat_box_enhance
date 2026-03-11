<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { themeStore, parserConfigStore } from './lib/stores';
  import { judgePlatform, setPlatform } from './lib/stores/platform';
  import type { ParserConfig } from './lib/types';
  import { logger } from './lib/services/logger';
  import { outlineRuntimeService } from './lib/services/outlineRuntimeService';

  let parserConfig: ParserConfig | null = $state(null);

  $effect(() => {
    document.documentElement.setAttribute('cbe-data-theme', $themeStore.currentTheme);
  });

  onMount(() => {
    const platform = judgePlatform();
    if (platform === 'unknown') {
      logger.warn('不支持的平台');
      return;
    }

    setPlatform(platform);
    parserConfig = get(parserConfigStore);

    if (!parserConfig) {
      logger.error('无法获取解析配置');
      return;
    }

    void outlineRuntimeService.start(parserConfig);

    return () => {
      outlineRuntimeService.destroy();
    };
  });
</script>
