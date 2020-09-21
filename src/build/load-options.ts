import {
    Options,
    OptionsBuild,
    TypesExtensions,
    PluginsExternal,
    PluginsExternalBuild,
} from "estack";
import getProp from "@uppercod/get-prop";
import { readFile } from "../utils/fs";
import builtins from "builtin-modules";

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
    external,
}: OptionsBuild) {
    const pkg = await getPackage();

    let server = false;

    href = href || "/";
    dest = dest || "";

    const glob: string[] = Array.isArray(src) ? src : src.split(/ *; */g);

    const witHtml = useHtml(glob);

    dest = dest || "public";

    if (mode == "dev") {
        sourcemap = true;
        server = witHtml;
        watch = true;
    }

    if (mode == "build") {
        sourcemap = sourcemap ?? false;
    }

    const types: TypesExtensions = {
        md: "html",
    };

    const jsConfig = await loadConfig({
        defExtensions: ["js", "jsx", "ts", "tsx"],
        plugins: {},
        ...getProp(pkg, js || ""),
    });

    jsConfig.extensions.forEach((type) => (types[type] = "js"));

    const cssConfig = await loadConfig({
        defExtensions: ["css"],
        plugins: {},
        ...getProp(pkg, css || ""),
    });

    cssConfig.extensions.forEach((type) => (types[type] = "css"));

    const assets = "assets/";

    const addExternal: string[] =
        typeof external == "string"
            ? external.split(/ *, */).map((str) => str.trim())
            : external;

    const nextExternal = witHtml
        ? []
        : addExternal.length
        ? addExternal
        : Object.keys(pkg.dependencies);

    const options: Options = {
        site: {
            href: href,
            assets,
        },
        mode,
        glob,
        sourcemap,
        external: [
            ...builtins,
            ...nextExternal,
            ...Object.keys(pkg.peerDependencies),
        ],
        port,
        dest,
        href,
        watch,
        server,
        assets,
        js: jsConfig,
        css: cssConfig,
        types,
    };

    return options;
}

async function loadConfig({
    plugins,
    defExtensions,
    extensions = [],
}: PluginsExternal): Promise<PluginsExternalBuild> {
    const task = [];
    for (let prop in plugins) {
        task.push(import(prop).then((plugin) => plugin(plugins[prop])));
    }
    return {
        extensions: [
            ...defExtensions,
            ...extensions.filter((type) => !defExtensions.includes(type)),
        ],
        plugins: await Promise.all(task),
    };
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
