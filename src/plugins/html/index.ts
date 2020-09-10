import { Plugin } from "estack/internal";
//import { RenderData, RenderDataQuery } from "./types";
//import { loadFile } from "./load-page";
import { isHtml } from "../../utils/types";
//import { createEngine, Render } from "./engine";
//import { pageQuery } from "./query";

export function pluginHtml(): Plugin {
    //let render: Render;
    return {
        name: "html",
        mounted() {
            //render = createEngine();
        },
        filter: ({ src }) => isHtml(src),
        async load(file) {
            console.log(file);
            //await loadFile(file);
        },
        /*
        async afterLoad({ files, mode }) {
            const templates: Files = {};
            const fragments: Files = {};
            const archives: Files = {};
            const pages: Files = {};
            const global: FillData = {};
            const refQuery: Map<Query, PageData[] | PageData[][]> = new Map();

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
