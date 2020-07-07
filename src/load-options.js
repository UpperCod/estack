import path from "path";
import builtins from "builtin-modules";
import { getPackage, normalizePath } from "./utils/utils";

/**
 * @typeof {import("./internal") } Build
 */

/**
 *
 * @param {import("./internal").options} options
 */
export async function loadOptions({
    src = [],
    dev,
    build,
    dest,
    config,
    external,
    jsx,
    jsxFragment,
    forceWrite,
    silent,
    href = "/",
    hashAllAssets,
    assetsDir = "",
    assetHashPattern = "[hash]-[name]",
    ...ignore
}) {
    let srcWithHtml = /(html|md)/.test(src + "");
    if (dev) {
        ignore.sourcemap = ignore.server = ignore.watch = true;
        if (srcWithHtml) {
            hashAllAssets = true;
            assetsDir = "assets";
        }
    }
    if (build) {
        if (srcWithHtml) {
            ignore.minify = true;
            hashAllAssets = true;
            assetsDir = "assets";
        }
    }

    if (silent) process.env.silent = "true";

    let pkg = await getPackage();

    src = Array.isArray(src) ? src : src.split(/ *; */g);

    if (external) {
        external = Array.isArray(external)
            ? external
            : [true, "true"].includes(external)
            ? Object.keys(pkg.dependencies)
            : external.split(/ *, */);
    }

    external = [
        ...builtins,
        ...(external || []),
        ...Object.keys(pkg.peerDependencies),
    ];

    let { dir, name } = path.parse(assetHashPattern);

    assetHashPattern = name;

    assetsDir = dir || assetsDir;

    let assetsWithoutHash = hashAllAssets ? /\.html$/ : /\.(html|js|css)$/;

    let options = {
        src,
        dest: dest || "./",
        external,
        ...ignore,
        ...pkg[config],
        pkg,
        href,
        assetsDir,
        assetHashPattern,
        assetsWithoutHash,
        virtual: !forceWrite && ignore.watch && ignore.server,
        jsx: jsx == "react" ? "React.createElement" : jsx,
        jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
    };

    // normalize routes for fast-glob
    options.src = options.src.map(normalizePath);

    return options;
}
