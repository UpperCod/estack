import { loadCssFile } from "./load-css-file";

/**
 * Load css allows to process groups of Css files in parallel.
 * @param {import("../internal").build} build
 * @param {string[]} cssFiles  - Get the content of a file
 */
export async function loadCss(build, cssFiles) {
    cssFiles.map(async (file) => {
        let code = await loadCssFile({
            code: await build.readFile(file),
            file,
            readFile: build.readFile,
            request: build.request,
            addWatchFile: (childFile) =>
                build.fileWatcher(childFile, file, true),
        });

        return build.mountFile({
            dest: build.getDestDataFile(file).dest,
            code,
            type: "css",
        });
    });
}
