/**
 * 聊天助手大纲 - 入口文件
 * 为多个AI聊天平台生成智能对话大纲
 */

import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const app = mount(App, {
  target: (() => {
    const container = document.createElement('div');
    document.body.append(container);
    return container;
  })(),
});

export default app;