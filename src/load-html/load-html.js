import { loadHtmlFiles } from "./load-html-files";
import { loadPages } from "./load-pages";

/**
 * @param {Build.build} build
 * @param {string[]} htmlFiles
 */
export async function loadHtml(build, htmlFiles) {
    let nextAssets = await loadHtmlFiles(build, htmlFiles);
    await loadPages(build);
    return nextAssets;
}

/**
 * @typeof {import("../internal") } Build
 */
