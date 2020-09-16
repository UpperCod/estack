import { Files, Plugin } from "estack";
import { rollup, OutputChunk } from "rollup";
import { isJs } from "../../utils/types";
import { pluginLocalResolve } from "./plugin-local-resolve";
import { pluginImportCss } from "./plugin-import-css";
import importUrl from "rollup-plugin-import-url";

export function pluginJs(): Plugin {
    return {
        name: "plugin-js",
        filter: ({ type }) => type == "js",
        load() {},
        async buildEnd(build) {
            if (!this.loads) return;
            const { files } = build;
            const filesJs: Files = {};
            const chunksJs: Files = {};
            const aliasJs: Files = {};
            for (const src in files) {
                const file = files[src];
                if (isJs(src) && file.load) {
                    if (file.hash) {
                        chunksJs[src] = file;
                    } else {
                        filesJs[src] = file;
                    }
                }
            }
            const bundle = await rollup({
                input: Object.keys(filesJs),
                plugins: [
                    importUrl(),
                    pluginLocalResolve(
                        build,
                        chunksJs,
                        aliasJs,
                        build.options.js.extensions.map((type) => "." + type)
                    ),
                    pluginImportCss(build),
                    ...build.options.js.plugins,
                ],
            });

            const { output } = await bundle.generate({
                dir: build.options.dest,
                format: "esm",
                chunkFileNames: build.options.assets + "[hash].js",
            });

            await Promise.all(
                output.map(async (chunk: OutputChunk) => {
                    if (aliasJs[chunk.fileName]) {
                        aliasJs[chunk.fileName].content = chunk.code;
                    } else {
                        const file = await build.addFile(chunk.fileName, {
                            load: false,
                            asset: true,
                        });
                        file.content = chunk.code;
                    }
                })
            );
        },
    };
}
