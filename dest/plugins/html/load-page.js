import { frontmatter } from "./frontmatter";
import { loadData } from "../data/load-data";
import { normalizePath } from "../../utils/utils";
export async function loadFile(rootFile) {
    const [html, metadata] = frontmatter(rootFile.src, await rootFile.read());
    const copyRootFile = { ...rootFile };
    copyRootFile.read = () => Promise.resolve(metadata);
    const data = metadata ? {} : await loadData(copyRootFile);
    let { link = "", folder = "", permalink, slug, content: _content } = data;
    const content = _content || html;
    const name = slug || rootFile.name;
    link = link || permalink;
    if (link) {
        rootFile.setLink((link += /\/$/.test(link) || link == "/" ? "index.html" : ".html"));
    }
    else {
        rootFile.setLink(folder, name + ".html");
    }
    rootFile.data = {
        ...data,
        content,
        link: rootFile.link,
        slug: normalizePath(name),
        file: normalizePath(rootFile.src),
    };
}
//# sourceMappingURL=load-page.js.map