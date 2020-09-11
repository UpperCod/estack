import { Plugin, Files } from "estack";
import { createServer, Server } from "./server";
import { log } from "../../utils/log";

export function pluginServer(): Plugin {
    let server: Server;
    return {
        name: "server",
        async mounted(build) {
            server = await createServer({
                port: build.options.port,
                files: build.files,
            });
            log({
                message: "[time] Server running on [bold.underline.green $].",
                params: [`http://localhost:${server.port}`],
            });
        },
        buildEnd({ files }) {
            server.reload();
        },
    };
}
