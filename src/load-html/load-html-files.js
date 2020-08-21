import path from "path";
import { isMd, isUrl, normalizePath, isHtml } from "../utils/utils";
import { frontmatter } from "./frontmatter";
import { renderMarkdown } from "./render-markdown";
import { yamlRef } from "./yaml-ref";

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

            async function addFile(src) {
                if (isUrl(src)) return src;
                let { link } = await build.addFileToQueque(src);
                build.addChildFile(file, src);
                return link;
            }

            try {
                meta = await frontmatter(file.replace(/\.\w+/, ".yaml"), code, {
                    ref: yamlRef({
                        async request(src) {
                            const [, code] = await build.request(src);
                            return code;
                        },
                        readFile(src) {
                            build.addChildFile(file, src);
                            return build.readFile(src);
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
                addFile: (src) =>
                    addFile(isUrl(src) ? src : path.join(dir, src)),
            };
        })
    );
}
