import { File, Build } from "estack";
import { PageData } from "./types";
import { frontmatter } from "./frontmatter";
import { loadData } from "../data/load-data";
import { normalizePath } from "../../utils/utils";
import { stat } from "fs/promises";
import getId from "@uppercod/hash";
import createCache from "@uppercod/cache";

const cache = createCache();

export async function loadFile(file: File, build: Build): Promise<void> {
    const [html, metadata] = frontmatter(file.src, await build.readFile(file));

    const copyFile = { ...file };

    delete copyFile.data;

    copyFile.content = metadata;

    const data: PageData = metadata ? await loadData(copyFile, build) : {};

    let { link, category, lang, date } = data;

    if (!date) {
        try {
            const { birthtime } = await cache(stat, file.src);
            date = birthtime;
        } catch (e) {}
    }

    category = category ? [].concat(category) : [];

    if (lang && !category.includes(lang)) {
        category.push(lang);
    }

    if (link) {
        build.setLink(
            file,
            link + (/\/$/.test(link) || link == "/" ? "index.html" : ".html")
        );
    }

    file.data = {
        ...data,
        date,
        id: getId(file.src),
        content: html,
        link: file.link,
        file: normalizePath(file.src),
        category,
    };
}
