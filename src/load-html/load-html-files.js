import path from "path";
import load from "@uppercod/map-object";

import { isMd, isUrl, normalizePath } from "../utils/utils";
import { frontmatter } from "./frontmatter";
import { renderMarkdown } from "./render-markdown";

import { MARK_ROOT } from "../constants";
import { $ref } from "./load-$ref";
import { $link } from "./load-$link";

/**
 * @param {import("../create-build").build} build
 * @param {*} htmlFiles
 */
export function loadHtmlFiles(build, htmlFiles) {
    return Promise.all(
        htmlFiles.map(
            /**
             * @param {string} file
             */
            async (file) => {
                let { dir, name } = path.parse(file);
                const code = await build.readFile(file);
                /**@type {[string,data]} */
                let meta = [code, {}];
                /**
                 *
                 * @param {string} src
                 */
                async function addFile(src) {
                    if (isUrl(src)) return src;
                    const dest = await build.addFileToQueque(src);
                    build.addChildFile(file, src);
                    return dest;
                }

                try {
                    const aliasFile = normalizePath(
                        file.replace(/\.\w+/, ".yaml")
                    );

                    meta = frontmatter(file, code);
                } catch (e) {
                    build.logger.markBuildError(
                        createError(e + "", normalizePath(file)),
                        MARK_ROOT
                    );
                }
                let [content, prevData] = meta;

                const { value, tree } = await load(
                    {
                        file,
                        value: prevData,
                    },
                    {
                        $link: $link(build, addFile),
                        $ref: $ref(build),
                        async $global({ value, root, file: _file }) {
                            if (_file == file) {
                                build.global[value] = root;
                            }
                            return {};
                        },
                    }
                );

                for (let prop in tree.tree) {
                    if (prop != file) build.addChildFile(file, prop);
                }
                /**@type {data} */
                const data = value;

                if (!build.options.watch && data.draft) {
                    build.removeFile(file);
                    return;
                }

                name = data.slug || name;

                let { link: _link = "", permalink, folder = "" } = data;

                let dataFile;

                _link = _link || permalink;

                if (_link) {
                    _link +=
                        /\/$/.test(_link) || _link == "/"
                            ? "index.html"
                            : ".html";
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
                    addFile: async (src) => {
                        const { link } = await addFile(
                            isUrl(src) ? src : path.join(dir, src)
                        );
                        return link;
                    },
                };
            }
        )
    );
}
/**
 *
 * @param {string} error
 * @param {string} file
 */
const createError = (error, file) =>
    error.replace(
        /(YAMLException:)(?:.+) +line *(\d+), +column +(\d+):/,
        (all, label, value, col) => label + " " + file + ":" + value + ":" + col
    );

/**
 * @typedef {Object} query
 * @property {Object<string,any>} find - query to match
 * @property {number} [limit] - page limits per page
 * @property {Object<string,number>} [sort] - page limits per page
 */

/**
 * @typedef {Object} data - Page data interface, This is public for the template
 * @property {number} [__br]
 * @property {boolean} [draft] -
 * @property {string} [content] - page content, hmlt or md.
 * @property {string} [permalink] - name as page file slug
 * @property {string} [slug] - name as page file slug
 * @property {string} [folder] - name as page file slug
 * @property {string} [name] - name as page file slug
 * @property {string} [title] - page source file name
 * @property {string} [linkTitle] - page source file name
 * @property {string} [file] - page source file name
 * @property {string} [link] - name of access to the page as link
 * @property {string} [fragment] - declare if the page is of type fragment
 * @property {string} [template] - declare if the page is of type template
 * @property {string} [singlePage] - declare if the page is of type template
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
