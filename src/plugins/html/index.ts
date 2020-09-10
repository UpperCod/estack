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
                    category: categories,
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
    };
}
