import path from "path";
import net from "net";
import polka from "polka";
import sirv from "sirv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { asyncFs, promiseErrorToNull, isHtml } from "./utils";

export async function createServer({ root, port, reload, proxy }) {
  let nextAssets = sirv(root, {
    dev: true,
  });

  let serverPort = await findPort(port, 100);

  let nextProxy =
    proxy && createProxyMiddleware({ target: proxy, changeOrigin: true });

  let fallbackUrl = path.join(root, "index.html");

  let responses = [];

  polka()
    .use(async (req, res, next) => {
      if (req.path == "/livereload" && reload) {
        next();
        return;
      }
      let url = path.join(root, req.path == "/" ? "index.html" : req.path);

      let optUrl = /\.[\w]+$/.test(url) ? url : url + ".html";

      let [stateHtml, stateStatic, stateFallback] = await Promise.all([
        isHtml(optUrl) && fileExists(optUrl),
        fileExists(url),
        isHtml(optUrl) && !proxy && fileExists(fallbackUrl),
      ]);

      res.setHeader("Access-Control-Allow-Origin", "*");

      if (stateHtml || stateFallback) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        try {
          let file = await asyncFs.readFile(stateHtml || stateFallback, "utf8");
          if (reload) {
            file += `
            <script>{
              let source = new EventSource('http://localhost:${serverPort}/livereload');
              source.onmessage = e =>  setTimeout(()=>location.reload(),250);
            }</script>
          `;
          }
          res.end(file);
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
    .listen(serverPort);

  return {
    serverPort,
    reload() {
      responses.forEach((res) => sendMessage(res, "message", "reloading page"));
    },
  };
}

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
