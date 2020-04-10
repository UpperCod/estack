import path from "path";
import net from "net";
import Koa from "koa";
import send from "koa-send";
import http from "http";
import { isHtml, asyncFs, promiseErrorToNull } from "./utils";
import httpProxy from "http-proxy";

const serverProxy = httpProxy.createProxyServer({
  followRedirects: true,
  secure: false,
});

export async function createServer({
  dest,
  watch,
  port: portStart = 8000,
  proxy,
}) {
  const [port, reloadPort] = await Promise.all([
    findPort(portStart, portStart + 100),
    findPort(5000, 5080),
  ]);

  const serverStatic = new Koa();

  serverStatic.use(async (ctx) => {
    let url = path.join(dest, ctx.path);
    let urlInfo = path.parse(url);

    let mapStatic = async () => {
      return (await promiseErrorToNull(asyncFs.stat(url))) && url;
    };
    let mapHtml = async () => {
      let url = path.join(urlInfo.dir, urlInfo.name + ".html");
      return (await promiseErrorToNull(asyncFs.stat(url))) && url;
    };
    let mapHome = async () => {
      let url = path.join(dest, "index.html");
      return (await promiseErrorToNull(asyncFs.stat(url))) && url;
    };

    let [urlStatic, urlHtml, urlHome] = await Promise.all([
      urlInfo.ext && mapStatic(),
      !urlInfo.ext && mapHtml(),
      !urlInfo.ext && mapHome(),
    ]);

    url = urlStatic || urlHtml || urlHome || url;

    ctx.set("Access-Control-Allow-Origin", "*");

    if (proxy && ctx.path != "/" && !urlStatic && !urlHtml) {
      let target = proxy + ctx.originalUrl;
      return new Promise((resolve) =>
        serverProxy.web(
          ctx.req,
          ctx.res,
          {
            target,
          },
          resolve
        )
      );
    } else if (urlStatic || ((urlHtml || urlHome) && !watch)) {
      await send(ctx, url);
    } else if ((urlHtml || urlHome) && watch) {
      try {
        let file = await asyncFs.readFile(url, "utf8");
        ctx.status = 200;
        ctx.set("Content-Type", "text/html");
        ctx.set("Cache-Control", "no-cache");
        ctx.body = file += `
          <script>
            const source = new EventSource('http://localhost:${reloadPort}');
            source.onmessage = e =>  location.reload();
          </script>
          `;
        return;
      } catch (e) {}
    }
  });

  serverStatic.listen(port);
  const responses = [];

  if (watch) {
    http
      .createServer((req, res) => {
        // Open the event stream for live reload
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
      .listen(reloadPort);
  }

  return {
    port,
    reload() {
      if (watch)
        responses.forEach((res) =>
          sendMessage(res, "message", "reloading page")
        );
    },
  };
}

function sendMessage(res, channel, data) {
  res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
  res.write("\n\n");
}

async function findPort(port, limit, pending) {
  if (!pending) {
    pending = {};
    pending.promise = new Promise((resolve, reject) => {
      pending.resolve = resolve;
      pending.reject = reject;
    });
  }
  const client = net.createConnection({ port });
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
