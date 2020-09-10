import { Plugin, Files, File } from "estack";
import {
    PageData,
    RenderData,
    Globals,
    Categories,
    Page,
    Pages,
} from "./types";
import { loadFile } from "./load-page";
import { isHtml } from "../../utils/types";
import { createEngine, Engine } from "./engine";

export function pluginHtml(): Plugin {
    let engine: Engine;
    return {
        name: "html",
        mounted(build) {
            engine = createEngine(build);
        },
        filter: ({ src }) => isHtml(src),
        async load(file, build) {
            await loadFile(file, build);
        },
        async afterLoad(build) {
            const templates: Pages = {};
            const fragments: Pages = {};
            const categories: Categories = {};
            const pages: Pages = {};
            const globals: Globals = {};

            for (const src in build.files) {
                const file = build.files[src] as Page;
                if (file.type != "html") continue;
                const { data } = file;
                if (data.global) {
                    globals[data.global] = data;
                }
                if (data.template) {
                    templates[data.template] = file;
                } else if (data.fragment) {
                    fragments[data.fragment] = file;
                } else {
                    if (data.category) {
                        data.category.forEach((category) => {
                            categories[category] = categories[category] || [];
                            if (!categories[category].includes(data)) {
                                categories[category].push(data);
                            }
                        });
                    }
                    pages[file.link] = file;
                }
            }

            engine.fragments = fragments;

            const task = [];

            const render = async (file: Page) => {
                const { data } = file;
                const { layout = "default" } = data;
                const filelayout = templates[layout];
                const renderData: RenderData = {
                    file,
                    page: data,
                    categories,
                    layout: filelayout ? filelayout.data : null,
                };
                try {
                    let content = await engine.render(data.content, renderData);
                    if (filelayout) {
                        const { data: dataLayout } = filelayout;
                        renderData.file = filelayout;
                        content = await engine.render(
                            dataLayout.content,
                            renderData
                        );
                    }
                    file.content = content;
                } catch (e) {
                    build.addError(renderData.file, e + "");
                }
            };

            for (const link in pages) task.push(render(pages[link]));

            await Promise.all(task);
        },
        /*

            for (const src in files) {
                if (!isHtml(src)) continue;
                const file = files[src];
                const { data } = file as { data: PageData };
                if (data.global) {
                    if (global[data.global]) {
                        file.addAlert(`Duplicate global: ${data.global}`);
                    }
                    global[data.global] = data;
                }
                if (data.query) {
                    for (const prop in data.query) {
                        //The queries are built using the object of this as a reference and later
                        //retrieve the query from renderPage
                        refQuery.set(data.query[prop], []);
                    }
                }
                if (data.draft && mode == "build") {
                    file.write = false;
                } else if (data.archive) {
                    archives[src] = file;
                } else if (data.fragment) {
                    fragments[src] = file;
                } else if (data.template) {
                    templates[data.template] = file;
                    file.write = false;
                } else {
                    if (pages[file.link]) {
                        file.addError(
                            `Duplicate link: "${data.link}" in ${
                                pages[file.link].src
                            }`
                        );
                        continue;
                    }
                    pages[file.link] = file;
                }
            }

            const task = [];

            const renderPage = async (file: File) => {
                const {
                    data: { content, query, ...page },
                } = file;

                const dataQuery: RenderDataQuery = {};

                if (query) {
                    for (const prop in query) {
                        dataQuery[prop] = refQuery.get(query[prop]);
                    }
                }

                const renderData: RenderData = {
                    file,
                    global,
                    page,
                    query: dataQuery,
                };
                try {
                    renderData.file.content = await render(content, renderData);
                    return renderData;
                } catch (e) {
                    renderData.file.addError(e + "");
                }
            };

            const renderTemplate = async (renderData: RenderData) => {
                if (!renderData) return;

                const { page, file } = renderData;
                const { layout = "default" } = page;
                const template = templates[layout];

                if (template) {
                    renderData.layout = template.data;
                    renderData.page = { ...page, content: file.content };
                    try {
                        file.content = await render(
                            template.data.content,
                            renderData
                        );
                    } catch (e) {
                        template.addError(e + "");
                    }
                }
            };

            for (const [query] of refQuery) {
                refQuery.set(query, pageQuery(pages, query, true));
            }

            for (const link in pages) {
                task.push(renderPage(pages[link]));
            }

            await Promise.all(task).then((pages) =>
                Promise.all(pages.map(renderTemplate))
            );
        },
        */
    };
}
