import { loadCssFile } from "./load-css-file";
/**
 * Load css allows to process groups of Css files in parallel.
 * @param {object} build
 * @param {()=>Promise<string>} build.readFile - Get the content of a file
 * @param {string[]} css - files to process with stylis
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
