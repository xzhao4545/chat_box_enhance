import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.resolve(__dirname, '../dist');
const SRC_DIR = path.resolve(__dirname, '../src');

const MIME_TYPES = {
    '.js': 'application/javascript',
    '.map': 'application/json',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
};

const server = http.createServer((req, res) => {
    // 处理 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 解析请求路径
    let filePath = req.url.split('?')[0];
    
    // 默认访问 index.js
    if (filePath === '/' || filePath === '') {
        filePath = '/index.js';
    }

    // 确定基础目录（支持 /src/ 前缀访问源文件）
    let baseDir = DIST_DIR;
    let relativePath = filePath;
    
    if (filePath.startsWith('/src/')) {
        baseDir = SRC_DIR;
        relativePath = filePath.substring(4); // 移除 '/src' 前缀
    }

    // 安全检查：防止路径遍历
    const fullPath = path.resolve(baseDir, '.' + relativePath);
    if (!fullPath.startsWith(DIST_DIR) && !fullPath.startsWith(SRC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + filePath);
        return;
    }

    // 获取 MIME 类型
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 读取并返回文件
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Development server running at http://localhost:${PORT}`);
    console.log(`Available files:`);
    console.log(`  - http://localhost:${PORT}/index.js`);
    console.log(`  - http://localhost:${PORT}/index.js.map`);
    console.log(`\nPress Ctrl+C to stop`);
});