import * as path from "path";
import { normalizePath } from "./utils/utils";
import { isHtml, isJs } from "./utils/types";
import hash from "@uppercod/hash";
export const createDataDest = (options) => (file) => {
    let { name, ext, dir, base } = path.parse(file);
    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";
    const typeHtml = ext == ".html";
    const isIndex = typeHtml && name == "index";
    if (!options.assetsWithoutHash.test(ext)) {
        const data = {
            hash: hash(file),
            name,
        };
        name = options.assetHashPattern.replace(/\[([^\]]+)\]/g, (all, prop) => data[prop] || "");
        if (name.indexOf(data.hash) == -1) {
            name = data.hash + "-" + name;
        }
    }
    const destDir = typeHtml ? dir : options.assetsDir;
    const dest = normalizePath(path.join(options.dest, destDir, name + ext));
    const link = normalizePath(path.join(options.href, destDir, isIndex ? "./" : name + (typeHtml ? "" : ext)));
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
//# sourceMappingURL=link.js.map