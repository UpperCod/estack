import * as path from "path";
import { normalizePath } from "./utils";
import { isHtml, isJs } from "./types";
import hash from "@uppercod/hash";
export var createDataDest = function (options) { return function (file) {
    var _a = path.parse(file), name = _a.name, ext = _a.ext, dir = _a.dir, base = _a.base;
    ext = isJs(ext) ? ".js" : isHtml(ext) ? ".html" : ext || ".html";
    var typeHtml = ext == ".html";
    var isIndex = typeHtml && name == "index";
    if (!options.assetsWithoutHash.test(ext)) {
        var data_1 = {
            hash: hash(file),
            name: name
        };
        name = options.assetHashPattern.replace(/\[([^\]]+)\]/g, function (all, prop) { return data_1[prop] || ""; });
        if (name.indexOf(data_1.hash) == -1) {
            name = data_1.hash + "-" + name;
        }
    }
    var destDir = typeHtml ? dir : options.assetsDir;
    var dest = normalizePath(path.join(options.dest, destDir, name + ext));
    var link = normalizePath(path.join(options.href, destDir, isIndex ? "./" : name + (typeHtml ? "" : ext)));
    return {
        base: name + ext,
        name: name,
        link: link,
        dest: dest,
        type: ext.replace(".", ""),
        raw: {
            base: base,
            file: normalizePath(file),
            dir: dir
        }
    };
}; };
//# sourceMappingURL=link.js.map