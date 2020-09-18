import { Plugin } from "estack";
import { Replace, RenderData, Categories, Page, Pages } from "./types";
import { loadFile } from "./load-page";
import { isMd } from "../../utils/types";
import { createEngine, Engine } from "./engine";
import { escapeBlockCodeMarkdown, markdown } from "./markdown";

export function pluginHtml(): Plugin {
    const replace: Replace = {};
    let engine: Engine;
    const replaceMark = (content: string) =>
        content.replace(/<!--([\w-]+)-->/g, (all, id) => replace[id] ?? all);
    return {
        name: "html",
        mounted(build) {
            engine = createEngine(build);
        },
        filter: ({ type }) => type == "html",
        async load(file, build) {
            try {
                if (isMd(file.src)) {
                    file.content = escapeBlockCodeMarkdown(
                        replace,
                        await build.readFile(file)
                    );
                }
                await loadFile(file, build);
            } catch (e) {
                build.addError(file, e + "");
            }
        },
        async afterLoad(build) {
            if (!this.loads) return;
            const templates: Pages = {};
            const fragments: Pages = {};
            const categories: Categories = {};
            const pages: Pages = {};
            for (const src in build.files) {
                const file = build.files[src] as Page;
                if (file.type != "html" || file.errors.length) continue;
                const { data } = file;

                if (data.template) {
                    templates[data.template] = file;
                } else if (data.fragment) {
                    fragments[data.fragment] = file;
                } else {
                    data.category.forEach((category) => {
                        categories[category] = categories[category] || [];
                        if (!categories[category].includes(data)) {
                            categories[category].push(data);
                        }
                    });

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
                    site: build.options.site,
                    page: data,
                    category: categories,
                    content: data.content,
                    layout: filelayout ? filelayout.data : null,
                };
                try {
                    let content = await engine.render(data.content, renderData);

                    content = replaceMark(content);

                    content = isMd(file.src) ? markdown(content) : content;

                    if (filelayout) {
                        const { data: dataLayout } = filelayout;
                        renderData.file = filelayout;
                        renderData.content = content;

                        content = await engine.render(
                            dataLayout.content,
                            renderData
                        );

                        content = replaceMark(content);

                        content = isMd(filelayout.src)
                            ? markdown(content)
                            : content;
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
