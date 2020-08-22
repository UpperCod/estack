import { loadHtmlFiles } from "./load-html-files";
import { loadPages } from "./load-pages";

/**
 * @param {import("../create-build").build} build
 * @param {string[]} htmlFiles
 */
export async function loadHtml(build, htmlFiles) {
    await loadHtmlFiles(build, htmlFiles);
    await loadPages(build);
}
