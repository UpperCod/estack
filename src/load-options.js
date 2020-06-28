import builtins from "builtin-modules";
import { getPackage, normalizePath } from "./utils/utils";

export async function loadOptions({
    src = [],
    config,
    external,
    jsx,
    jsxFragment,
    runAfterBuild,
    forceWrite,
    silent,
    href = "/",
    ...ignore
}) {
    if (silent) process.env.silent = true;

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

    let options = {
        src,
        external,
        ...ignore,
        ...pkg[config],
        pkg,
        href,
        virtual: !forceWrite && ignore.watch && ignore.server,
        runAfterBuild: pkg.scripts[runAfterBuild] ? runAfterBuild : "",
        jsx: jsx == "react" ? "React.createElement" : jsx,
        jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
    };

    // normalize routes for fast-glob
    options.src = options.src.map(normalizePath);

    return options;
}
