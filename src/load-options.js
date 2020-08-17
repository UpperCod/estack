//@ts-ignore
import builtins from "builtin-modules";

import path from "path";
import { getPackage } from "./utils/utils";

/**
 *
 * @param {import("./internal").options} options
 */
export async function loadOptions({
    mode,
    src = [],
    dest,
    external,
    jsx,
    jsxFragment,
    forceWrite,
    silent,
    href = "/",
    assetsDir,
    assetHashPattern = "[hash]-[name]",
    server,
    sourcemap,
    minify,
    proxy,
    port,
    hashAllAssets,
}) {
    let watch;

    if (silent) process.env.silent = "true";
    let pkg = await getPackage();

    src = Array.isArray(src) ? src : src.split(/ *; */g);

    let testHtml = (value) => ["html", "md"].some((ext) => value.includes(ext));
    let withHtml = src.some((exp) =>
        /\!/.test(exp)
            ? false
            : [/{([^}]+)}$/, /\.(\w+)$/].some((regExp) => {
                  let test = exp.match(regExp);
                  if (test) {
                      let [, value] = test;

                      return testHtml(value.split(/ *, */));
                  }
              })
    );
    if (withHtml) {
        assetsDir = assetsDir == null ? "assets" : assetsDir;
        hashAllAssets = hashAllAssets == null ? true : hashAllAssets;
    } else {
        assetsDir = "";
    }

    if (mode == "dev") {
        server = withHtml || server;
        watch = true;
        sourcemap = true;
        dest = dest || "public";
    }
    if (mode == "build") {
        watch = false;
        sourcemap = sourcemap || false;
        minify = minify == null ? true : minify;
        dest = dest || "dest";
    }

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

    let { name } = path.parse(assetHashPattern);

    assetHashPattern = name;

    let assetsWithoutHash = hashAllAssets ? /\.html$/ : /\.(html|js|css)$/;

    let options = {
        src,
        dest: dest || "./",
        proxy,
        port,
        external,
        minify,
        sourcemap,
        pkg,
        href,
        assetsDir,
        assetHashPattern,
        assetsWithoutHash,
        watch,
        server,
        virtual: !forceWrite && watch && server ? true : false,
        jsx: jsx == "react" ? "React.createElement" : jsx,
        jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
    };

    // normalize routes for fast-glob
    options.src = options.src.map((str) => str.replace(/[\\\/]+/g, "/"));

    return options;
}
