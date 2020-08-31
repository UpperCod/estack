import getProp from "@uppercod/get-prop";

const defSort = { date: -1 };
/**
 *
 * @param {Object[]} pages - collection of pages
 * @param {import("./load-html-files").query} query
 * @param {boolean} [onlyPages] - Avoid grouping by pages and return only the pages
 */
export function queryPages(pages, { find, sort = defSort, limit }, onlyPages) {
    const keysFind = Object.keys(find);
    const [indexSort] = Object.keys(sort);
    const orderSort = sort[indexSort];
    let item;
    let size = 0;
    let currentPaged = 0;
    let collection = [];

    pages = pages
        .filter((page) =>
            keysFind.every((prop) =>
                [].concat(getProp(page, prop)).includes(find[prop])
            )
        )
        .sort((a, b) =>
            getProp(a, indexSort) > getProp(b, indexSort)
                ? orderSort
                : orderSort * -1
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
