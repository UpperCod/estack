import { Plugin } from "rollup";
import { Build } from "estack";

export function pluginImportCss(build: Build): Plugin {
    return {
        name: "plugin-import-css",
        async transform(code, id) {
            if (id.endsWith(".css")) {
                try {
                    const file = build.addFile(id, {
                        write: false,
                        content: code,
                    });

                    await build.load(file);

                    return {
                        code: `export default ${JSON.stringify(file.content)};`,
                        map: { mappings: "" },
                    };

                    // const result = await postcss([
                    //     pluginImport({ imports, process }),
                    //     ...build.options.css.plugins,
                    // ]).process(code, {
                    //     from: id,
                    // });

                    // if (build.hasFile(id)) {
                    //     const file = build.getFile(id);
                    //     await Promise.all(
                    //         Object.keys(imports).map(async (src) => {
                    //             const childFile = build.addFile(src, {
                    //                 load: false,
                    //                 write: false,
                    //             });
                    //             build.addImporter(childFile, file);
                    //         })
                    //     );
                    // }
                    // return {
                    //     code: `export default ${JSON.stringify(result + "")};`,
                    //     map: { mappings: "" },
                    // };
                } catch (e) {
                    this.error(e);
                }
            }
        },
    };
}
