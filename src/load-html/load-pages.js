import path from "path";
import { isHtml, queryPages, normalizePath } from "../utils/utils";
import { renderHtml } from "./render-html";

import {
    ERROR_TRANSFORMING,
    FROM_LAYOUT,
    DATA_FRAGMENTS,
    DATA_LAYOUT,
    DATA_PAGE,
    MARK_ROOT,
    ERROR_DUPLICATE_ID,
    PAGE_ASSETS,
} from "../constants";

/**
 *
 * @param {Build.build} build
 */
export function loadPages(build) {
    //The templates files are virtual, these can be referred
    //by a file that declares layour for use of this
    let templates = {};

    let fragments = {};
    //The files are virtual and it allows to generate a query
    //on the pages in order to create page collections
    let archives = [];
    // stores the content of the pages already resolved

    let queries = new Map();

    let pages = {};

    let links = new Proxy(pages, {
        get(obj, prop) {
            if (obj[prop]) {
                return obj[prop].ref;
            }
        },
    });

    let pagesData = [];

    let addPage = (page) => {
        let { data } = page;
        let id = data.symlink || data.link;

        if (pages[id]) {
            build.logger.debug(
                `${ERROR_DUPLICATE_ID} identifiers [symlink] or [link] must be unique, ${pages[id].data.file} ${data.file}`,
                MARK_ROOT
            );
        } else {
            pages[id] = page;
            page.ref = {
                ...data,
                id,
                content: null,
            };
            pagesData.push(page.ref);
        }

        if (data.query) {
            let query = queries.get(data.query) || [];
            query.push(page.ref);
            queries.set(data.query, query);
        }
    };

    for (let file in build.inputs) {
        if (build.inputs[file] && isHtml(file)) {
            let page = build.inputs[file];
            let { data } = page;
            if (data.fragment) {
                fragments[data.fragment] = page;
            } else if (data.template) {
                templates[data.template] = page;
            } else if (data.archive) {
                archives.push(page);
            } else {
                addPage(page);
            }
        }
    }

    archives.forEach((page) => {
        resolveArchive(build, pagesData, page, addPage);
    });

    queries.forEach((pages, query) => {
        let results = {};
        for (let prop in query) {
            let value = query[prop];
            results[prop] = queryPages(pagesData, value, true);
        }
        pages.forEach((data) => (data.query = results));
    });

    /**
     * First resolve the pages independently,
     * this allows each page to interact with
     * its scope page before associating the
     * nested render on the layout
     */
    let pagesDataRender = pagesData.map(async (data) => {
        let { id, layout } = data;
        let _page = pages[id];

        let _layout = templates[layout == null ? "default" : layout];

        let pageData = {
            links,
            pkg: build.options.pkg,
            build: !build.options.watch,
            page: data, // for the html page is data, eg page.title
            layout: _layout && _layout.data,
            pages: pagesData,
            // The following properties can only be accessed
            // from the scope of the stack and are for internal use
            [DATA_FRAGMENTS]: fragments,
            [DATA_LAYOUT]: _layout,
            [DATA_PAGE]: _page,
            [PAGE_ASSETS]: {},
        };

        try {
            data.content = await renderHtml(_page.data.content, pageData);
            return pageData;
        } catch (e) {
            createErrorFromLiquid(build, data, e);
        }
    });

    return Promise.all(pagesDataRender).then((pages) =>
        Promise.all(
            /**
             * Write the files once all have generated render of their
             * individual content, this in order to create pages that
             * group the content of other pages already processed
             */
            pages.map(async (pageData) => {
                if (!pageData) return;

                let {
                    page,
                    layout,
                    [DATA_PAGE]: _page,
                    [DATA_LAYOUT]: _layout,
                } = pageData;

                let { content } = page;

                pageData[FROM_LAYOUT] = true;

                if (layout) {
                    /**
                     * If the layout used by the page has the singlePage configuration,
                     * it will only generate the page that this property of fine based on its name
                     * @example
                     * singlePage : index
                     */
                    if (layout.singlePage && layout.singlePage !== page.id) {
                        return;
                    }
                    try {
                        content = await renderHtml(layout.content, pageData);
                    } catch (e) {
                        createErrorFromLiquid(build, _layout.data, e);
                    }
                }
                if (content != null) {
                    return build.mountFile({
                        dest: _page.dest,
                        code: content,
                        type: "html",
                    });
                }
            })
        )
    );
}

function createErrorFromLiquid(build, data, e) {
    let test = e.message.match(/line:(\d+), +col:(\d+)/);
    let lines = [];
    if (test) {
        let [, line, col] = test;
        lines = ["", data["@br"] + Number(line), col];
    }

    build.logger.debug(
        `${ERROR_TRANSFORMING} ${data.file + lines.join(":")}`,
        MARK_ROOT
    );
}
/**
 *
 * @param {Build.build} build
 * @param {*} pages
 * @param {*} page
 * @param {*} addPage
 */
function resolveArchive(build, pages, page, addPage) {
    let { data } = page;
    // The pages grouped according to where.limit are obtained.
    let collection = queryPages(pages, data.archive);

    let length = collection.length;

    collection.forEach((pages, paged) => {
        // Create the pages manually, they are the configuration

        let file = paged == 0 ? data.link : path.join(data.link, paged + "");

        let { dest, link } =
            paged == 0
                ? { dest: page.dest, link: data.link }
                : build.getDestDataFile(file);

        let position = paged - 1;

        let prev = normalizePath(
            collection[position] && position > 0
                ? data.link + "/" + position
                : data.link
        );

        position = paged + 1;

        let next = normalizePath(
            collection[position] ? data.link + "/" + position : ""
        );

        // A new page is returned
        addPage({
            ...page,
            data: {
                ...data,
                symlink: paged == 0 && data.symlink,
                link,
                archive: {
                    paged,
                    pages,
                    next,
                    prev,
                    length,
                },
            },
            dest,
        });
    });
}
/**
 * @typeof {import("../internal") } Build
 */
