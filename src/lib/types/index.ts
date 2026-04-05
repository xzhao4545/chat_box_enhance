/**
 * 类型定义入口
 */

export * from './message';
export * from './config';
export * from './platform';
export * from './bookmark';

/**
 * 支持的平台类型
 */
export type Platform = 'deepseek' | 'doubao' | 'chatgpt' | 'grok' | 'tongyi' | 'qwen' | 'kimi' | 'yuanbao' | 'unknown';
