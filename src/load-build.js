import path from "path";
import { loadHtml } from "./load-html/load-html";
import { isHtml, isCss, logger } from "./utils/utils";
import { MARK_ROOT } from "./constants";
export async function loadBuild(build, files, forceBuild) {
    files = files.map(path.normalize);

    function filter(data, filter) {
        let include = [];
        let explude = data.filter((value) => {
            if (filter(value)) {
                include.push(value);
            } else {
                return true;
            }
        });
        return [include.filter(build.prevenLoad), explude];
    }

    let [htmlFiles, nonHtmlFiles] = filter(files, isHtml);

    if (htmlFiles.length) {
        nonHtmlFiles = [...nonHtmlFiles, await loadHtml(build, htmlFiles)];
    }

    let [filesCss, nonCssFiles] = filter(nonHtmlFiles, isCss);

    filesCss.map(async (file) => {
        let css = await build.open(file);
        let code = await readCss({
            code: css,
            file,
            addWatchFile: (childFile) =>
                build.fileWatcher(childFile, file, true),
        });
        return build.mountFile({
            dest: build.getDest(getFileName(file)),
            code,
            type: "css",
        });
    });

    build.markBuild(MARK_ROOT);
    build.reload();
}
