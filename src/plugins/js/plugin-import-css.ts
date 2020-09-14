import { Plugin } from "rollup";
import * as postcss from "postcss";
import pluginImport, { Imports, Process } from "@uppercod/postcss-import";
import { Build } from "estack";

export function pluginImportCss(build: Build): Plugin {
    let process: Process = {};
    return {
        name: "plugin-import-css",

        buildStart() {
            process = {};
        },
        async transform(code, id) {
            if (id.endsWith(".css")) {
                const imports: Imports = {};
                const result = await postcss([
                    pluginImport({ imports, process }),
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
    };
}
