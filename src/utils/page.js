import { getProp, yamlParse } from "./general";
/**
 *
 * @param {Object[]} pages - collection of pages
 * @param {Object} options
 * @param {{[index:string]:any}} options.where - query to match
 * @param {number} [options.limit] - page limits per page
 * @param {1|-1} [options.order] - page order is ascending(1) or decent(-1)
 */
export function queryPages(
    pages,
    { where, sort = "date", limit, order = -1 },
    onlyPages,
    mapPage
) {
    let keys = Object.keys(where);
    let item;
    let size = 0;
    let currentPaged = 0;
    let collection = [];

    pages = pages
        .filter((page) =>
            keys.every((prop) =>
                [].concat(getProp(page, prop)).includes(where[prop])
            )
        )
        .sort((a, b) =>
            getProp(a, sort) > getProp(b, sort) ? order : order * -1
        );

    pages = mapPage ? pages.map(mapPage) : pages;

    if (limit == null) {
        if (onlyPages) {
            return pages;
        }

        collection[0] = pages;

        return collection;
    }

    while ((item = pages.shift())) {
        collection[currentPaged] = collection[currentPaged] || [];

        collection[currentPaged].push(item);

        if (++size == limit) {
            size = 0;
            currentPaged++;
        }
    }
    return collection;
}

/**
 * Extract the meta snippet header
 * @param {string} code
 * @example
 * ---
 * name
 * ---
 * lorem...
 */
export function getMetaPage(code) {
    let meta = {};
    let metaBlock = "---";
    let lineBreak = "\n";
    if (!code.indexOf(metaBlock)) {
        let data = [];
        let lines = code.slice(3).split(lineBreak);
        let body = [];
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].indexOf(metaBlock)) {
                body = lines.slice(i + 1);
                break;
            }
            data.push(lines[i]);
        }
        if (data.length) {
            meta = yamlParse(data.join(lineBreak));
        }
        code = body.join(lineBreak);
    }
    return [code, meta];
}
