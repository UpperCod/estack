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

    let { link, category, lang, date, slug = file.meta.name } = data;

    const test = file.src.match(/(.+)\.(\w+)\.(md|html)$/);

    let parentLang;

    if (test) {
        const [, _parentLang, _lang, ext] = test;
        parentLang = normalizePath(_parentLang + "." + ext);
        lang = _lang;
        slug = slug.replace(/\.(\w+)$/, "");
    }

    if (!date) {
        try {
            const { birthtime } = await cache(stat, file.src);
            date = birthtime;
        } catch (e) {}
    }

    category = category ? [].concat(category) : [];
    // to avoid conflict by language extension the language folder
    // is created to avoid conflict by links
    if (lang && !link) {
        link = lang + (slug == "index" ? "" : "/" + slug);
    }

    link = link ?? slug;

    build.setLink(
        file,
        link + (/\/$/.test(link) || link == "/" ? "index.html" : ".html")
    );

    file.data = {
        ...data,
        parentLang,
        date,
        lang,
        id: getId(file.src),
        content: html,
        link: file.link,
        file: normalizePath(file.src),
        category,
    };
}
