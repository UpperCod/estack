import getProp from "@uppercod/get-prop";
/**
 *
 * @param {Object[]} pages - collection of pages
 * @param {Object} options
 * @param {{[index:string]:any}} options.where - query to match
 * @param {number} [options.limit] - page limits per page
 * @param {string} [options.sort] - page limits per page
 * @param {1|-1} [options.order] - page order is ascending(1) or decent(-1)
 * @param {boolean} [onlyPages] - Avoid grouping by pages and return only the pages
 */
export function queryPages(
    pages,
    { where, sort = "date", limit, order = -1 },
    onlyPages
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

    if (onlyPages) {
        return limit ? pages.slice(0, limit) : pages;
    }

    if (limit == null) {
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
