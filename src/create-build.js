import glob from "fast-glob";
import { request as uRequest } from "@uppercod/request";
import createTree from "@uppercod/imported";
import createCache from "@uppercod/cache";
import hash from "@uppercod/hash";
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

/**
 * @param {import("./load-options").options} options
 */
export async function createBuild(options) {
    let cycleBuild = 0;
    /**
     * @type {{add:(file:string)=>void}}
     */
    let watcher;

    /**@type {import("./create-server").server} */
    let server;

    options = await loadOptions(options);

    const tree = createTree();
    const cache = createCache();
    const getDataDest = createDataDest(options);

    /**@type {Object<string|symbol,any>} */
    const refCache = {};
    /** @type {build["getRefCache"]} */
    const getRefCache = (id) => (refCache[id] = refCache[id] || {});

    const loadReady = logger.load();

    const files = await glob(options.src);

    /** @type {build["addFile"]} */
    const addFile = (src) => tree.add(src);

    /** @type {build["writeFile"]} */
    const writeFile = ({ dest, code, type, stream }) => {
        if (options.virtual) {
            server.sources[dest] = { code, stream, type };
        } else {
            return stream ? fsCopyFile(stream, dest) : fsWriteFile(dest, code);
        }
    };

    /** @type {build["addChildFile"]} */
    const addChildFile = (src, childSrc) => {
        tree.addChild(src, childSrc);
        watcher && watcher.add(childSrc);
    };

    /** @type {build["removeFile"]} */
    const removeFile = (src) => tree.remove(src);

    /** @type {build["getFile"]} */
    const getFile = (src) => tree.get(src);

    /** @type {build["getFiles"]} */
    const getFiles = () => Object.keys(tree.tree).map((src) => getFile(src));

    /** @type {build["readFile"]} */
    const readFile = (src, cache = true) => {
        const file = getFile(src);
        const content = (cache ? file.content : false) || fsReadFile(src);
        return (file.content = content);
    };
    1;

    /** @type {build["hasFile"]} */
    const hasFile = (src) => tree.has(src);

    /** @type {build["reserveFile"]} */
    const reserveFile = (src) => {
        const file = getFile(src);
        const prevent = file.prevent;
        file.prevent = true;
        return !prevent;
    };

    /** @type {build["isReservedFile"]} */
    const isReservedFile = (src) => !!getFile(src).prevent;

    /** @type {build["isAsset"]} */
    const isAsset = (src) => !options.assetsWithoutHash.test(src);

    /** @type {build["getDest"]} */
    const getDest = (src) => cache(getDataDest, src);

    /** @type {build["request"]} */
    const request = (src) => cache(uRequest, src);

    /**@type {build} */
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
        isAsset,
        getDest,
        getRefCache,
        logger: {
            ...logger,
            async markBuild(...args) {
                await logger.markBuild(...args);
                server && server.reload();
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
                        const roots = tree.getRoots(src);
                        tree.remove(src);
                        return roots;
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

/**
 *
 * @param {import("./load-options").options} options
 * @returns {(file:string)=>dest}
 */
const createDataDest = (options) => (file) => {
    let { name, ext, dir, base } = path.parse(file);

    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";

    const typeHtml = ext == ".html";

    const isIndex = typeHtml && name == "index";

    if (!options.assetsWithoutHash.test(ext)) {
        /**
         * @type {Object<string,string>}
         */
        const data = {
            hash: hash(file),
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

/**
 * @template T
 * @typedef {(str:string)=>T} fnFile
 */

/**
 * @typedef {Object} record - interface for file registration
 * @property {string} dest - file destination
 * @property {string} [type] - type of file
 * @property {string} [code] - file code if this is string
 * @property {string} [stream] - origin of the file to generate stream of this
 */

/**
 * @typedef {Object} file - file registration in build
 * @property {string} src - source
 * @property {string[]} imported - Import relations
 * @property {Promise<string>} [content] -
 * @property {boolean}  [prevent] - Files declared as root are retrieved using getParents
 * @property {boolean}  [root] - Files declared as root are retrieved using getParents
 * @property {import("./load-html/load-html-files").page} [page] - page data, it is created only from html or md documents
 */

/**
 * @typedef {Object} dest - represents the destination data of the file
 * @property {string} base - filename with type extension
 * @property {string} name - filename
 * @property {string} link - file link as static
 * @property {string}  dest - file destination for write
 * @property {{base:string,file:string,dir:string}} raw - date of origin
 */

/**
 * @callback readFile
 * @param {string} src - file
 * @param {boolean} [fromCache=true] - if false, ignore the cache
 * @returns {Promise<string>}
 */

/**
 * @typedef {Object} build
 * @property {readFile} readFile - Read the log, it keeps a cache on the read
 * @property {fnFile<void>} addFile  - add a file to the file tree, files added with this function are cataloged as root.
 * @property {fnFile<boolean>} hasFile - Check if the file exists in the tree
 * @property {fnFile<file>} getFile - Get a file record
 * @property {()=>file[]} getFiles - Get a file record
 * @property {(data:record)=>Promise<any>|undefined} writeFile - Write or virtualize a file
 * @property {fnFile<void>} removeFile - Remove the relationship from the build file
 * @property {fnFile<boolean>} reserveFile - reserve a file in the execution queue
 * @property {fnFile<boolean>} isReservedFile - check if the file is reserved
 * @property {fnFile<boolean>} isAsset - check if the file is assets
 * @property {fnFile<dest>} getDest - check if the file is assets
 * @property {(id:string|symbol)=>Object<string|symbol,any>} getRefCache - Gets an object cache
 * @property {(src:string,srcChild:string)=>void} addChildFile - relate the srcChild file to src
 * @property {(url:string)=>Promise<import("@uppercod/request").Return>} request - Generate a request returning the url and body of this
 * @property {import("./load-options").options} options
 * @property {import("./utils/logger").logger} logger
 * @property {fnFile<Promise<any>>} [addFileToQueque] - This method is only created in load-build.
 */
