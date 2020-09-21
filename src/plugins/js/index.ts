import { Files, Plugin } from "estack";
import { rollup, OutputChunk } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { isJs } from "../../utils/types";
import { pluginLocalResolve } from "./plugin-local-resolve";
import { pluginImportCss } from "./plugin-import-css";

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
            let onlyRoot = true;
            for (const src in files) {
                const file = files[src];
                if (isJs(src) && file.load) {
                    // if (file.hash) {
                    chunksJs[src] = file;
                    // } else {
                    //     filesJs[src] = file;
                    // }
                }
            }
            const extensions = build.options.js.extensions.map(
                (type) => "." + type
            );

            // if (!onlyRoot) {
            //     for (const src in filesJs) {
            //         filesJs[src].write = false;
            //         chunksJs[src] = filesJs[src];
            //         delete filesJs[src];
            //     }
            // }

            try {
                const bundle = await rollup({
                    input: [], //Object.keys(filesJs),
                    plugins: [
                        //importUrl(),
                        pluginLocalResolve(
                            build,
                            chunksJs,
                            aliasJs,
                            extensions
                        ),
                        pluginImportCss(build),
                        nodeResolve({ extensions }),
                        ...build.options.js.plugins,
                    ],
                });

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
                                asset: onlyRoot,
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
            } catch (e) {
                e.message.replace(/\((.+)\)\.$/, (all: string, src: string) => {
                    if (files[src]) {
                        build.addError(files[src], e + "");
                    }
                });
            }
        },
    };
}
