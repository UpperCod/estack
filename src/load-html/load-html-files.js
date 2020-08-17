import path from "path";
import {
    isMd,
    isUrl,
    normalizePath,
    isYaml,
    yamlParse,
    isJsonContent,
    getMetaPage,
    getProp,
} from "../utils/utils";

import { renderMarkdown } from "./render-markdown";

import {
    ERROR_TRANSFORMING,
    ERROR_FILE_NOT_FOUNT,
    ERROR_FETCH,
    MARK_ROOT,
} from "../constants";

/**
 *
 * @param {import("../internal").build} build
 * @param {*} htmlFiles
 */
export function loadHtmlFiles(build, htmlFiles) {
    let localResolveDataFile = {};

    function resolveDataFile(file) {
        /**
         * If the file is local, an observer relationship will be added,
         * this allows relating the data obtained from the external document
         * to the template and synchronizing the changes
         */
        async function resolve(file) {
            let value = await build.readFile(file);

            return isYaml(file)
                ? yamlParse(value)
                : isJsonContent(value)
                ? JSON.parse(value)
                : value;
        }

        return (localResolveDataFile[file] =
            localResolveDataFile[file] || resolve(file));
    }

    return Promise.all(
        htmlFiles.map(async (file) => {
            let { dir, name } = path.parse(file);
            let code = await build.readFile(file);
            let meta = [code, {}];

            try {
                meta = getMetaPage(code);
            } catch (e) {
                build.logger.debug(
                    `${ERROR_TRANSFORMING} ${file}:${e.mark.line}:${e.mark.position}`,
                    MARK_ROOT
                );
            }

            let [content, data] = meta;

            if (!build.options.watch && data.draft) {
                build.deleteInput(file);
                return;
            }

            name = data.slug || name;

            let joinChildFile = (file) => path.join(dir, file);

            let links = {};

            let fetch = {};

            let assets = {};

            data = await mapRef(data, async (value, root) => {
                let [, src, prop] = value.match(/([^~]*)(?:~(.+)){0,1}/);
                if (src) {
                    root = await addDataFetch(null, src);
                }
                return prop ? getProp(root, prop) : src ? root : null;
            });

            let { link: _link = "", folder = "" } = data;

            let dataFile;

            if (_link) {
                _link +=
                    /\/$/.test(_link) || _link == "/" ? "index.html" : ".html";
                dataFile = build.getDestDataFile(_link);
            } else {
                dataFile = build.getDestDataFile(
                    path.join(folder, name + ".html")
                );
            }

            let { dest, link } = dataFile;

            if (isMd(file)) {
                content = renderMarkdown(content);
            }

            /**
             * redefines the root scope links variable,
             * allows creating link lists based on relative paths that point
             * to the file, the getter allows access to the final link of the file
             * The objective is to reference abtracted pages in the relative
             * path, as translations or page versions
             * @param {string} prop
             * @param {*} value
             */
            async function addDataLink(prop, value) {
                if (typeof value == "string") {
                    value = await addDataFetch(null, value);
                }
                let createProxy = ({ link, linkTitle, ...meta }) => {
                    /**@todo Add error for not respecting link interface */
                    let file = path.join(dir, link);
                    let getData = (openData) =>
                        build.inputs[file]
                            ? openData(build.inputs[file].data)
                            : "";
                    return {
                        ...meta,
                        get link() {
                            return getData(({ link }) => link);
                        },
                        get linkTitle() {
                            return (
                                linkTitle ||
                                getData(
                                    ({ linkTitle, title }) =>
                                        linkTitle || title || ""
                                )
                            );
                        },
                    };
                };

                links[prop] = Array.isArray(value)
                    ? value.map(createProxy)
                    : createProxy(value);
            }

            async function addFile(src) {
                if (isUrl(src)) return src;
                let childFile = joinChildFile(src);
                try {
                    let { link } = await build.addRootAsset(childFile);
                    build.fileWatcher(childFile, file);
                    return link;
                } catch (e) {
                    build.logger.debug(
                        `${ERROR_FILE_NOT_FOUNT} ${file} src=${childFile}`,
                        MARK_ROOT
                    );
                }
                return "";
            }
            /**
             *
             * @param {string} prop
             * @param {string} src
             */
            async function addDataAsset(prop, src) {
                assets[prop] = await addFile(src);
            }

            /**
             *
             * @param {null|string} prop
             * @param {string} src
             * @returns {Promise<any>}
             */
            async function addDataFetch(prop, src) {
                try {
                    if (isUrl(src)) {
                        [, src] = await build.request(src);
                    } else {
                        let childFile = joinChildFile(src);

                        build.fileWatcher(childFile, file, true);

                        src = await resolveDataFile(childFile);
                    }
                } catch (e) {
                    build.logger.debug(
                        `${ERROR_FETCH} ${file} src=${src}`,
                        MARK_ROOT
                    );
                }
                return prop == null ? src : (fetch[prop] = src);
            }

            /**
             * The following process allows the allocation of aliases for each file to process
             */
            let resolveDataAssets = () =>
                data.assets
                    ? Object.keys(data.assets).map((prop) =>
                          addDataAsset(prop, data.assets[prop])
                      )
                    : [];

            let resolveDataFetch = () =>
                data.fetch
                    ? Object.keys(data.fetch).map((prop) =>
                          addDataFetch(prop, data.fetch[prop])
                      )
                    : [];

            let resolveDataLinks = () =>
                data.links
                    ? Object.keys(data.links).map((prop) =>
                          addDataLink(prop, data.links[prop])
                      )
                    : [];

            // These processes can be solved in parallel
            await Promise.all([
                ...resolveDataLinks(),
                ...resolveDataAssets(),
                ...resolveDataFetch(),
            ]);

            build.inputs[file] = {
                data: {
                    content,
                    ...data,
                    slug: normalizePath(name),
                    fetch,
                    assets,
                    file: normalizePath(file),
                    link,
                    links,
                },
                dest,
                addFile,
                addDataAsset,
                addDataFetch,
            };
        })
    );
}

async function mapRef(data, map, root) {
    for (let prop in data) {
        if (prop == "$ref") {
            let value = await map(data[prop], root);
            if (value && typeof value == "object") {
                let nextData = { ...data };
                delete nextData.$ref;
                let nextValue = { ...value, ...nextData };
                return mapRef(
                    nextValue,
                    map,
                    root == data ? nextValue : root || nextValue
                );
            } else {
                return value;
            }
        } else {
            if (data[prop] && typeof data[prop] == "object") {
                data[prop] = await mapRef(data[prop], map, root || data[prop]);
            }
        }
    }
    return data;
}
