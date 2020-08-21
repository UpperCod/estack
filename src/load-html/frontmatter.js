import { getFragments, replaceFragments } from "@uppercod/str-fragment";
import yamlParse from "@uppercod/yaml";

/**
 * Extract the meta snippet header
 * @param {string} code
 * @example
 * ---
 * name
 * ---
 * lorem...
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
