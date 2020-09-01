import { Plugin, Files } from "@estack/core";
import { loadFile } from "./load-page";
import { isHtml } from "../../types";

export function pluginHtml(): Plugin {
    return {
        name: "plugin-html",
        filter: ({ src }) => isHtml(src),
        async load(currentFiles, files) {
            await Promise.all(currentFiles.map(loadFile));

            const templates: Files = {};
            const fragments: Files = {};
            const archives: Files = {};

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
                }
            }
        },
    };
}
