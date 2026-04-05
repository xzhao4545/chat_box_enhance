/**
 * 平台状态管理
 */

import { writable, get } from 'svelte/store';
import type { Platform, ParserConfig } from '../types';

// 导入各平台配置
import { deepseekConfig } from '../platform/deepseek';
import { doubaoConfig } from '../platform/doubao';
import { chatgptConfig } from '../platform/chatgpt';
import { grokConfig } from '../platform/grok';
import { tongyiConfig } from '../platform/tongyi';
import { qwenConfig } from '../platform/qwen';
import { kimiConfig } from '../platform/kimi';
import { yuanbaoConfig } from '../platform/yuanbao';

/**
 * 当前平台Store
 */
export const platformStore = writable<Platform>('unknown');

/**
 * 解析器配置Store
 */
export const parserConfigStore = writable<ParserConfig | null>(null);

/**
 * 判断当前平台
 */
export function judgePlatform(): Platform {
  const hostname = window.location.hostname;

  if (hostname.includes('deepseek.com')) return 'deepseek';
  if (hostname.includes('doubao.com')) return 'doubao';
  if (hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('grok.com')) return 'grok';
  if (hostname.includes('qianwen.com')) return 'tongyi';
  if (hostname.includes('qwen.ai')) return 'qwen';
  if (hostname.includes('kimi.com')) return 'kimi';
  if (hostname.includes('yuanbao.tencent.com')) return 'yuanbao';

  return 'unknown';
}

/**
 * 设置当前平台
 */
export function setPlatform(platform: Platform): void {
  platformStore.set(platform);

  const config = getParserConfigForPlatform(platform);
  parserConfigStore.set(config);
}

/**
 * 获取平台对应的解析配置
 */
function getParserConfigForPlatform(platform: Platform): ParserConfig | null {
  switch (platform) {
    case 'deepseek': return deepseekConfig;
    case 'doubao': return doubaoConfig;
    case 'chatgpt': return chatgptConfig;
    case 'grok': return grokConfig;
    case 'tongyi': return tongyiConfig;
    case 'qwen': return qwenConfig;
    case 'kimi': return kimiConfig;
    case 'yuanbao': return yuanbaoConfig;
    default: return null;
  }
}

/**
 * 获取当前解析配置
 */
export function getParserConfig(): ParserConfig | null {
  return get(parserConfigStore);
}
