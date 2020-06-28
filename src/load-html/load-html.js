import { loadHtmlFiles } from "./load-html-files";
import { loadPages } from "./load-pages";

/**
 *
 * @param {*} build
 * @param {*} htmlFiles
 */
export async function loadHtml(build, htmlFiles) {
    let nextAssets = await loadHtmlFiles(build, htmlFiles);
    await loadPages(build);
    return nextAssets;
}
