import net from "net";
import path from "path";
import http from "http";
import url from "url";
import { asyncStat, asyncReadFile, cwd } from "./utils";
import types from "./server-types";

export default async function createServer(dir, watch, portStart) {
  let port = await findPort(portStart, portStart + 100);

  let reloadPort = await findPort(5000, 5080);

  http
    .createServer(async (req, res) => {
      let { pathname } = url.parse(req.url);

      let reqFile = pathname.match(/\.([\w]+)$/);
      let resource = decodeURI(pathname);

      resource = resource == "/" || pathname == "/" ? "index" : resource;

      let fileUrl = path.join(cwd, dir, resource + (reqFile ? "" : ".html"));

      let fallbackUrl = path.join(cwd, dir, "index.html");

      let ext = reqFile ? reqFile[1] : "html";

      let responseSuccess = async (url, ext) => {
        let file = await asyncReadFile(url, "binary");
        if (ext == "html" && watch) {
          file += `
            <script>
              const source = new EventSource('http://localhost:${reloadPort}');
              source.onmessage = e =>  location.reload(); 
            </script>
          `;
        }
        sendFile(res, 200, file, ext);
      };
      // Check if files exists at the location
      try {
        await asyncStat(fileUrl);
        try {
          await responseSuccess(fileUrl, ext);
        } catch (e) {
          sendError(res, 500);
        }
      } catch (e) {
        if (ext == "html") {
          try {
            await asyncStat(fallbackUrl);
            await responseSuccess(fallbackUrl, "html");
          } catch {
            sendError(res, 404);
          }
        }
        sendError(res, 404);
      }
    })
    .listen(parseInt(port, 10));

  let responses = [];
  if (watch) {
    http
      .createServer((request, res) => {
        // Open the event stream for live reload
        res.writeHead(200, {
          Connection: "keep-alive",
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        });
        // Send an initial ack event to stop any network request pending
        sendMessage(res, "connected", "awaiting change");
        // Send a ping event every minute to prevent console errors
        setInterval(sendMessage, 60000, res, "ping", "still waiting");
        // Watch the target directory for changes and trigger reload

        responses.push(res);
      })
      .listen(parseInt(reloadPort, 10));
  }

  console.log(`\nserver running on http://localhost:${port}\n`);

  return function reload() {
    responses.forEach(res => sendMessage(res, "message", "reloading page"));
  };
}

let mime = Object.entries(types).reduce(
  (all, [type, exts]) =>
    Object.assign(all, ...exts.map(ext => ({ [ext]: type }))),
  {}
);

function sendFile(res, status, file, ext) {
  res.writeHead(status, {
    "Content-Type": mime[ext] || "application/octet-stream",
    "Access-Control-Allow-Origin": "*"
  });
  res.write(file, "binary");
  res.end();
}

function sendMessage(res, channel, data) {
  res.write(`event: ${channel}\nid: 0\ndata: ${data}\n`);
  res.write("\n\n");
}
function sendError(res, status) {
  res.writeHead(status);
  res.end();
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
