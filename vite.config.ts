import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: "聊天助手大纲",
        icon: 'https://cdn.deepseek.com/chat/icon.png',
        namespace: 'http://tampermonkey.net/',
        match: ['*://chatgpt.com/*','*://chat.deepseek.com/*','*://grok.com/*',
          '*://www.qianwen.com/*','*://chat.qwen.ai/*','*://www.doubao.com/*','*://www.kimi.com/*',
          '*://yuanbao.tencent.com/*'
        ],
      },
    }),
  ],
});
