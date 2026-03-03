import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import MagicString from 'magic-string';

/**
 * 自定义插件：在文件头插入油猴脚本头部信息
 * 支持 userscript-headers.js 中的变量渲染
 */
function userscriptBannerPlugin() {
    return {
        name: 'userscript-banner',
        
        renderChunk(code, chunk, options) {
            // 只处理入口文件
            if (!chunk.isEntry) {
                return null;
            }
            
            const packageJson = JSON.parse(
                fs.readFileSync('./package.json', 'utf-8')
            );
            
            // 读取 userscript-headers.js
            let userscriptHeaders = fs.readFileSync('./userscript-headers.js', 'utf-8');
            
            // 替换变量
            userscriptHeaders = userscriptHeaders.replaceAll("${name}", packageJson.name || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${namespace}", packageJson.namespace || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${version}", packageJson.version || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${description}", packageJson.description || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${document}", packageJson.document || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${author}", packageJson.author || "");
            userscriptHeaders = userscriptHeaders.replaceAll("${repository}", packageJson.repository || "");
            
            // 如果存在 banner.txt，则读取并插入
            const bannerFilePath = './banner.txt';
            if (fs.existsSync(bannerFilePath)) {
                let banner = fs.readFileSync(bannerFilePath, 'utf-8');
                banner = banner.replaceAll("${name}", packageJson.name || "");
                banner = banner.replaceAll("${namespace}", packageJson.namespace || "");
                banner = banner.replaceAll("${version}", packageJson.version || "");
                banner = banner.replaceAll("${description}", packageJson.description || "");
                banner = banner.replaceAll("${document}", packageJson.document || "");
                banner = banner.replaceAll("${author}", packageJson.author || "");
                banner = banner.replaceAll("${repository}", packageJson.repository || "");
                
                userscriptHeaders += "\n\n";
                
                // 处理每一行，确保每一行都有注释前缀
                const bannerLines = banner.split("\n");
                const commentedBanner = bannerLines.map(line => "//    " + line).join("\n");
                
                userscriptHeaders += commentedBanner + "\n";
            }
            
            // 使用 magic-string 处理代码，保持 sourcemap 正确
            const header = userscriptHeaders + "\n";
            const ms = new MagicString(code);
            ms.prepend(header);
            
            return {
                code: ms.toString(),
                map: ms.generateMap({ hires: true })
            };
        }
    };
}

export default {
    input: 'src/index.ts',
    
    output: {
        file: 'dist/index.js',
        format: 'iife',  // 立即执行函数格式，适合用户脚本
        sourcemap: true,
        // 不压缩、不混淆
        compact: false,
    },
    
    plugins: [
        resolve({
            browser: true,
        }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            // 跳过类型检查，加快构建速度
            noEmitOnError: false,
        }),
        userscriptBannerPlugin(),
    ],
    
    // 不进行代码分割
    preserveEntrySignatures: 'strict',
    
    // 不进行 tree shaking（保留所有代码）
    treeshake: false,
};