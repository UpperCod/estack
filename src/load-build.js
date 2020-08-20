import path from "path";
import { loadHtml } from "./load-html/load-html";
import { loadCss } from "./load-css/load-css";
import { isHtml, isCss, asyncFs, isJs } from "./utils/utils";
import { MARK_ROOT } from "./constants";
import { loadRollup } from "./load-rollup/load-rollup";

/**
 * @todo support aliases to reference a page
 */

/**
 * @param {import("./internal").build } build
 * @param {string[]} files
 * @param { number } cycle
 * @param {boolean} [forceBuild]
 */
export async function loadBuild(build, files, cycle, forceBuild) {
    try {
        build.logger.mark(MARK_ROOT);

        files = files.map(path.normalize);

        files.forEach(build.addFile);

        const queueFiles = {};

        build.addFileToQueque = (file) => {
            /**
             * to optimize the process, the promise that the file looks for is
             * cached, in order to reduce this process to only one execution between buils
             */
            async function resolve(file) {
                await asyncFs.stat(file);
                return build.getDest(file);
            }

            queueFiles[file] = queueFiles[file] || resolve(file);

            return queueFiles[file];
        };

        const htmlFiles = files.filter(isHtml).filter(build.reserveFile);

        if (htmlFiles.length) {
            await loadHtml(build, htmlFiles);
        }

        files = [...files, ...Object.keys(queueFiles)];

        const cssFiles = files.filter(isCss).filter(build.reserveFile);

        let jsFiles = files.filter(isJs).filter(build.reserveFile);

        const copyFiles = files.filter(build.isAsset).filter(build.reserveFile);

        jsFiles =
            jsFiles.length || forceBuild
                ? build
                      .getFiles()
                      .filter(({ src }) => isJs(src))
                      .map(({ src }) => src)
                : [];

        const resolveCss = cssFiles.length && loadCss(build, cssFiles);
        const resolveJs = jsFiles.length && loadRollup(build, jsFiles);

        await Promise.all([
            resolveCss,
            resolveJs,
            ...copyFiles.map(async (file) => {
                let { dest } = build.getDest(file);
                if (build.options.virtual) {
                    build.writeFile({ dest, stream: file });
                } else {
                    return build.copyFile(file, dest);
                }
            }),
        ]);

        await build.logger.markBuild(MARK_ROOT);
    } catch (e) {
        await build.logger.markBuildError(cycle ? e : "", MARK_ROOT);
        if (!cycle) {
            console.error(e);
            process.exit();
        }
    }
}
