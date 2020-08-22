import { getFragments, replaceFragments } from "@uppercod/str-fragment";
import yamlParse from "@uppercod/yaml";

/**
 * Extract the meta snippet header
 * @param {string} file
 * @param {string} code
 * @param {plugins} plugins
 * @returns {Promise<[string,object]>}
 */
export async function frontmatter(file, code, plugins) {
    let meta = { __br: 0 };
    let [fragment] = getFragments(code, {
        open: /^---/m,
        end: /^---/m,
        equal: true,
    });
    if (fragment) {
        let yaml;
        let { open, end } = fragment;
        if (!open.indexOpen) {
            code = replaceFragments(code, [fragment], ({ content }) => {
                yaml = content;
                return "";
            });
        }
        meta = await yamlParse(
            {
                file,
                code: yaml,
            },
            plugins
        );
        meta.__br = code.slice(0, end.indexEnd).split("\n").length;
    }

    return [code, meta];
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
