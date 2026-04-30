const http = require("http");
const fs = require("fs");
const path = require("path");

const host = "127.0.0.1";
const port = 3000;
const rootDir = __dirname;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const requestedPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const relativePath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(rootDir, relativePath));

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    response.end(fileBuffer);
  });
});

server.listen(port, host, () => {
  console.log(`ReadingWPM running at http://${host}:${port}`);
});
