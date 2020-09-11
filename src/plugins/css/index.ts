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
        async load(file, build) {
            const imports = {};

            const result = await postcss([
                pluginImport({ imports, process: this.cache }),
                ...build.options.css,
            ]).process(await build.readFile(file), {
                from: file.src,
            });

            for (const src in imports) {
                const childFile = await build.addFile(src, {
                    write: false,
                    assigned: true,
                });
                build.addImporter(childFile, file);
            }

            file.content = result + "";
        },
    };
}
