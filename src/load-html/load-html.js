import { loadFiles } from "./load-files";
import { loadPages } from "./load-pages";

export async function loadHtml(build, htmlFiles) {
    let nextAssets = await loadFiles(build, htmlFiles);
    await loadPages(build);
    return nextAssets;
}
