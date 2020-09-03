import { Plugin, Files, File } from "@estack/core";
import { RenderData } from "./types";
import { loadFile } from "./load-page";
import { isHtml } from "../../types";
import { createEngine } from "./engine";

export function pluginHtml(): Plugin {
    return {
        name: "html",
        mounted() {
            this.render = createEngine();
        },
        filter: ({ src }) => isHtml(src),
        async load(currentFiles, { files, global }) {
            await Promise.all(currentFiles.map(loadFile));

            const templates: Files = {};
            const fragments: Files = {};
            const archives: Files = {};
            const pages: Files = {};

            for (const src in files) {
                if (!isHtml(src)) continue;
                const file = files[src];
                const { data } = file;
                if (data.archive) {
                    archives[src] = file;
                } else if (data.fragment) {
                    fragments[src] = file;
                } else if (data.template) {
                    templates[src] = file;
                } else {
                    if (pages[file.link]) {
                        file.addError(
                            `Duplicate links: ${pages[file.link].src}`
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
                    renderData.file.content = await this.render(
                        file.data.content,
                        renderData
                    );
                    return renderData;
                } catch (e) {
                    renderData.file.addError(e);
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
                        file.content = await this.render(
                            template.data.content,
                            renderData
                        );
                    } catch (e) {
                        renderData.file.addError(e);
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
