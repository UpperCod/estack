import glob from "fast-glob";
import path from "path";
import {
    isJs,
    isMd,
    isFixLink,
    writeFile,
    normalizePath,
    logger,
    npmRun,
    readFile,
} from "./utils/utils";
import { createServer } from "./create-server";
import { watch } from "./watch";
import { MARK_ROOT } from "./constants";
import { loadOptions } from "./load-options";
import { loadBuild } from "./load-build";

export async function createBuild(options) {
    options = await loadOptions(options);

    let loadReady = logger.load();

    let files = await glob(options.src);

    let server;

    let reload = () => {};

    let inputs = {};

    let openCache = {};

    let open = (file) => (openCache[file] = openCache[file] || readFile(file));

    let getLink = (path) => normalizePath(options.href + path);

    let getDest = (file, folder = "") =>
        normalizePath(path.join(options.dest, folder, file));

    let isPreventLoad = (file) => file in inputs;

    let isNotPreventLoad = (file) => !isPreventLoad(file);

    let debugRoot = (message) => logger.debug(message, MARK_ROOT);

    let debugRollup = (message) => logger.debug(message, MARK_ROLLLUP);

    let footerLog = logger.footer("");

    let fileWatcher = () => {};

    async function markBuild(mark) {
        if (options.runAfterBuild) logger.mark(options.runAfterBuild);
        await logger.markBuild(mark);
        if (options.runAfterBuild) {
            try {
                await npmRun(options.runAfterBuild, footerLog);
                logger.markBuild(options.runAfterBuild);
            } catch (e) {
                logger.markBuildError(options.runAfterBuild, footerLog);
            }
        }
    }

    function deleteInput(file) {
        delete openCache[file];
        delete inputs[file];
        return file;
    }

    /**
     * gets the file name based on its type
     * @param {string} file
     */
    function getFileName(file) {
        let { name, ext } = path.parse(file);

        return normalizePath(
            isFixLink(ext)
                ? name + (isJs(ext) ? ".js" : isMd(ext) ? ".html" : ext)
                : file
                      .split("")
                      .reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
                      "-" +
                      name +
                      ext
        );
    }

    /**
     * prevents the file from working more than once
     * @param {string} file
     */
    function prevenLoad(file) {
        if (file in inputs) {
            return false;
        } else {
            return (inputs[file] = true);
        }
    }

    function mountFile({ dest, code, type, stream }) {
        if (options.virtual) {
            server.sources[dest] = { code, stream, type, stream };
        } else {
            return writeFile(dest, code);
        }
    }

    if (options.server) {
        try {
            server = await createServer({
                root: options.dest,
                port: options.port,
                reload: options.watch,
                proxy: options.proxy,
            });
            reload = server.reload;
        } catch (e) {
            console.log(e);
        }

        logger.header(`Server running on http://localhost:${server.port}`);
    }

    if (options.watch) {
        // map defining the cross dependencies between child and parents
        let mapSubWatch = {};

        let watcher = watch(options.src, (group) => {
            let files = [];
            let forceBuild;

            if (group.add) {
                let groupFiles = group.add
                    .filter(isFixLink)
                    .filter(isNotPreventLoad);
                files = [...files, ...groupFiles];
            }
            if (group.change) {
                let groupChange = group.change.filter((file) => !isJs(file)); // ignore js file changes

                let groupFiles = [
                    ...groupChange, // keep files that have changed in the queue
                    ...groupChange // add new files based on existing ones in the queue
                        .filter((file) => mapSubWatch[file])
                        .map((file) =>
                            Object.keys(mapSubWatch[file]).filter(
                                (subFile) => mapSubWatch[file][subFile]
                            )
                        )
                        .flat(),
                ]
                    .filter(isPreventLoad)
                    .map(deleteInput);

                files = [...files, ...groupFiles];
            }

            if (group.unlink) {
                group.unlink.forEach(deleteInput);
                forceBuild = true;
            }

            if (files.length || forceBuild) {
                loadBuild(build, files, forceBuild);
            }
        });

        fileWatcher = (file, parentFile, rebuild) => {
            if (!mapSubWatch[file]) {
                mapSubWatch[file] = {};
                watcher.add(file);
            }
            if (parentFile) {
                mapSubWatch[file][parentFile] = rebuild;
            }
        };
    }

    let build = {
        open,
        reload,
        inputs,
        options,
        getLink,
        getDest,
        isPreventLoad,
        isNotPreventLoad,
        markBuild,
        deleteInput,
        getFileName,
        prevenLoad,
        mountFile,
        debugRoot,
        debugRollup,
        footerLog,
        fileWatcher: fileWatcher,
    };

    loadReady();

    loadBuild(build, files);
}
