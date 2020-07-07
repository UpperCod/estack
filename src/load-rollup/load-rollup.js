import path from "path";
import { rollup, watch } from "rollup";
import { MARK_ROLLUP } from "../constants";
import { plugins } from "./plugins";
import { pluginImportUrl } from "./plugin-import-url";
import { pluginImportCss } from "./plugin-css";

const CACHE_ROLLUP = Symbol("_CacheRollup");

/**
 *
 * @param {import("../internal").build} build
 * @param {*} jsFiles
 */
export async function loadRollup(build, jsFiles) {
    const cache = build.getCache(CACHE_ROLLUP);

    let { options } = build;
    // clean the old watcher
    if (cache.watcher) cache.watcher.filter((watcher) => watcher.close());

    cache.watcher = [];

    let inputKeys = {};
    let inputAlias = {};

    jsFiles.forEach((file) => {
        let { base } = path.parse(file);
        let dataFile = build.getDestDataFile(file);
        inputKeys[base] = dataFile;
        inputAlias[dataFile.base] = dataFile;
    });
    /**@type {import("rollup").RollupOptions} */
    let input = {
        input: jsFiles, //Object.keys(inputKeys),
        onwarn(message) {
            build.logger.markBuildError(message + "", MARK_ROLLUP);
        },
        external: options.external,
        cache: cache.bundle,
        plugins: [
            pluginImportUrl(build),
            /**@type {import("rollup").Plugin} */
            {
                name: "local-estack",
                renderChunk(code, chunk) {
                    if (inputKeys[chunk.fileName]) {
                        chunk.fileName = inputKeys[chunk.fileName].base;
                    }
                },
                generateBundle(opts, chunks) {
                    if (!options.virtual) return;
                    for (let file in chunks) {
                        let { code, map, fileName } = chunks[file];
                        let dest = file;
                        let fileMapRelative;
                        if (inputAlias[fileName]) {
                            dest = inputAlias[fileName].dest;
                            fileMapRelative =
                                inputAlias[fileName].base + ".map";
                        }

                        if (opts.sourcemap) {
                            let fileMap = dest + ".map";
                            build.mountFile({
                                dest: fileMap,
                                code: map + "",
                                type: "json",
                            });
                            code += `\n//# sourceMappingURL=${
                                fileMapRelative || fileMap
                            }`;
                        }

                        build.mountFile({ dest, code, type: "js" });

                        delete chunks[file];
                    }
                },
            },
            pluginImportCss(build),
            ...plugins(options),
        ],
    };
    /**@type {{dir:string,format:"es",sourcemap:boolean}} */
    let output = {
        dir: path.join(options.dest, options.assetsDir),
        format: "es",
        sourcemap: options.sourcemap,
    };

    if (options.watch) {
        build.logger.mark(MARK_ROLLUP);
    }

    let bundle;

    bundle = await rollup(input);

    cache.bundle = bundle.cache;

    if (options.watch) {
        /**@type import("rollup").RollupWatchOptions */
        let optionsWatch = {
            ...input,
            output,
            watch: { exclude: ["node_modules/**"] },
        };
        let watcher = watch(optionsWatch);

        watcher.on("event", (event) => {
            switch (event.code) {
                case "START":
                    build.logger.mark(MARK_ROLLUP);
                    break;
                case "END":
                    build.logger.markBuild(MARK_ROLLUP);
                    break;
                case "ERROR":
                    build.logger.markBuildError(event.error, MARK_ROLLUP);
                    break;
            }
        });

        cache.true = 10;

        cache.watcher.push(watcher);
    } else {
        await bundle.write(output);
    }
}
