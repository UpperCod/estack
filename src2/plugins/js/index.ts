import { Plugin, Files } from "estack";
import { isJs } from "../../utils/types";
import {
    rollup,
    watch,
    RollupOptions,
    OutputOptions,
    OutputChunk,
    RollupWatcher,
    RollupLogProps,
    RollupCache,
} from "rollup";

interface Internal extends Plugin {
    withLoad?: boolean;
    watcher?: RollupWatcher;
}

export function pluginJs(): Internal {
    let withLoad: boolean;
    let cache: RollupCache;
    let watcher: RollupWatcher;
    return {
        name: "plugin-js",
        filter: ({ src }) => isJs(src),
        async load(file) {
            withLoad = true;
            file.watch = false;
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
                onwarn() {
                    return "";
                },
                cache: cache,
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
                                        assigned: true,
                                    });
                                    file.content = chunk.code;
                                }
                            }
                        },
                    },
                ],
            };

            const sendError = (error: RollupLogProps) => {
                if (error.loc) {
                    this.log.errors([
                        {
                            src: "",
                            items: [
                                [
                                    error.loc.file,
                                    error.loc.line,
                                    error.loc.column,
                                ].join(":"),
                                error.frame,
                            ],
                        },
                    ]);
                }
            };

            try {
                const bundle = await rollup(input);
                const output: OutputOptions = {
                    format: "es",
                    sourcemap: build.options.sourcemap,
                    dir: build.options.site
                        ? build.options.destAssets
                        : build.options.dest,
                };
                if (build.options.watch) {
                    cache = bundle.cache;
                    watcher = watch({
                        ...input,
                        output,
                    });
                    let withError: boolean;
                    watcher.on("event", (event) => {
                        switch (event.code) {
                            case "BUNDLE_START":
                                this.log.clear();
                                withError = false;
                                break;
                            case "ERROR":
                                withError = true;
                                sendError(event.error);
                                this.log.build();
                                break;
                            case "BUNDLE_END":
                                if (!withError) this.log.build();
                                break;
                        }
                    });
                } else {
                    await bundle.generate(output);
                }
            } catch (error) {
                sendError(error);
            }
        },
    };
}
