import path from "path";
import { isMd, isUrl, normalizePath, isHtml } from "../utils/utils";
import { frontmatter } from "./frontmatter";
import { renderMarkdown } from "./render-markdown";
import { yamlRef } from "./yaml-ref";

import { MARK_ROOT } from "../constants";

/**
 * @param {import("../create-build").build} build
 * @param {*} htmlFiles
 */
export function loadHtmlFiles(build, htmlFiles) {
    return Promise.all(
        htmlFiles.map(async (file) => {
            let { dir, name } = path.parse(file);
            const code = await build.readFile(file);
            /**@type {[string,object]} */
            let meta = [code, {}];

            async function addFile(src) {
                if (isUrl(src)) return src;
                let { link } = await build.addFileToQueque(src);
                build.addChildFile(file, src);
                return link;
            }

            try {
                const aliasFile = normalizePath(file.replace(/\.\w+/, ".yaml"));
                meta = await frontmatter(aliasFile, code, {
                    ref: yamlRef({
                        async request(src, currentFile) {
                            try {
                                const [, code] = await build.request(src);
                                return code;
                            } catch (e) {
                                build.logger.markBuildError(
                                    `FetchError: request to ${normalizePath(
                                        src
                                    )} from ${normalizePath(currentFile)}`,
                                    MARK_ROOT
                                );
                                return {};
                            }
                        },
                        async readFile(src, currentFile) {
                            try {
                                build.addChildFile(currentFile, src);
                                return await build.readFile(src);
                            } catch (e) {
                                build.logger.markBuildError(
                                    `NotFound: file ${normalizePath(
                                        src
                                    )} from ${
                                        normalizePath(currentFile) == aliasFile
                                            ? file
                                            : normalizePath(currentFile)
                                    }`,
                                    MARK_ROOT
                                );
                                return {};
                            }
                        },
                    }),
                    async link(value, root, file) {
                        const { dir } = path.parse(file);
                        const src = path.join(dir, value);

                        let getData;
                        if (isHtml(src)) {
                            getData = () => build.getFile(src).page.data;
                        } else {
                            const link = await addFile(src);
                            getData = () => ({ link });
                        }

                        return {
                            value: {
                                get link() {
                                    return getData().link;
                                },
                                get linkTitle() {
                                    const data = getData();
                                    return data.linkTitle || data.title;
                                },
                                toString() {
                                    return this.link;
                                },
                            },
                        };
                    },
                });
            } catch (e) {
                build.logger.markBuildError(
                    createError(e + "", normalizePath(file)),
                    MARK_ROOT
                );
            }

            let [content, data] = meta;

            if (!build.options.watch && data.draft) {
                build.removeFile(file);
                return;
            }

            name = data.slug || name;

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

            build.getFile(file).page = {
                data: {
                    content,
                    ...data,
                    slug: normalizePath(name),
                    file: normalizePath(file),
                    link,
                },
                dest,
                addFile: (src) =>
                    addFile(isUrl(src) ? src : path.join(dir, src)),
            };
        })
    );
}

const createError = (error, file) =>
    error.replace(
        /(YAMLException:)(?:.+) +line *(\d+), +column +(\d+):/,
        (all, label, value, col) => label + " " + file + ":" + value + ":" + col
    );

/**
 * @typedef {Object} query
 * @property {{[index:string]:any}} where - query to match
 * @property {number} [limit] - page limits per page
 * @property {string} [sort] - page limits per page
 * @property {1|-1} [order] - page order is ascending(1) or decent(-1)
 */

/**
 * @typedef {Object} data - Page data interface, This is public for the template
 * @property {string} content - page content, hmlt or md.
 * @property {string} slug - name as page file slug
 * @property {string} file - page source file name
 * @property {string} link - name of access to the page as link
 * @property {string} [symlink] - symbolic page link, this allows access to the page through this alias, using the links property the template
 * @property {string} [fragment] - declare if the page is of type fragment
 * @property {string} [template] - declare if the page is of type template
 * @property {string|boolean} [layout] - declare if the page is of type layout, so it depends on a template
 * @property {query} [archive] - declare if the page will create a list of archives
 * @property {{[index:string]: query}} [query] - declare if the page will create a list of archives
 **/

/**
 * @typedef {Object} page - Page interface
 * @property {data} data -  Page data interface, This is public for the template
 * @property {string} dest - writing destination of the page
 * @property {(src:string)=>Promise<string>} addFile - add a file anonymously
 */
