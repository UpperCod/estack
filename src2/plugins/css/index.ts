import { Plugin } from "estack";
import * as postcss from "postcss";
import pluginImport from "@uppercod/postcss-import";
import { isCss } from "../../utils/types";

export function pluginCss(): Plugin {
    return {
        name: "plugin-css",
        filter: ({ src }) => isCss(src),
        beforeLoad() {
            this.cache = {};
        },
        async load(file) {
            const imports = {};

            const result = await postcss([
                pluginImport({ imports, process: this.cache }),
            ]).process(await file.read(), {
                from: file.src,
            });

            for (const src in imports) {
                file.addChild(src, {
                    write: false,
                    join: false,
                    assigned: true,
                });
            }

            file.content = result + "";
        },
    };
}
