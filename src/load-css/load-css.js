import { loadCssFile } from "./load-css-file";

/**
 * Load css allows to process groups of Css files in parallel.
 * @param {Build.build} build
 * @param {string[]} cssFiles  - Get the content of a file
 */
export async function loadCss(build, cssFiles) {
    cssFiles.map(async (file) => {
        let code = await loadCssFile({
            code: await build.readFile(file),
            file,
            readFile: build.readFile,
            addWatchFile: (childFile) =>
                build.fileWatcher(childFile, file, true),
        });

        return build.mountFile({
            dest: build.getDest(build.getFileName(file)),
            code,
            type: "css",
        });
    });
}

/**
 * @typeof {import("../internal") } Build
 */
