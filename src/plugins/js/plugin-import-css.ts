import { Plugin } from "rollup";
import * as postcss from "postcss";
import pluginImport, { Imports } from "@uppercod/postcss-import";
import { Build } from "estack";

export const pluginImportCss = (build: Build): Plugin => ({
    name: "plugin-import-css",
    async transform(code, id) {
        if (id.endsWith(".css")) {
            const imports: Imports = {};
            const result = await postcss([
                pluginImport({ imports }),
                ...build.options.css,
            ]).process(code, {
                from: id,
            });
            if (build.hasFile(id)) {
                const file = build.getFile(id);
                await Promise.all(
                    Object.keys(imports).map(async (src) => {
                        const childFile = await build.addFile(src, {
                            load: false,
                            write: false,
                        });
                        build.addImporter(childFile, file);
                    })
                );
            }
            return {
                code: `export default ${JSON.stringify(result + "")};`,
                map: { mappings: "" },
            };
        }
    },
});
