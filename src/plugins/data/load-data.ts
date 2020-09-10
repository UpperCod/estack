import { File, Build } from "estack";
import mapObject from "@uppercod/map-object";
import createCache from "@uppercod/cache";
import getProp from "@uppercod/get-prop";
import { request } from "@uppercod/request";
import { safeLoad } from "js-yaml";
import { isUrl } from "../../utils/types";

const yamlLoad = (code: string, src: string) =>
    safeLoad(code, { filename: src });

const cache = createCache();

export async function loadData(file: File, build: Build) {
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
                    const { link, write } = await build.addFile(
                        build.resolveFromFile(file, value)
                    );
                    return write ? { link } : {};
                },
                async $ref({ value, root }) {
                    let data = root;
                    const [, src, prop]: string[] = value.match(
                        /([^#|~]*)(?:(?:#|~)(?:\/){0,1}(.*)){0,1}/
                    );
                    try {
                        if (isUrl(src)) {
                            const [, content, res] = await cache(request, src);
                            const contentType = res.headers["content-type"];
                            data = /json/.test(contentType)
                                ? JSON.parse(content)
                                : /yaml/.test(contentType)
                                ? yamlLoad(content, src)
                                : content;
                        } else if (src) {
                            const childFile = await build.addFile(
                                build.resolveFromFile(file, src)
                            );

                            build.addChild(file, childFile);

                            const { root } = await childFile.data;

                            data = root;
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
    return root;
}