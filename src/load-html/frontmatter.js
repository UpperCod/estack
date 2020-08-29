import { getFragments, replaceFragments } from "@uppercod/str-fragment";
import yaml from "js-yaml";

/**
 *
 * @param {string} code
 * @param {string} [filename]
 */
export const yamlLoad = (code, filename) => yaml.safeLoad(code, { filename });
/**
 * Extract the meta snippet header
 * @param {string} file
 * @param {string} code
 * @returns {[string,object]}
 */
export function frontmatter(file, code) {
    const [fragment] = getFragments(code, {
        open: /^---/m,
        end: /^---/m,
        equal: true,
    });
    if (fragment) {
        let strValue;
        const { open, end } = fragment;

        if (!open.indexOpen) {
            code = replaceFragments(code, [fragment], ({ content }) => {
                strValue = content;
                return "";
            });
        }
        const meta = yamlLoad(strValue, file);
        //@ts-ignore
        meta.__br = code.slice(0, end.indexEnd).split("\n").length;
        //@ts-ignore
        return [code, meta];
    }

    return [code, { __br: 0 }];
}

/**
 * @callback plugin
 * @param {any} value
 * @param {object|any[]} root
 * @param {string} file
 * @returns {Promise<{file?:string,value:any}>}
 */

/**
 * @typedef {{[index:string]:plugin}} plugins
 */
