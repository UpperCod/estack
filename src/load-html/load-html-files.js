import path from "path";

import {
    isMd,
    request,
    isUrl,
    normalizePath,
    isYaml,
    yamlParse,
    isJsonContent,
    getMetaPage,
    isHtml,
} from "../utils/utils";

import { renderMarkdown } from "./render-markdown";

import {
    ERROR_TRANSFORMING,
    ERROR_FILE_NOT_FOUNT,
    ERROR_FETCH,
    MARK_ROOT,
} from "../constants";

const resolveFetchCache = {};
/**
 * generates a single GET type request by url
 * @param {string} url - url associated with the request
 * @return {Promise<any>}
 */
function resolveRequest(url) {
    return (resolveFetchCache[url] = resolveFetchCache[url] || request(url));
}
/**
 *
 * @param {Build.build} build
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

            if (!build.options.watch && meta.draft) {
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

            let fetch = {};

            let assets = {};

            if (isMd(file)) {
                content = renderMarkdown(content);
            }

            let joinChildFile = (file) => path.join(dir, file);

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
                        src = await resolveRequest(src);
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

            // These processes can be solved in parallel
            await Promise.all([...resolveDataAssets(), ...resolveDataFetch()]);

            build.inputs[file] = {
                data: {
                    content,
                    ...data,
                    slug: normalizePath(name),
                    fetch,
                    assets,
                    file: normalizePath(file),
                    link,
                },
                dest,
                addFile,
                addDataAsset,
                addDataFetch,
            };
        })
    );
}

/**
 * @typeof {import("../internal") } Build
 */
