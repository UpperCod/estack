import { Plugin, Files } from "@estack/core";
import { createServer } from "./server";

export function pluginServer(): Plugin {
    return {
        name: "server",
        async mounted() {
            this.server = await createServer({ port: 8000 });
        },
        afterLoad({ files }) {
            const sources: Files = {};
            for (const src in files) {
                sources[files[src].link] = files[src];
            }
            this.server.reload(sources);
        },
    };
}
