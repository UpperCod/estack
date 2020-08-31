//@ts-ignore
import builtins from "builtin-modules";

import path from "path";
import { getPackage } from "./utils/utils";
import getProp from "@uppercod/get-prop";

/**
 *
 * @param {options} options
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
    assetHashPattern,
    server,
    sourcemap,
    minify,
    proxy,
    port,
    hashAllAssets,
    postcss,
}) {
    let watch;

    if (silent) process.env.silent = "true";
    const pkg = await getPackage();

    const { dependencies, devDependencies, peerDependencies } = pkg;

    src = Array.isArray(src) ? src : src.split(/ *; */g);

    const withHtml = useHtml(src);

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
            ? Object.keys(dependencies)
            : external.split(/ *, */);
    }

    external = [
        ...builtins,
        ...(external || []),
        ...Object.keys(peerDependencies),
    ];

    assetHashPattern =
        assetHashPattern || (mode == "dev" ? "[hash]-[name]" : "[hash]");

    const assetsWithoutHash = hashAllAssets ? /\.html$/ : /\.(html|js|css)$/;

    let postcssPlugins = [];

    const ts = "@rollup/plugin-typescript";
    const typescript = devDependencies[ts] || dependencies[ts];

    if (postcss) {
        if (typeof postcss == "string") {
            /**@type {Object<string,any>} */
            const plugins = getProp(pkg, postcss, {});
            postcssPlugins = await Promise.all(
                Object.keys(plugins).map(async (name) => {
                    const plugin = await import(name);
                    return plugins[name] ? plugin(plugins[name]) : plugin;
                })
            );
        }
    }

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
        postcss,
        postcssPlugins,
        virtual: !forceWrite && watch && server ? true : false,
        jsx: jsx == "react" ? "React.createElement" : jsx,
        jsxFragment: jsx == "react" ? "React.Fragment" : jsxFragment,
        typescript,
    };

    // normalize routes for fast-glob
    options.src = options.src.map((str) => str.replace(/[\\\/]+/g, "/"));

    return options;
}

/**
 *
 * @param {string[]} value
 */
const testHtml = (value) => ["html", "md"].some((ext) => value.includes(ext));

/**
 *
 * @param {string[]} src
 * @returns {boolean}
 */
const useHtml = (src) =>
    src.some((exp) =>
        /\!/.test(exp)
            ? false
            : [/{([^}]+)}$/, /\.(\w+)$/].some((regExp) => {
                  /**@type {string[]} */
                  const test = exp.match(regExp);
                  if (test) {
                      let [, value] = test;

                      return testHtml(value.split(/ *, */));
                  }
              })
    );

/**
 * @typedef {Object} options
 * @property {string | string[]} src
 * @property {object} [pkg]
 * @property {string} [dest]
 * @property {string} [mode]
 * @property {boolean} [watch]
 * @property {string[] | string} [external]
 * @property {string} [jsx]
 * @property {string} [jsxFragment]
 * @property {boolean} [forceWrite]
 * @property {boolean} [silent]
 * @property {boolean} [typescript]
 * @property {string} [href]
 * @property {string} [proxy]
 * @property {boolean|string} [server]
 * @property {boolean} [virtual]
 * @property {boolean} [sourcemap]
 * @property {boolean} [minify]
 * @property {boolean} [hashAllAssets]
 * @property {string} [assetDir]
 * @property {string} [assetHashPattern]
 * @property {RegExp} [assetsWithoutHash]
 * @property {string} [assetsDir]
 * @property {string} [postcss]
 * @property {any} [postcssPlugins]
 * @property {number} [port]
 */
