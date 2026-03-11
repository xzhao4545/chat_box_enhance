import { writable } from 'svelte/store';

export type ServiceStatusState = 'idle' | 'ready' | 'warning' | 'error' | 'syncing';
export type ServiceStatusKey = 'outlineRuntime' | 'scrollSync';
export type PanelNoticeLevel = 'info' | 'success' | 'warning' | 'error';

export interface ServiceStatusItem {
  key: ServiceStatusKey;
  label: string;
  state: ServiceStatusState;
  message: string;
  updatedAt: number;
}

export interface PanelNotice {
  id: number;
  level: PanelNoticeLevel;
  message: string;
  createdAt: number;
}

const defaultServiceStatus: Record<ServiceStatusKey, ServiceStatusItem> = {
  outlineRuntime: {
    key: 'outlineRuntime',
    label: '大纲运行时',
    state: 'idle',
    message: '大纲运行时尚未初始化',
    updatedAt: Date.now()
  },
  scrollSync: {
    key: 'scrollSync',
    label: '滚动监听',
    state: 'idle',
    message: '滚动监听尚未初始化',
    updatedAt: Date.now()
  }
};

export const serviceStatusStore = writable(defaultServiceStatus);
export const panelNoticeStore = writable<PanelNotice[]>([]);

let noticeId = 0;

export function setServiceStatus(
  key: ServiceStatusKey,
  patch: Partial<Omit<ServiceStatusItem, 'key' | 'label'>>
): void {
  serviceStatusStore.update((status) => ({
    ...status,
    [key]: {
      ...status[key],
      ...patch,
      updatedAt: Date.now()
    }
  }));
}

export function resetServiceStatus(): void {
  serviceStatusStore.set({
    outlineRuntime: { ...defaultServiceStatus.outlineRuntime, updatedAt: Date.now() },
    scrollSync: { ...defaultServiceStatus.scrollSync, updatedAt: Date.now() }
  });
}

export function pushPanelNotice(
  message: string,
  level: PanelNoticeLevel = 'info',
  duration = 3000
): number {
  const id = ++noticeId;
  const notice: PanelNotice = {
    id,
    level,
    message,
    createdAt: Date.now()
  };

  panelNoticeStore.update((list) => [...list, notice]);

  if (duration > 0) {
    window.setTimeout(() => {
      removePanelNotice(id);
    }, duration);
  }

  return id;
}

export function removePanelNotice(id: number): void {
  panelNoticeStore.update((list) => list.filter((notice) => notice.id !== id));
}

export function clearPanelNotice(): void {
  panelNoticeStore.set([]);
}
