import { Files, Plugin } from "estack";
import { rollup, OutputChunk } from "rollup";
import { isJs } from "../../utils/types";
export function pluginJs(): Plugin {
    return {
        name: "plugin-js",
        filter: ({ src }) => isJs(src),
        load() {},
        async buildEnd(build) {
            if (!this.loads) return;
            const { files } = build;
            const filesJs: Files = {};
            const alias: Files = {};
            for (const src in files) {
                if (isJs(src)) filesJs[src] = files[src];
            }
            const bundle = await rollup({
                input: [],
                plugins: [
                    {
                        name: "plugin-estack-js",
                        async resolveId(id, importer) {
                            if (id.startsWith("./")) {
                                if (build.hasFile(importer)) {
                                    const file = build.getFile(importer);
                                    if (file) {
                                        const childFile = await build.addFile(
                                            build.resolveFromFile(file, id),
                                            {
                                                load: false,
                                            }
                                        );
                                        childFile.write = false;
                                        build.addImporter(childFile, file);
                                    }
                                }
                            }
                            return null;
                        },
                        buildStart(options) {
                            for (const src in filesJs) {
                                const file = filesJs[src];
                                const { dest, write } = file;
                                const fileName = dest.replace(/^\//, "");
                                if (write) {
                                    this.emitFile({
                                        type: "chunk",
                                        id: src,
                                        fileName,
                                    });
                                    alias[fileName] = file;
                                }
                            }
                        },
                    },
                ],
            });

            const { output } = await bundle.generate({
                dir: "",
                format: "esm",
            });
            for (const src in output) {
                const chunk = output[src] as OutputChunk;
                if (alias[chunk.fileName]) {
                    alias[chunk.fileName].content = chunk.code;
                } else {
                    const file = await build.addFile(chunk.fileName, {
                        hash: false,
                    });
                    file.content = chunk.code;
                }
            }
        },
    };
}
