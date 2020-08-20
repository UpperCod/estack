import path from "path";
import { isMd, isUrl, normalizePath, getMetaPage } from "../utils/utils";

import { renderMarkdown } from "./render-markdown";

import {
    ERROR_TRANSFORMING,
    ERROR_FILE_NOT_FOUNT,
    MARK_ROOT,
} from "../constants";

/**
 *
 * @param {import("../internal").build} build
 * @param {*} htmlFiles
 */
export function loadHtmlFiles(build, htmlFiles) {
    return Promise.all(
        htmlFiles.map(async (file) => {
            let { dir, name } = path.parse(file);
            const code = await build.readFile(file);
            let meta = [code, {}];
            try {
                meta = await getMetaPage(
                    file.replace(/\.\w+/, ".yaml"),
                    code,
                    async (src) => {
                        if (isUrl(src)) {
                            let [, code] = await build.request(src);
                            return code;
                        } else {
                            let code = await build.readFile(src);
                            build.addChildFile(file, src);
                            return code;
                        }
                    }
                );
            } catch (e) {
                build.logger.debug(
                    `${ERROR_TRANSFORMING} ${file}:${e.mark.line}:${e.mark.position}`,
                    MARK_ROOT
                );
            }

            let [content, data] = meta;

            if (!build.options.watch && data.draft) {
                build.removeFile(file);
                return;
            }

            name = data.slug || name;

            const joinChildFile = (file) => path.join(dir, file);

            const links = {};

            const fetch = {};

            const assets = {};

            let { link: _link = "", folder = "" } = data;

            let dataFile;

            if (_link) {
                _link +=
                    /\/$/.test(_link) || _link == "/" ? "index.html" : ".html";
                dataFile = build.getDest(_link);
            } else {
                dataFile = build.getDest(path.join(folder, name + ".html"));
            }

            const { dest, link } = dataFile;

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
                const createProxy = ({ link, linkTitle, ...meta }) => {
                    /**@todo Add error for not respecting link interface */
                    const file = path.join(dir, link);
                    const getData = (openData) =>
                        build.hasFile(file)
                            ? openData(build.getFile(file).page.data)
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
                    let { link } = await build.addFileToQueque(childFile);
                    build.addChildFile(file, childFile);
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
             * The following process allows the allocation of aliases for each file to process
             */
            let resolveDataAssets = () =>
                data.assets
                    ? Object.keys(data.assets).map((prop) =>
                          addDataAsset(prop, data.assets[prop])
                      )
                    : [];

            let resolveDataLinks = () =>
                data.links
                    ? Object.keys(data.links).map((prop) =>
                          addDataLink(prop, data.links[prop])
                      )
                    : [];

            // These processes can be solved in parallel
            await Promise.all([...resolveDataLinks(), ...resolveDataAssets()]);

            build.getFile(file).page = {
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
            };
        })
    );
}
