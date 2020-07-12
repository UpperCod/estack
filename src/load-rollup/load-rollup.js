import path from "path";
import { rollup, watch } from "rollup";
import { MARK_ROLLUP } from "../constants";
import { plugins } from "./plugins";
import { pluginImportUrl } from "./plugin-import-url";
import { pluginImportCss } from "./plugin-css";
import { normalizePath } from "../utils/fs";

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

    let aliasLoad = {};
    let aliasFileName = {};
    let entries = [];
    let root = path.join(options.dest, options.assetsDir);

    jsFiles.forEach((file) => {
        let dataFile = build.getDestDataFile(file);
        let vfile = path.join(dataFile.raw.dir, dataFile.base);
        aliasFileName[dataFile.base] = aliasLoad[vfile] = dataFile;
        entries.push(vfile);
    });
    /**@type {import("rollup").RollupOptions} */
    let input = {
        input: entries,
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
                resolveId(id) {
                    if (aliasLoad[id]) {
                        return id;
                    }
                },
                load(id) {
                    if (aliasLoad[id]) {
                        this.addWatchFile(aliasLoad[id].raw.file);
                        return build.readFile(aliasLoad[id].raw.file);
                    }
                },
                generateBundle(opts, chunks) {
                    for (let file in chunks) {
                        let { code, map, isEntry, fileName } = chunks[file];
                        let dest = file;
                        let fileMap = fileName + ".map";
                        if (aliasFileName[fileName] && isEntry) {
                            dest = aliasFileName[fileName].dest;
                            if (map) {
                                map.file = aliasFileName[fileName].raw.base;
                                map.sources = [
                                    "/" + aliasFileName[fileName].raw.file,
                                ];
                            }
                        } else {
                            dest = normalizePath(path.join(root, fileName));
                        }

                        if (opts.sourcemap && map) {
                            build.mountFile({
                                dest: dest + ".map",
                                code: map + "",
                                type: "json",
                            });
                            code += `\n//# sourceMappingURL=${fileMap}`;
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
        dir: "./",
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
        // await bundle.write(output);
    }
}
