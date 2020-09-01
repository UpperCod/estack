import { File, PageData } from "@estack/core";
import { frontmatter } from "./frontmatter";
import createCache from "@uppercod/cache";
import { loadData } from "../data/load-data";
import { normalizePath } from "../../utils";

const cache = createCache();

export async function loadFile(rootFile: File): Promise<void> {
    const [html, metadata] = frontmatter(rootFile.src, await rootFile.read());
    const copyRootFile = { ...rootFile };

    copyRootFile.read = () => Promise.resolve(metadata);

    const data: PageData = await loadData(copyRootFile);

    let { link = "", folder = "", permalink, slug, content: _content } = data;

    /**@todo add markdown */
    const content = _content || html;

    const name = slug || rootFile.name;

    link = link || permalink;

    if (link) {
        rootFile.setLink(
            (link += /\/$/.test(link) || link == "/" ? "index.html" : ".html")
        );
    } else {
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
