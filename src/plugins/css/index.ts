import { Plugin } from "estack";
import postcss from "postcss";
import { pluginImport } from "@uppercod/postcss-import";
import csso from "csso";

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
                const fileNameMap = file.base + ".map";

                const result = await postcss([
                    pluginImport({
                        imports,
                        process: this.cache,
                    }),
                    ...build.options.css.plugins,
                ]).process(await build.readFile(file), {
                    from: file.src,
                    map: build.options.sourcemap
                        ? {
                              inline: false,
                              annotation: fileNameMap,
                          }
                        : false,
                });

                for (const src in imports) {
                    const childFile = build.addFile(src, {
                        write: false,
                        load: false,
                    });
                    build.addImporter(childFile, file);
                }

                if (result.map) {
                    const fileMap = build.addFile(fileNameMap, {
                        watch: false,
                        load: false,
                        asset: file.asset,
                    });
                    fileMap.content = JSON.stringify(result.map);
                }

                let { css } = result;

                if (!build.options.sourcemap && build.options.mode == "build") {
                    css = csso.minify(css).css;
                }

                file.content = css;
            } catch (e) {
                build.addError(file, e + "");
            }
        },
    };
}
