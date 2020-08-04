import path from "path";
import {
    isMd,
    isUrl,
    normalizePath,
    isYaml,
    yamlParse,
    isJsonContent,
    getMetaPage,
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

            let links = {};

            let fetch = {};

            let assets = {};

            if (isMd(file)) {
                content = renderMarkdown(content);
            }

            let joinChildFile = (file) => path.join(dir, file);
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
                    value = await addDataFetch(null, value, true);
                }
                let createProxy = (data) => {
                    let { link, linkTitle = "", ...meta } =
                        typeof data == "string" ? { link: data } : data;
                    /**@todo Add error for not respecting link interface */
                    let file = path.join(dir, link);
                    return {
                        ...meta,
                        get link() {
                            return build.inputs[file]
                                ? build.inputs[file].data.link
                                : "";
                        },
                        get linkTitle() {
                            return (
                                linkTitle ||
                                build.inputs[file].linkTitle ||
                                build.inputs[file].title
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

            async function addDataAsset(prop, src) {
                assets[prop] = await addFile(src);
            }

            async function addDataFetch(prop, src, unregister) {
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
                return unregister ? src : (fetch[prop] = src);
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
