import { createReadStream } from "fs";
import * as http from "http";
import findPort from "@uppercod/find-port";
import { createLiveReload } from "./livereload";
import { getType } from "mime";
export async function createServer(options) {
    const port = await findPort(options.port, options.port + 100);
    const pathLiveReload = "/livereload";
    let sources = {};
    http.createServer((req, res) => {
        if (req.url == pathLiveReload) {
            livereload.middleware(res);
            return;
        }
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");
        const file = sources[req.url];
        if (file) {
            const mime = getType(file.type);
            if (file.assigned && typeof file.content == "string") {
                res.writeHead(200, { "Content-Type": mime + ";charset=utf-8" });
                res.end(file.type == "html"
                    ? livereload.addScriptLiveReload(file.content)
                    : file.content);
            }
            else {
                const readStream = createReadStream(file.src);
                readStream.on("open", () => {
                    res.writeHead(200, { "Content-Type": mime });
                    readStream.pipe(res);
                });
                readStream.on("error", () => {
                    notFound(res);
                });
            }
        }
        else {
            notFound(res);
        }
    }).listen(port);
    const livereload = createLiveReload(pathLiveReload, port);
    return {
        reload: (nextSources) => {
            sources = nextSources;
            livereload.reload();
        },
    };
}
const notFound = (res) => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("");
};
//# sourceMappingURL=server.js.map