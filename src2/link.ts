import * as path from "path";
import { normalizePath } from "./utils";
import { isHtml, isJs } from "./types";
import hash from "@uppercod/hash";

interface Options {
    assetHashPattern: string;
    assetsWithoutHash: RegExp;
    assetsDir: string;
    dest: string;
    href: string;
}

interface DataHashPattern {
    hash: string;
    name: string;
}

export const createDataDest = (options: Options) => (file: string) => {
    let { name, ext, dir, base } = path.parse(file);

    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";

    const typeHtml = ext == ".html";

    const isIndex = typeHtml && name == "index";

    if (!options.assetsWithoutHash.test(ext)) {
        const data: DataHashPattern = {
            hash: hash(file),
            name,
        };

        name = options.assetHashPattern.replace(
            /\[([^\]]+)\]/g,
            (all, prop: keyof DataHashPattern) => data[prop] || ""
        );

        if (name.indexOf(data.hash) == -1) {
            name = data.hash + "-" + name;
        }
    }

    const destDir = typeHtml ? dir : options.assetsDir;

    const dest = normalizePath(path.join(options.dest, destDir, name + ext));

    const link = normalizePath(
        path.join(
            options.href,
            destDir,
            isIndex ? "./" : name + (typeHtml ? "" : ext)
        )
    );

    return {
        base: name + ext,
        name,
        link,
        dest,
        type: ext.replace(".", ""),
        raw: {
            base,
            file: normalizePath(file),
            dir,
        },
    };
};
