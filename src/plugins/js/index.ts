import { Plugin, Files } from "estack";
import * as path from "path";
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
import { pluginCss } from "./plugin-css";

interface Internal extends Plugin {
    withLoad?: boolean;
    watcher?: RollupWatcher;
}

export function pluginJs(): Internal {
    return {
        name: "plugin-js",
        filter: ({ src }) => isJs(src),

        async buildEnd(build) {
            const { files } = build;
            const filesJs: Files = {};
            for (let src in files) {
                if (isJs(src)) {
                    const file = files[src];
                    filesJs[src] = file;
                }
            }

            if (!Object.keys(filesJs).length) return;

            const alias: Files = {};
            const input: RollupOptions = {
                input: [],
                preserveEntrySignatures: false,
                onwarn() {
                    return "";
                },
                cache: this.cache,
                plugins: [
                    pluginCss(build),
                    {
                        name: "plugin-estack-js",
                        async resolveId(id, importer) {
                            if (id.startsWith("./")) {
                                if (build.hasFile(importer)) {
                                    const file = build.getFile(importer);
                                    file.addChild(id, {
                                        write: false,
                                        assigned: true,
                                    });
                                }
                            }
                            return null;
                        },
                        buildStart(options) {
                            for (const src in filesJs) {
                                const file = filesJs[src];
                                const { base, write } = file;
                                if (write) {
                                    this.emitFile({
                                        type: "chunk",
                                        id: src,
                                        fileName: base,
                                    });
                                    alias[base] = file;
                                }
                            }
                        },
                    },
                ],
            };

            const sendError = (error: RollupLogProps) => {
                if (error.loc) {
                    if (build.hasFile(error.loc.file)) {
                        build
                            .getFile(error.loc.file)
                            .addError(
                                [
                                    [
                                        error.loc.file,
                                        error.loc.line,
                                        error.loc.column,
                                    ].join(":"),
                                    error.frame,
                                ].join("")
                            );
                    }
                }
            };

            try {
                const bundle = await rollup(input);

                this.cache = bundle.cache;

                const { output } = await bundle.generate({
                    format: "es",
                    sourcemap: build.options.sourcemap,
                    dir: build.options.site
                        ? build.options.destAssets
                        : build.options.dest,
                });

                for (const src in output) {
                    const chunk = output[src] as OutputChunk;
                    if (alias[chunk.fileName]) {
                        alias[chunk.fileName].content = chunk.code;
                    } else {
                        const file = build.addFile(chunk.fileName, {
                            hash: false,
                            assigned: true,
                        });
                        file.content = chunk.code;
                    }
                }
            } catch (error) {
                sendError(error);
            }
        },
    };
}
