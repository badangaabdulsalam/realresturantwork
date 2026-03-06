const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.FRONTEND_PORT || 8080);
const HOST = String(process.env.FRONTEND_HOST || '').trim();
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
};

function normalizePathname(urlPathname) {
    const raw = String(urlPathname || '/').split('?')[0].split('#')[0];
    const decoded = decodeURIComponent(raw || '/');
    return decoded === '/' ? '/index.html' : decoded;
}

function resolveSafeFilePath(urlPathname) {
    const normalized = normalizePathname(urlPathname);
    const absolutePath = path.resolve(ROOT_DIR, `.${normalized}`);

    if (!absolutePath.startsWith(ROOT_DIR)) {
        return null;
    }

    return absolutePath;
}

async function readStaticFile(filePath) {
    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            return readStaticFile(path.join(filePath, 'index.html'));
        }

        const extension = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[extension] || 'application/octet-stream';
        const content = await fs.readFile(filePath);
        return { statusCode: 200, contentType, content };
    } catch {
        return {
            statusCode: 404,
            contentType: 'text/plain; charset=utf-8',
            content: Buffer.from('Not found', 'utf8')
        };
    }
}

const server = http.createServer(async (req, res) => {
    const safePath = resolveSafeFilePath(req.url || '/');

    if (!safePath) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid path');
        return;
    }

    const file = await readStaticFile(safePath);
    res.writeHead(file.statusCode, {
        'Content-Type': file.contentType,
        'Cache-Control': 'no-store'
    });
    res.end(file.content);
});

function onFrontendStarted() {
    const announceHost = HOST || '0.0.0.0/::';
    console.log(`Frontend static server running on http://${announceHost}:${PORT}`);
    console.log(`Local loopback: http://localhost:${PORT}`);
}

if (HOST) {
    server.listen(PORT, HOST, onFrontendStarted);
} else {
    server.listen(PORT, onFrontendStarted);
}
