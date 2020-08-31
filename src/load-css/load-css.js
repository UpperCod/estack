import { load } from "stylis-pack/load";
import { pluginImport } from "stylis-pack/plugin-import";
import { serialize, stringify } from "stylis";
import { loadPostcss } from "./load-postcss";
/**
 * Load css allows to process groups of Css files in parallel.
 * @param {import("../create-build").build} build
 * @param {string[]} cssFiles  - Get the content of a file
 */
export async function loadCss(build, cssFiles) {
    const parallel = {};
    await Promise.all(
        cssFiles.map(async (file) => {
            const css = await build.readFile(file);
            /**@param {import("@uppercod/imported").Tree} tree */
            const addChildren = (tree) => {
                for (const src in tree) {
                    if (src != file) {
                        build.addChildFile(file, src);
                    }
                }
            };
            if (build.options.postcss) {
                const result = await loadPostcss(
                    file,
                    css,
                    build.options.postcssPlugins
                );

                addChildren(result.tree.tree);

                return build.writeFile({
                    dest: build.getDest(file).dest,
                    code: result + "",
                    type: "css",
                });
            } else {
                const result = await load(
                    {
                        code: css,
                        file,
                    },
                    [pluginImport({})],
                    parallel
                );

                addChildren(result.tree.tree);

                return build.writeFile({
                    dest: build.getDest(file).dest,
                    code: serialize(result.css, stringify),
                    type: "css",
                });
            }
        })
    );
}
