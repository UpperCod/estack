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

  let fallbackUrl = path.join(root, "index.html");

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
      let url = normalizePath(
        path.join(root, req.path == "/" ? "index.html" : req.path)
      );

      let virtualSource = sources[url];

      let optUrl = /\.[\w]+$/.test(url) ? url : url + ".html";

      let [stateHtml, stateStatic, stateFallback] = virtualSource
        ? []
        : await Promise.all([
            // check if the file exists as html
            isHtml(optUrl) && fileExists(optUrl),
            // check if the file exists as static
            fileExists(url),
            // it is verified in each request of the html type,
            // to ensure the existence in a dynamic environment
            isHtml(optUrl) && !proxy && fileExists(fallbackUrl), //
          ]);

      res.setHeader("Access-Control-Allow-Origin", "*");

      // mirror files to server without writing
      if (virtualSource) {
        if (virtualSource.stream) {
          req.path = virtualSource.stream;
          nextAssetsRoot(req, res, next); //
        } else {
          let file = virtualSource.code;

          res.setHeader("Content-Type", mime[virtualSource.type]);

          res.end(virtualSource.type == "html" ? addLiveReload(file) : file);
        }
      } else if (stateHtml || stateFallback) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        try {
          let file = await asyncFs.readFile(stateHtml || stateFallback, "utf8");
          res.end(reload ? addLiveReload(file) : file);
        } catch (e) {
          res.end(e);
        }
      } else if (stateStatic) {
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
