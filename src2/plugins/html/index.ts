import { Plugin, Files, File, FillData, PageData } from "estack";
import { RenderData } from "./types";
import { loadFile } from "./load-page";
import { isHtml } from "../../utils/types";
import { createEngine, Render } from "./engine";

export function pluginHtml(): Plugin {
    let render: Render;
    return {
        name: "html",
        mounted() {
            render = createEngine();
        },
        filter: ({ src }) => isHtml(src),
        async load(file) {
            await loadFile(file);
        },
        async afterLoad({ files, mode }) {
            const templates: Files = {};
            const fragments: Files = {};
            const archives: Files = {};
            const pages: Files = {};
            const global: FillData = {};

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
                const renderData: RenderData = {
                    file,
                    global,
                    page: file.data,
                };
                try {
                    renderData.file.content = await render(
                        file.data.content,
                        renderData
                    );
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

            for (const link in pages) {
                task.push(renderPage(pages[link]));
            }

            await Promise.all(task).then((pages) =>
                Promise.all(pages.map(renderTemplate))
            );
        },
    };
}
