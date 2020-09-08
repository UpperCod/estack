import { Files, Query, PageData } from "estack";
import getProp from "@uppercod/get-prop";

const defSort = { date: -1 };
/**
 *
 * @param {Object[]} pages - collection of pages
 * @param {import("./load-html-files").query} query
 * @param {boolean} [onlyPages] - Avoid grouping by pages and return only the pages
 */
export function pageQuery(
    pages: Files,
    { find, sort = defSort, limit }: Query,
    onlyPages?: boolean
) {
    const keysFind = Object.keys(find);
    const [indexSort] = Object.keys(sort);
    const orderSort = sort[indexSort];

    /**
     * @type {any[]}
     */
    let collection: PageData[] = [];

    for (const link in pages) {
        const { data } = pages[link];
        if (
            keysFind.every((prop) =>
                [].concat(getProp(data, prop)).includes(find[prop])
            )
        ) {
            collection.push(data);
        }
    }

    collection.sort((a, b) =>
        getProp(a, indexSort) > getProp(b, indexSort)
            ? orderSort
            : orderSort * -1
    );
    if (onlyPages) {
        return limit ? collection.slice(0, limit) : collection;
    }

    if (!limit) return [collection];

    const pagination: PageData[][] = [];

    let data;
    let size = 0;
    let currentPaged = 0;

    while ((data = collection.shift())) {
        pagination[currentPaged] = pagination[currentPaged] || [];

        pagination[currentPaged].push(data);

        if (++size == limit) {
            size = 0;
            currentPaged++;
        }
    }
    return pagination;
}
