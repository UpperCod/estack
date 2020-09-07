import { Plugin, Files } from "estack";
import { createServer, Server } from "./server";

export function pluginServer(): Plugin {
    let server: Server;
    return {
        name: "server",
        async mounted(build) {
            server = await createServer({ port: build.options.port });
            build.log.log({
                header: `Server running on http://localhost:${server.port}`,
                color: "green",
            });
        },
        buildEnd({ files }) {
            const sources: Files = {};
            for (const src in files) {
                sources[files[src].link] = files[src];
            }
            server.reload(sources);
        },
    };
}
