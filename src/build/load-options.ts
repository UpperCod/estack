import { OptionsBuild, Options, PluginsExternal } from "estack/internal";
import getProp from "@uppercod/get-prop";
import { readFile } from "../utils/fs";
import * as builtins from "builtin-modules";

const pkgDefault = {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    scripts: {},
};

export async function loadOptions({
    mode,
    src,
    dest,
    js,
    css,
    port,
    href,
    sourcemap,
    watch,
}: OptionsBuild) {
    const pkg = await getPackage();

    let server = false;

    href = href || "/";
    dest = dest || "";

    const glob: string[] = Array.isArray(src) ? src : src.split(/ *; */g);

    const site = useHtml(glob);

    dest = dest || "public";

    if (mode == "dev") {
        sourcemap = true;
        server = site;
        watch = true;
    }

    if (mode == "build") {
        sourcemap = sourcemap || false;
    }

    const options: Options = {
        mode,
        glob,
        sourcemap,
        external: [
            ...builtins,
            ...Object.keys(pkg.dependencies).filter(
                (prop) => pkg.peerDependencies[prop]
            ),
            ...Object.keys(pkg.peerDependencies),
        ],
        port: typeof port == "string" ? Number(port) : port,
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
                  const test: string[] = exp.match(regExp);
                  if (test) {
                      let [, value] = test;
                      return testHtml(value.split(/ *, */));
                  }
              })
    );
