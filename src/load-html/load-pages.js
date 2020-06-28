import { isHtml, queryPages } from "../utils/utils";
import { renderHtml } from "./render-html";

import {
    ERROR_TRANSFORMING,
    FROM_LAYOUT,
    DATA_FRAGMENTS,
    DATA_LAYOUT,
    DATA_PAGE,
    MARK_ROOT,
} from "../constants";

export function loadPages(build) {
    //The templates files are virtual, these can be referred
    //by a file that declares layour for use of this
    let templates = {};

    let fragments = {};
    //The files are virtual and it allows to generate a query
    //on the pages in order to create page collections
    let archives = [];
    // stores the content of the pages already resolved
    let resolvedPages = {};

    // The following processes separate the files according to their use
    let pages = Object.keys(build.inputs)
        .filter(isHtml)
        .map((file) => {
            let page = build.inputs[file];
            let { data } = page;
            if (data.fragment) {
                fragments[data.fragment] = data;
                return;
            } else if (data.template) {
                templates[data.template] = page;
                return;
            } else if (data.archive) {
                archives.push(page);
                return;
            }
            return page;
        })
        .filter((value) => value);

    let pagesData = pages.map(({ data }) => ({
        ...data,
        get content() {
            return resolvedPages[data.file];
        },
    }));

    pages = [
        ...pages,
        ...archives
            .map((page) => {
                let { data } = page;
                // The pages grouped according to where.limit are obtained.
                let collection = queryPages(pagesData, data.archive);

                let folderLink = data.link.replace(build.options.href, "/");

                let length = collection.length;

                return collection.map((pages, paged) => {
                    // Create the pages manually, they are the configuration
                    let name = paged ? "/" + paged : "";

                    let fileName = paged ? folderLink + name : folderLink;

                    let dest = build.getDest(fileName + ".html");

                    let link = build.getLink(fileName);

                    let position = paged - 1;

                    let prev = collection[position]
                        ? folderLink + (position ? "/" + position : "")
                        : "";

                    position = paged + 1;

                    let next = collection[position]
                        ? folderLink + (position ? "/" + position : "")
                        : "";

                    // A new page is returned
                    return {
                        ...page,
                        data: {
                            ...data,
                            link,
                            archive: {
                                paged,
                                pages,
                                next,
                                prev,
                                length,
                            },
                        },
                        name: fileName,
                        dest,
                    };
                });
            })
            .flat(),
    ];

    /**
     * First resolve the pages independently,
     * this allows each page to interact with
     * its scope page before associating the
     * nested render on the layout
     */
    pages = pages.map(async (page) => {
        let { data } = page;
        let { query, content } = data;
        let layout = templates[data.layout == null ? "default" : data.layout];

        if (query) {
            query = Object.keys(query)
                .map((prop) => ({
                    prop,
                    value: queryPages(pagesData, query[prop], true),
                }))
                .reduce(mapPropToObject, {});
        }

        let pageData = {
            pkg: build.options.pkg,
            build: !build.options.watch,
            page: { ...data, query },
            layout: layout && layout.data,
            pages: pagesData,
            // The following properties can only be accessed
            // from the scope of the stack and are for internal use
            [DATA_FRAGMENTS]: fragments,
            [DATA_LAYOUT]: layout,
            [DATA_PAGE]: page,
        };

        try {
            content = resolvedPages[data.file] = await renderHtml(
                content,
                pageData
            );
            pageData.page.content = content;
            return pageData;
        } catch (e) {
            build.logger.debug(
                `${ERROR_TRANSFORMING} : ${data.file}`,
                MARK_ROOT
            );
        }
    });

    return Promise.all(pages).then((pages) =>
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
                    if (layout.singlePage && layout.singlePage !== data.link) {
                        return;
                    }
                    try {
                        content = await renderHtml(layout.content, pageData);
                    } catch (e) {
                        build.logger.debug(
                            `${ERROR_TRANSFORMING} : ${_layout.data.file}`,
                            MARK_ROOT
                        );
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
