import { createServer } from "./server";
export function pluginServer() {
    return {
        name: "server",
        async mounted() {
            this.server = await createServer({ port: 8000 });
        },
        afterLoad({ files }) {
            const sources = {};
            for (const src in files) {
                sources[files[src].link] = files[src];
            }
            this.server.reload(sources);
        },
    };
}
//# sourceMappingURL=index.js.map