/**
 * 平台检测和解析配置
 * 包含各AI聊天平台的DOM选择器和解析逻辑
 */

import type { Platform, ParserConfig } from '../types';
import { deepseekConfig } from './deepseek';
import { doubaoConfig } from './doubao';
import { chatgptConfig } from './chatgpt';
import { grokConfig } from './grok';
import { tongyiConfig } from './tongyi';
import { qwenConfig } from './qwen';
import { kimiConfig } from './kimi';

export { deepseekConfig } from './deepseek';
export { doubaoConfig } from './doubao';
export { chatgptConfig } from './chatgpt';
export { grokConfig } from './grok';
export { tongyiConfig } from './tongyi';
export { qwenConfig } from './qwen';
export { kimiConfig } from './kimi';

/**
 * 判断当前平台
 */
export function judgePlatform(): Platform {
  // 根据当前URL判断平台
  const hostname = window.location.hostname;
  
  if (hostname.includes('deepseek.com')) {
    return 'deepseek';
  }
  if (hostname.includes('doubao.com')) {
    return 'doubao';
  }
  if (hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  }
  if (hostname.includes('grok.com')) {
    return 'grok';
  }
  if (hostname.includes('qianwen.com')) {
    return 'tongyi';
  }
  if (hostname.includes('qwen.ai')) {
    return 'qwen';
  }
  if (hostname.includes('kimi.com')) {
    return 'kimi';
  }
  return 'unknown';
}

/**
 * 获取解析所需配置
 * @param platform 平台名称
 */
export function getParserConfig(platform: Platform): ParserConfig | null {
  switch (platform) {
    case 'deepseek':
      return deepseekConfig;
    case 'doubao':
      return doubaoConfig;
    case 'chatgpt':
      return chatgptConfig;
    case 'grok':
      return grokConfig;
    case 'tongyi':
      return tongyiConfig;
    case 'qwen':
      return qwenConfig;
    case 'kimi':
      return kimiConfig;
    default:
      return null;
  }
}
