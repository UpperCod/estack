import { Options, OptionsBuild, PluginsExternal } from "estack";
import * as path from "path";
import getProp from "@uppercod/get-prop";
import { readFile } from "./utils/fs";
import * as builtins from "builtin-modules";
import { normalizePath } from "./utils/utils";

const pkgDefault = {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    scripts: {},
};

const cssDefault = {};

export async function loadOptions({
    mode,
    src,
    dest,
    js,
    css,
    port,
    silent,
    href,
    assetsDir,
    assetHashPattern,
    sourcemap,
    watch,
}: Options) {
    const pkg = await getPackage();
    let assetsWithoutHash: RegExp;
    let server = false;

    href = href || "/";
    dest = dest || "";
    assetsDir = assetsDir || "assets";

    src = Array.isArray(src) ? src : src.split(/ *; */g);

    const site = useHtml(src);

    const destAssets = normalizePath(path.join(dest, assetsDir));

    if (site) {
        assetsWithoutHash = /\.(html)$/;
        assetsDir = assetsDir == null ? "assets" : assetsDir;
    } else {
        assetsDir = "";
        assetsWithoutHash = /\.(js|css)$/;
    }

    dest = dest || "public";

    if (mode == "dev") {
        sourcemap = true;
        assetHashPattern = assetHashPattern || "[hash]-[name]";
        server = site;
        watch = true;
    }

    if (mode == "build") {
        sourcemap = sourcemap || false;
        assetHashPattern = assetHashPattern || "[hash]";
    }

    const options: OptionsBuild = {
        mode,
        src,
        site,
        destAssets,
        sourcemap,
        external: [
            ...builtins,
            ...Object.keys(pkg.dependencies).filter(
                (prop) => pkg.peerDependencies[prop]
            ),
            ...Object.keys(pkg.peerDependencies),
        ],
        port: typeof port == "string" ? Number(port) : port,
        assetHashPattern,
        assetsWithoutHash,
        assetsDir,
        dest,
        href,
        watch,
        server,
        js: await loadPlugins(
            typeof js == "string" ? getProp(pkg, js, {}) : {}
        ),
        css: await loadPlugins(
            typeof css == "string" ? getProp(pkg, css, {}) : {}
        ),
        silent,
    };

    return options;
}

async function loadPlugins(plugins: PluginsExternal) {
    const task = [];
    for (let prop in plugins) {
        task.push(import(prop).then((plugin) => plugin(plugins[prop])));
    }
    return Promise.all(task);
}

async function getPackage() {
    try {
        return {
            ...pkgDefault,
            ...JSON.parse(await readFile("package.json")),
        };
    } catch (e) {
        return { ...pkgDefault };
    }
}

const testHtml = (value: string[]) =>
    ["html", "md"].some((ext) => value.includes(ext));

const useHtml = (src: string[]) =>
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
