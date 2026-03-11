/**
 * 大纲数据状态管理
 */

import { writable } from 'svelte/store';
import type { OutlineItem } from '../types';

/**
 * 大纲项Store
 */
export const outlineStore = writable<OutlineItem[]>([]);

/**
 * 刷新大纲
 */
export function refreshOutline(items: OutlineItem[]): void {
  outlineStore.set(items);
}

/**
 * 清空大纲
 */
export function clearOutline(): void {
  outlineStore.set([]);
}
