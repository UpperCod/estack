import { File, Build } from "estack";
import mapObject from "@uppercod/map-object";
import createCache from "@uppercod/cache";
import getProp from "@uppercod/get-prop";
import { request } from "@uppercod/request";
import yaml from "js-yaml";
import { isUrl, isHtml } from "../../utils/types";

const yamlLoad = (code: string, src: string) =>
    yaml.safeLoad(code, { filename: src });

const cache = createCache();

interface Parallel {
    [src: string]: Promise<any>;
}

export async function loadData(
    file: File,
    build: Build,
    parallel: Parallel = {}
) {
    try {
        const value = await build.readFile(file);

        file.write = false;

        if (!file.data) {
            let dataValue;
            try {
                dataValue = yamlLoad(value, file.src);
            } catch (e) {
                build.addError(file, e + "");
            }
            file.data = mapObject(
                {
                    file: file.src,
                    value: dataValue,
                },
                {
                    async $link({ value }) {
                        const subSrc = build.resolveFromFile(file, value);

                        const childFile = build.addFile(subSrc, {
                            hash: !isHtml(value),
                        });

                        // Any change to the imported file will overwrite the related file.
                        build.addImporter(childFile, file, {
                            rewrite: childFile.type == "html",
                        });

                        // preload it but don't expect it
                        childFile.load();
                        // If the file is of type html, a proxy is generated for the extraction of the link
                        if (childFile.type == "html") {
                            return {
                                get data() {
                                    return childFile.data;
                                },
                                get link() {
                                    return childFile.data.link;
                                },
                                get linkTitle() {
                                    return (
                                        childFile.data.linkTitle ||
                                        childFile.data.title
                                    );
                                },
                            };
                        }

                        return childFile.write
                            ? {
                                  link: childFile.link,
                                  linkTitle: childFile.meta.base,
                              }
                            : {};
                    },
                    async $ref({ value, root }) {
                        let data = root;
                        const [, src, prop]: string[] = value.match(
                            /([^#|~]*)(?:(?:#|~)(?:\/){0,1}(.*)){0,1}/
                        );
                        try {
                            if (isUrl(src)) {
                                const [, content, res] = await cache(
                                    request,
                                    src
                                );
                                const contentType = res.headers["content-type"];
                                data = /json/.test(contentType)
                                    ? JSON.parse(content)
                                    : /yaml/.test(contentType)
                                    ? yamlLoad(content, src)
                                    : content;
                            } else if (src) {
                                /**
                                 * @todo file.data escapes from the asynchronous
                                 * cyclo, this prevents the internal reading
                                 * before the resolution, investigate mapObject,
                                 * it may not be generating an asynchronous
                                 * queue correctly
                                 */
                                const childFile = build.addFile(
                                    build.resolveFromFile(file, src),
                                    {
                                        load: false,
                                    }
                                );

                                // Any change to the imported file will overwrite the related file.
                                build.addImporter(childFile, file);

                                if (!parallel[childFile.src]) {
                                    parallel[childFile.src] = loadData(
                                        childFile,
                                        build,
                                        parallel
                                    );
                                }

                                data = await parallel[childFile.src];

                                // const { root } = await childFile.data;
                                // data = root;
                            }
                            return prop ? getProp(data, prop) : data;
                        } catch (e) {
                            return {};
                        }
                    },
                }
            );
        }

        const { root } = await file.data;

        if (file.root && file.type != "html") {
            const name = file.meta.name || root.name;
            build.options.site[name] = root;
        }

        return root;
    } catch (e) {
        build.addError(file, e + "");
    }
}
