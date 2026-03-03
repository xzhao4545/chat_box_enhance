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
        icon: 'https://cdn.deepseek.com/chat/icon.png',
        namespace: 'https://github.com/xzhao4545/chat_box_enhance',
        match: ['*://chatgpt.com/*','*://chat.deepseek.com/*','*://grok.com/*',
          '*://www.qianwen.com/*','*://chat.qwen.ai/*','*://*.doubao.com/*','*://www.kimi.com/*'
        ],
      },
    }),
  ],
});
