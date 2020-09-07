import { Plugin, Files } from "estack";
import { isJs } from "../../utils/types";
import {
    rollup,
    watch,
    RollupOptions,
    OutputOptions,
    OutputChunk,
    RollupWatcher,
} from "rollup";

interface Internal extends Plugin {
    withLoad?: boolean;
    watcher?: RollupWatcher;
}

export function pluginJs(): Internal {
    let withLoad: boolean;
    let watcher: RollupWatcher;
    return {
        name: "plugin-js",
        filter: ({ src }) => isJs(src),
        async load(currentFiles) {
            withLoad = true;
            currentFiles.map((file) => (file.watch = false));
        },
        async buildEnd(build) {
            const { files } = build;
            if (!withLoad) return;
            withLoad = false;
            if (watcher) {
                watcher.close();
                watcher = null;
            }

            const filesJs: Files = {};

            for (let src in files) {
                if (isJs(src)) filesJs[src] = files[src];
            }

            if (!Object.keys(filesJs).length) return;
            const alias: Files = {};
            const input: RollupOptions = {
                input: [],
                preserveEntrySignatures: false,
                onwarn() {},
                cache: this.cache,
                plugins: [
                    {
                        name: "plugin-estack-js",
                        buildStart(options) {
                            for (const src in filesJs) {
                                const file = filesJs[src];
                                const { base } = file;
                                this.emitFile({
                                    type: "chunk",
                                    id: src,
                                    fileName: base,
                                });
                                alias[base] = file;
                            }
                        },
                        generateBundle(options, chunks) {
                            for (const src in chunks) {
                                const chunk = chunks[src] as OutputChunk;
                                if (alias[chunk.fileName]) {
                                    alias[chunk.fileName].content = chunk.code;
                                } else {
                                    const file = build.addFile(chunk.fileName, {
                                        hash: false,
                                        watch: false,
                                    });
                                    file.content = chunk.code;
                                }
                            }
                        },
                    },
                ],
            };

            const bundle = await rollup(input);
            const output: OutputOptions = {
                format: "es",
                sourcemap: build.options.sourcemap,
                dir: build.options.site
                    ? build.options.destAssets
                    : build.options.dest,
            };

            if (build.options.watch) {
                this.cache = bundle;
                watcher = watch({
                    ...input,
                    output,
                });
                watcher.on("event", (event) => {
                    console.log(event);
                });
            } else {
                await bundle.generate(output);
            }
        },
    };
}
