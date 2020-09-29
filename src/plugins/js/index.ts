import { Files, Plugin } from "estack";
import { rollup, OutputChunk, RollupCache } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { isJs } from "../../utils/types";
import { pluginLocalResolve } from "./plugin-local-resolve";
import { pluginImportCss } from "./plugin-import-css";

export function pluginJs(): Plugin {
    return {
        name: "plugin-js",
        filter: ({ type }) => type == "js",
        load(file) {
            file.data = file.content;
        },
        async buildEnd(build) {
            if (!this.loads) return;
            const { files } = build;
            const chunksJs: Files = {};
            const aliasJs: Files = {};
            for (const src in files) {
                const file = files[src];
                if (isJs(src) && file.load) {
                    chunksJs[src] = file;
                }
            }
            const extensions = build.options.js.extensions.map(
                (type) => "." + type
            );

            if (this.cache) {
                const { modules } = this.cache as RollupCache;
                modules.forEach((cache) => {
                    const src = build.getSrc(cache.id);
                    const file = files[src];
                    if (file && file.data != cache.originalCode) {
                        cache.originalCode = null;
                    }
                });
            }

            const bundle = await rollup({
                input: [],
                external: build.options.external,
                treeshake: build.options.mode == "build",
                cache: this.cache,
                plugins: [
                    //importUrl(),
                    pluginLocalResolve(build, chunksJs, aliasJs, extensions),
                    pluginImportCss(build),
                    nodeResolve({ extensions }),
                    ...build.options.js.plugins,
                ],
            });

            this.cache = bundle.cache;

            const { output } = await bundle.generate({
                dir: "", //build.options.dest,
                format: "esm",
                sourcemap: build.options.sourcemap,
                chunkFileNames: (
                    build.options.site.assets + "c-[hash].js"
                ).replace(/^\//, ""),
            });

            await Promise.all(
                output.map(async (chunk: OutputChunk) => {
                    let { code, fileName } = chunk;

                    const file =
                        aliasJs[fileName] ||
                        build.addFile(fileName, {
                            load: false,
                            asset: true,
                        });

                    if (chunk.map) {
                        // The map file is associated with the file that demands it, so the path is relative to it
                        const fileNameMap = file.base + ".map";

                        code += `\n//# sourceMappingURL=${fileNameMap}`;

                        const fileMap = build.addFile(fileNameMap, {
                            load: false,
                            asset: file.asset,
                            watch: false,
                        });

                        fileMap.content = chunk.map + "";
                    }

                    file.content = code;
                })
            );
        },
    };
}
