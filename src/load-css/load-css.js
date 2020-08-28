import { load } from "stylis-pack/load";
import { pluginImport } from "stylis-pack/plugin-import";
import { serialize, stringify } from "stylis";
/**
 * Load css allows to process groups of Css files in parallel.
 * @param {import("../create-build").build} build
 * @param {string[]} cssFiles  - Get the content of a file
 */
export async function loadCss(build, cssFiles) {
    const parallel = {};
    await Promise.all(
        cssFiles.map(async (file) => {
            let code = await load(
                {
                    code: await build.readFile(file),
                    file,
                },
                [pluginImport()],
                parallel
            );

            for (const src in code.tree.tree) {
                if (src != file) {
                    build.addChildFile(file, src);
                }
            }

            code = serialize(code.css, stringify);

            return build.writeFile({
                dest: build.getDest(file).dest,
                code,
                type: "css",
            });
        })
    );
}
