import path from "path";
import { loadHtml } from "./load-html/load-html";
import { loadCss } from "./load-css/load-css";
import {
    isHtml,
    isCss,
    asyncFs,
    isJs,
    isNotFixLink,
    copyFile,
} from "./utils/utils";
import { MARK_ROOT } from "./constants";
import { loadRollup } from "./load-rollup/load-rollup";

/**
 * @todo support aliases to reference a page
 */

/**
 * @param { Build.build } build
 * @param {string[]} files
 * @param { number } cycle
 * @param {boolean} [forceBuild]
 */
export async function loadBuild(build, files, cycle, forceBuild) {
    try {
        build.logger.mark(MARK_ROOT);

        files = files.map(path.normalize);

        let localResolveAsset = {};

        build.addRootAsset = (file) => {
            /**
             * to optimize the process, the promise that the file looks for is
             * cached, in order to reduce this process to only one execution between buils
             */
            async function resolve(file) {
                await asyncFs.stat(file);
                return build.getDestDataFile(file);
            }

            localResolveAsset[file] = localResolveAsset[file] || resolve(file);

            return localResolveAsset[file];
        };

        let htmlFiles = files.filter(isHtml).filter(build.preventNextLoad);

        if (htmlFiles.length) {
            await loadHtml(build, htmlFiles);
        }

        files = [...files, ...Object.keys(localResolveAsset)];

        let cssFiles = files.filter(isCss).filter(build.preventNextLoad);
        let jsFiles = files.filter(isJs).filter(build.preventNextLoad);

        let staticFiles = files
            .filter(isNotFixLink)
            .filter(build.preventNextLoad);

        jsFiles =
            jsFiles.length || forceBuild
                ? Object.keys(build.inputs).filter(isJs)
                : [];

        let resolveCss = cssFiles.length && loadCss(build, cssFiles);
        let resolveJs = jsFiles.length && loadRollup(build, jsFiles);

        await Promise.all([
            resolveCss,
            resolveJs,
            ...staticFiles.map(async (file) => {
                let { dest } = build.getDestDataFile(file);
                if (build.options.virtual) {
                    build.mountFile({ dest, stream: file });
                } else {
                    return copyFile(file, dest);
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

/**
 * @typeof {import("./internal") } Build
 */
