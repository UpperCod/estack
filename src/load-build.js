import path from "path";
import { loadHtml } from "./load-html/load-html";
import { loadCss } from "./load-css/load-css";
import { isHtml, isCss, asyncFs, isJs } from "./utils/utils";
import { MARK_ROOT } from "./constants";

/**
 * @todo separar el logger del contexto para permitir multiples ejecuciones de loadBuild
 * @todo asociarLoadRollup
 * @todo permitir crear una instancia del plugins de css para que este acceda a la cache de archivos y no a readFIle
 * @todo dar soporte a alias para referenciar una pagina
 */

export async function loadBuild(build, files, forceBuild) {
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
            return build.getLink(build.getFileName(file));
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

    let resolveCss = cssFiles.length && loadCss(build, cssFiles);
    let resolveJs = null; //jsFiles && loadCss(build, cssFiles);

    await Promise.all([resolveCss, resolveJs]);

    build.logger.markBuild(MARK_ROOT);
}
