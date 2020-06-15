import { getProp, yamlParse } from "./general";
/**
 *
 * @param {Object[]} pages - collection of pages
 * @param {Object} options
 * @param {{[index:string]:any}} options.where - query to match
 * @param {number} [options.limit] - page limits per page
 * @param {1|-1} [options.order] - page order is ascending(1) or decent(-1)
 * @param {string} options.folder - folder to return between pages
 */
export function queryPages(
  pages,
  { where, sort = "order", limit, order = -1, folder = "" }
) {
  let keys = Object.keys(where);
  pages = pages
    .filter((page) =>
      keys.every((prop) => [].concat(getProp(page, prop)).includes(where[prop]))
    )
    .sort((a, b) => (getProp(a, sort) > getProp(b, sort) ? order : order * -1));

  let item;
  let size = 0;
  let currentPaged = 0;
  let collection = {};
  /**
   * returns access to page as relative path for page pagination
   * @param {number} paged - page position
   * @param {number} value - previous or next page
   */
  let subLink = (paged, value) =>
    !!collection[value] &&
    (paged == 0 ? "./" : "../") + folder + (value == 0 ? "" : "/" + value);

  let createPaged = (paged) => ({
    pages: [],
    paged,
    ref: {},
    get prev() {
      return subLink(paged, paged - 1);
    },
    get next() {
      return subLink(paged, paged + 1);
    },
    get length() {
      return currentPaged;
    },
  });

  if (limit == null) {
    collection[0] = createPaged(0);
    collection[0].pages = pages;
    return collection;
  }

  while ((item = pages.shift())) {
    collection[currentPaged] =
      collection[currentPaged] || createPaged(currentPaged);
    collection[currentPaged].pages.push(item);
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
