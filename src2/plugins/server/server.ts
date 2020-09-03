import { Files } from "@estack/core";
import { createReadStream } from "fs";
import * as http from "http";
import findPort from "@uppercod/find-port";
import { createLiveReload } from "./livereload";
import { getType } from "mime";

interface Options {
    port: number;
    proxy?: string;
}

interface Context {
    reload: (sources: Files) => void;
}

export async function createServer(options: Options): Promise<Context> {
    const port = await findPort(options.port, options.port + 100);
    const pathLiveReload = "/livereload";
    let sources: Files = {};

    http.createServer((req, res: http.ServerResponse) => {
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
                res.end(file.content);
            } else {
                const readStream = createReadStream(file.src);
                readStream.on("open", () => {
                    res.writeHead(200, { "Content-Type": mime });
                    readStream.pipe(res);
                });
                readStream.on("error", () => {
                    notFound(res);
                });
            }
        } else {
            notFound(res);
        }
    }).listen(port);

    const livereload = createLiveReload(pathLiveReload, port);

    return {
        reload: (nextSources: Files) => {
            sources = nextSources;
            livereload.reload();
        },
    };
}

const notFound = (res: http.ServerResponse) => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("");
};
