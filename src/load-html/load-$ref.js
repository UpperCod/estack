import path from "path";
import getProp from "@uppercod/get-prop";
import { isUrl, isJson, isYaml } from "../utils/utils";
import { yamlLoad } from "./frontmatter";
/**
 *
 * @param {import("../create-build").build} build
 * @returns {import("@uppercod/map-object").Plugin}
 */
export const $ref = (build) => async (
    { file, value, root },
    { load, addChild }
) => {
    let data = root;
    const [, src, prop] = value.match(
        /([^#|~]*)(?:(?:#|~)(?:\/){0,1}(.*)){0,1}/
    );
    if (isUrl(src)) {
        const [, content, res] = await build.request(src);
        const contentType = res.headers["content-type"];
        data = /json/.test(contentType)
            ? JSON.parse(content)
            : /yaml/.test(contentType)
            ? yamlLoad(content, src)
            : content;
    } else if (src) {
        const { dir } = path.parse(file);
        const nextSrc = path.join(dir, src);
        const content = await build.readFile(nextSrc);
        data = isJson(nextSrc)
            ? JSON.parse(content)
            : isYaml(nextSrc)
            ? yamlLoad(content, nextSrc)
            : content;
        if (typeof data == "object") {
            data = await load({
                file: nextSrc,
                value: data,
            });
        } else {
            addChild(src);
        }
    }
    return prop ? getProp(data, prop) : data;
};
