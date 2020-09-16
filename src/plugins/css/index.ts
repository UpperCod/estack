import { Plugin } from "estack";
import postcss from "postcss";
import pluginImport from "@uppercod/postcss-import";
import { isCss } from "../../utils/types";

export function pluginCss(): Plugin {
    return {
        name: "plugin-css",
        filter: ({ type }) => type == "css",
        beforeLoad() {
            this.cache = {};
        },
        async load(file, build) {
            try {
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
                        load: false,
                    });
                    build.addImporter(childFile, file);
                }

                file.content = result + "";
            } catch (e) {
                build.addError(file, e + "");
            }
        },
    };
}
