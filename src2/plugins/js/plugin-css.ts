import { Plugin } from "rollup";
import * as postcss from "postcss";
import pluginImport, { Process, Imports } from "@uppercod/postcss-import";
import { Build } from "estack";

export function pluginCss(build: Build): Plugin {
    return {
        name: "plugin-css",

        async transform(code, file) {
            if (file.endsWith(".css")) {
                const imports: Imports = {};
                const result = await postcss([
                    pluginImport({ imports }),
                    ...build.options.css,
                ]).process(code, {
                    from: file,
                });
                if (build.hasFile(file)) {
                    for (const src in imports) {
                    }
                }
                return {
                    code: `export default ${JSON.stringify(result + "")};`,
                    map: { mappings: "" },
                };
            }
        },
    };
}
