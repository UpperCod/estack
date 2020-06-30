import path from "path";
import builtins from "builtin-modules";
import { getPackage, normalizePath } from "./utils/utils";

/**
 * @typeof {import("./internal") } Build
 */

/**
 *
 * @param {Build.options} options
 */
export async function loadOptions({
    src = [],
    dest,
    config,
    external,
    jsx,
    jsxFragment,
    forceWrite,
    silent,
    href = "/",
    hashAllAssets,
    assetsDir = "assets",
    assetHashPattern = "[hash]-[name]",
    ...ignore
}) {
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
