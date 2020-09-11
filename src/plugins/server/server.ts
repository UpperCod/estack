import { Files, File } from "estack";
import { createReadStream } from "fs";
import * as http from "http";
import findPort from "@uppercod/find-port";
import { createLiveReload } from "./livereload";
import { getType } from "mime";

interface Options {
    port: number;
    proxy?: string;
    files: Files;
}

export interface Server {
    port: number;
    reload: () => void;
}

export async function createServer(options: Options): Promise<Server> {
    const port = await findPort(options.port, options.port + 100);
    const pathLiveReload = "/livereload";

    http.createServer((req, res: http.ServerResponse) => {
        if (req.url == pathLiveReload) {
            livereload.middleware(res);
            return;
        }

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");

        let file: File;

        for (const src in options.files) {
            if (options.files[src].link == req.url) {
                file = options.files[src];
                break;
            }
        }

        if (file) {
            const mime = getType(file.type);
            if (typeof file.content == "string") {
                res.writeHead(200, { "Content-Type": mime + ";charset=utf-8" });
                res.end(
                    file.type == "html"
                        ? livereload.addScriptLiveReload(file.content)
                        : file.content
                );
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
        port,
        reload: () => livereload.reload(),
    };
}

const notFound = (res: http.ServerResponse) => {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("");
};
