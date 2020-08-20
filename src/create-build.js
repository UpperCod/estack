import glob from "fast-glob";
import path from "path";
import {
    writeFile as fsWriteFile,
    readFile as fsReadFile,
    copyFile as fsCopyFile,
    isJs,
    normalizePath,
    logger,
    isHtml,
} from "./utils/utils";
import { createServer } from "./create-server";
import { createWatch } from "./create-watch";
import { loadOptions } from "./load-options";
import { loadBuild } from "./load-build";
import { request as uRequest } from "@uppercod/request";
import createTree from "@uppercod/index-tree";
import createCache from "@uppercod/cache";

/**
 * @param {import("./internal").options} options
 */
export async function createBuild(options) {
    let cycleBuild = 0;
    let watcher;
    let server;

    options = await loadOptions(options);

    const tree = createTree();
    const cache = createCache();
    const getDataDest = createDataDest(options);

    const refCache = {};
    const getRefCache = (id) => (refCache[id] = refCache[id] || {});

    const loadReady = logger.load();

    const files = await glob(options.src);

    const addFile = (src) => tree.add(src);

    const writeFile = ({ dest, code, type, stream }) => {
        if (options.virtual && server) {
            server.sources[dest] = { code, stream, type };
        } else {
            return fsWriteFile(dest, code);
        }
    };

    const copyFile = (from, to) => fsCopyFile(from, to);

    const addChildFile = (src, childSrc) => {
        tree.addChild(src, childSrc);
        watcher.add(childSrc);
    };

    const removeFile = (src) => tree.remove(src);

    const getFile = (src) => tree.get(src);

    const getFiles = () => Object.keys(tree.tree).map((src) => tree.tree[src]);

    const readFile = (src, cache = true) => {
        const file = tree.get(src);
        const conent = (cache ? file.content : false) || fsReadFile(src);
        return (file.content = conent);
    };

    const hasFile = (src) => tree.has(src);

    const reserveFile = (src) => {
        const file = tree.get(src);
        const prevent = file.prevent;
        file.prevent = true;
        return !prevent;
    };

    const isReservedFile = (src) => !!tree.get(src).prevent;

    const isNotReservedFile = (src) => !isReservedFile(src);

    const isAsset = (src) => !options.assetsWithoutHash.test(src);

    const getDest = (src) => cache(getDataDest, src);

    const request = (src) => cache(uRequest, src);

    const build = {
        options,
        getFile,
        addFile,
        request,
        writeFile,
        readFile,
        hasFile,
        addChildFile,
        removeFile,
        getFiles,
        reserveFile,
        isReservedFile,
        isNotReservedFile,
        isAsset,
        getDest,
        getRefCache,
        logger: {
            ...logger,
            async markBuild(...args) {
                await logger.markBuild(...args);
                server.reload();
            },
        },
    };

    if (options.watch) {
        watcher = createWatch(options.src, (group) => {
            let files = group.add || [];
            let forceBuild;

            if (group.unlink) {
                group.unlink.forEach(tree.remove);
                forceBuild = true;
            }
            if (group.change) {
                group.change
                    .filter((src) => !isJs(src))
                    .map((src) => {
                        const parents = tree.getParents(src);
                        tree.remove(src);
                        return parents;
                    })
                    .flat()
                    .forEach((src) => {
                        tree.remove(src);
                        files.push(src);
                    });
            }
            if (files.length || forceBuild) {
                loadBuild(build, files, cycleBuild++, forceBuild);
            }
        });
    }

    if (options.server) {
        try {
            server = await createServer({
                root: options.dest,
                port: options.port,
                reload: options.watch,
                proxy: options.proxy,
            });
        } catch (e) {
            console.log(e);
        }
        logger.header(`Server running on http://localhost:${server.port}`);
    }

    loadReady();

    return loadBuild(build, files, cycleBuild++);
}

const createDataDest = (options) => (file) => {
    let { name, ext, dir, base } = path.parse(file);

    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";

    const typeHtml = ext == ".html";

    const isIndex = typeHtml && name == "index";

    if (!options.assetsWithoutHash.test(ext)) {
        const data = {
            hash:
                "" +
                file
                    .split("")
                    .reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4),
            name,
        };

        name = options.assetHashPattern.replace(
            /\[([^\]]+)\]/g,
            (all, prop) => data[prop] || ""
        );

        if (name.indexOf(data.hash) == -1) {
            name = data.hash + "-" + name;
        }
    }

    const destDir = typeHtml ? dir : options.assetsDir;

    const dest = normalizePath(path.join(options.dest, destDir, name + ext));

    const link = normalizePath(
        path.join(
            options.href,
            destDir,
            isIndex ? "./" : name + (typeHtml ? "" : ext)
        )
    );

    return {
        base: name + ext,
        name,
        link,
        dest,
        raw: {
            base,
            file: normalizePath(file),
            dir,
        },
    };
};
