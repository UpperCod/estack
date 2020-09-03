import { File } from "@estack/core";
import mapObject from "@uppercod/map-object";
import createCache from "@uppercod/cache";
import getProp from "@uppercod/get-prop";
import { request } from "@uppercod/request";
import { safeLoad } from "js-yaml";

import { isUrl } from "../../types";

const yamlLoad = (code: string, src: string) =>
    safeLoad(code, { filename: src });

const cache = createCache();

export async function loadData(rootFile: File) {
    const value = await rootFile.read();
    rootFile.dataAsync =
        rootFile.dataAsync ||
        mapObject(
            {
                file: rootFile.src,
                value: yamlLoad(value, rootFile.src),
            },
            {
                async $ref({ value, root }, { addChild, load }) {
                    let data = root;
                    const [, src, prop]: string[] = value.match(
                        /([^#|~]*)(?:(?:#|~)(?:\/){0,1}(.*)){0,1}/
                    );
                    if (isUrl(src)) {
                        const [, content, res] = await cache(request, src);
                        const contentType = res.headers["content-type"];
                        data = /json/.test(contentType)
                            ? JSON.parse(content)
                            : /yaml/.test(contentType)
                            ? yamlLoad(content, src)
                            : content;
                    } else if (src) {
                        const result = await rootFile.addChild(src);
                        const { root } = await result.dataAsync;
                        data = root;
                    }
                    return prop ? getProp(data, prop) : data;
                },
            }
        );
    const { root } = await rootFile.dataAsync;
    return root;
}
