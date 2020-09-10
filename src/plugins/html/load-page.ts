import { File, Build } from "estack";
import { PageData } from "./types";
import { frontmatter } from "./frontmatter";
import { loadData } from "../data/load-data";
import { normalizePath } from "../../utils/utils";
import getId from "@uppercod/hash";

export async function loadFile(file: File, build: Build): Promise<void> {
    const [html, metadata] = frontmatter(file.src, await build.readFile(file));

    const copyFile = { ...file };

    copyFile.data = null;

    copyFile.content = metadata;

    const data: PageData = metadata ? await loadData(copyFile, build) : {};

    let { link } = data;

    if (link) {
        build.setLink(
            file,
            link + (/\/$/.test(link) || link == "/" ? "index.html" : ".html")
        );
    }

    file.data = {
        ...data,
        id: getId(file.src),
        content: html,
        link: file.link,
        file: normalizePath(file.src),
    };
}
