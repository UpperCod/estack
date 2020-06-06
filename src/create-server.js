import path from "path";
import net from "net";
import polka from "polka";
import sirv from "sirv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { asyncFs, promiseErrorToNull, isHtml, normalizePath } from "./utils";

let mime = {
  js: "application/javascript",
  css: "text/css",
  html: "text/html; charset=utf-8",
};

/**
 * @param {Object} options
 * @param {string} options.root
 * @param {number} options.port
 * @param {boolean} options.reload
 * @param {string} options.proxy
 * @returns {{reload:Function,serverPort:number}}
 */
export async function createServer({ root, port, reload, proxy }) {
  let nextAssets = sirv(root, {
    dev: true,
  });

  let nextAssetsRoot = sirv(".", {
    dev: true,
  });

  port = await findPort(port, port + 100);

  let nextProxy =
    proxy && createProxyMiddleware({ target: proxy, changeOrigin: true });

  let fallback = normalizePath(path.join(root, "index.html"));

  let responses = [];

  let sources = {};

  let addLiveReload = (code) =>
    (code += `
  <script>{
    let source = new EventSource('http://localhost:${port}/livereload');
    source.onmessage = e =>  setTimeout(()=>location.reload(),250);
  }</script>
`);

  polka()
    .use(async (req, res, next) => {
      if (req.path == "/livereload" && reload) {
        next();
        return;
      }

      let file = req.path;

      if (file == "/") {
        file = "index.html";
      } else if (/\/$/.test(file)) {
        file += "index.html";
      } else if (!/\.[\w]+$/.test(file)) {
        file += ".html";
      }

      file = normalizePath(path.join(root, file));

      let virtualSource = sources[file];

      let [resolveHtml, resolveStatic, resolveFallback] = virtualSource
        ? []
        : await Promise.all([
            // check if the file exists as html
            isHtml(file) && fileExists(file),
            // check if the file exists as static
            fileExists(file),
            // it is verified in each request of the html type,
            // to ensure the existence in a dynamic environment
            isHtml(file) && !proxy && fileExists(fallback), //
          ]);

      res.setHeader("Access-Control-Allow-Origin", "*");

      // mirror files to server without writing
      if (virtualSource) {
        if (virtualSource.stream) {
          req.path = virtualSource.stream;
          nextAssetsRoot(req, res, next); //
        } else {
          let { code, type } = virtualSource;

          res.setHeader("Content-Type", mime[type]);

          res.end(type == "html" ? addLiveReload(code) : code);
        }
      } else if (resolveHtml || resolveFallback) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        try {
          let code = await asyncFs.readFile(
            resolveHtml || resolveFallback,
            "utf8"
          );
          res.end(reload ? addLiveReload(code) : code);
        } catch (e) {
          res.end(e);
        }
      } else if (resolveStatic) {
        nextAssets(req, res, next);
      } else if (nextProxy) {
        nextProxy(req, res, next);
      }
    })
    .use((req, res) => {
      // livereload
      res.writeHead(200, {
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      });
      // Send an initial ack event to stop any network request pending
      sendMessage(res, "connected", "awaiting change");
      // Send a ping event every minute to prevent console errors
      setInterval(sendMessage, 60000, res, "ping", "still waiting");
      // Watch the target directory for changes and trigger reload
      responses.push(res);
    })
    .listen(port);

  return {
    port,
    sources,
    reload() {
      responses.forEach((res) => sendMessage(res, "message", "reloading page"));
    },
  };
}
/**
 * this function searches if the available port is free,
 * if it is not it will search for the next one until
 * the limit is completed
 * @param {number} port - search start port
 * @param {number} limit - port search limit
 * @param {object} pending - allows terminating execution from an internal recursive process
 */
async function findPort(port, limit, pending) {
  if (!pending) {
    pending = {};
    pending.promise = new Promise((resolve, reject) => {
      pending.resolve = resolve;
      pending.reject = reject;
    });
  }
  let client = net.createConnection({ port });

  client.on("connect", () => {
    client.end();
    if (port > limit) {
      pending.reject();
    } else {
      findPort(port + 1, limit, pending);
    }
  });

  client.on("error", () => pending.resolve(port));

  return pending.promise;
}

function sendMessage(res, channel, data) {
  res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
  res.write("\n\n");
}

let fileExists = async (file) =>
  (await promiseErrorToNull(asyncFs.stat(file))) && file;
