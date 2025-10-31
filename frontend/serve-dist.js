const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT || process.argv[2] || '3000', 10);
const dir = path.resolve(process.argv[3] || 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
};

function send(res, status, headers, stream) {
  res.writeHead(status, headers);
  if (stream) {
    stream.pipe(res);
  } else {
    res.end();
  }
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(dir, urlPath);

    // Prevent path traversal
    if (!filePath.startsWith(dir)) {
      send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }

    // If directory, serve index.html inside it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // If file exists, serve it with correct mime
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      const stream = fs.createReadStream(filePath);
      send(res, 200, { 'Content-Type': type }, stream);
      return;
    }

    // SPA fallback to root index.html
    const indexPath = path.join(dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stream = fs.createReadStream(indexPath);
      send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, stream);
      return;
    }

    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${dir} on http://localhost:${port}`);
});
