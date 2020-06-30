import { plugins } from "./plugins";
import { rollup, watch } from "rollup";
import { isCss } from "../utils/types";
import { loadCssFile } from "../load-css/load-css-file";
import { MARK_ROLLUP } from "../constants";

const CACHE_ROLLUP = Symbol("_CacheRollup");

/**
 *
 * @param {Build.build} build
 * @param {*} jsFiles
 */
export async function loadRollup(build, jsFiles) {
    const cache = build.getCache(CACHE_ROLLUP);

    let { options } = build;
    // clean the old watcher
    if (cache.watcher) cache.watcher.filter((watcher) => watcher.close());

    cache.watcher = [];

    let inputKeys = {};

    jsFiles.forEach((file) => {
        let { name } = build.getDestDataFile(file);
        inputKeys[name] = file;
    });

    let input = {
        input: inputKeys,
        onwarn(message) {
            build.logger.markBuildError(message, MARK_ROLLUP);
        },
        external: options.external,
        cache: cache.bundle,
        plugins: [
            pluginImportCss(build),
            ...plugins(
                options,
                options.virtual &&
                    ((source) =>
                        build.mountFile({
                            ...source,
                            dest: build.getDestDataFile(source.dest).dest,
                        }))
            ),
        ],
    };

    let output = {
        dir: options.dest,
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
        let watcher = watch({
            ...input,
            output,
            watch: { exclude: "node_modules/**" },
        });

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

let pluginImportCss = (build) => ({
    name: "plugin-import-css",
    async transform(code, id) {
        if (isCss(id)) {
            return {
                code: `export default ${JSON.stringify(
                    await loadCssFile({
                        file: id,
                        code,
                        readFile: build.readFile,
                        addWatchFile: (id) => this.addWatchFile(id),
                    })
                )}`,
                map: { mappings: "" },
            };
        }
    },
});

/**
 * @typeof {import("../internal") } Build
 */
