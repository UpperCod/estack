import { loadCssFile } from "./load-css-file";

/**
 * Load css allows to process groups of Css files in parallel.
 * @param {import("../create-build").build} build
 * @param {string[]} cssFiles  - Get the content of a file
 */
export async function loadCss(build, cssFiles) {
    cssFiles.map(async (file) => {
        let code = await loadCssFile({
            code: await build.readFile(file),
            file,
            readFile: build.readFile,
            request: build.request,
            addChildFile: (childFile) => build.addChildFile(file, childFile),
        });

        return build.writeFile({
            dest: build.getDest(file).dest,
            //@ts-ignore
            code,
            type: "css",
        });
    });
}
