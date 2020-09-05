import { readFile } from "./utils/fs";
import * as builtins from "builtin-modules";
const pkgDefault = {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    scripts: {},
};
export async function loadOptions({ mode, src, dest, external, jsx, jsxFragment, port, silent, assetsDir, assetHashPattern, assetsWithoutHash, sourcemap, }) {
    const pkg = await getPackage();
    src = Array.isArray(src) ? src : src.split(/ *; */g);
    const withHtml = useHtml(src);
    if (withHtml) {
        assetsDir = assetsDir == null ? "assets" : assetsDir;
    }
    else {
        assetsDir = "";
    }
    dest = dest || "public";
    if (mode == "dev") {
        sourcemap = true;
    }
    if (mode == "build") {
        sourcemap = sourcemap || false;
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
}
async function getPackage() {
    try {
        return {
            ...pkgDefault,
            ...JSON.parse(await readFile("package.json")),
        };
    }
    catch (e) {
        return { ...pkgDefault };
    }
}
const testHtml = (value) => ["html", "md"].some((ext) => value.includes(ext));
const useHtml = (src) => src.some((exp) => /\!/.test(exp)
    ? false
    : [/{([^}]+)}$/, /\.(\w+)$/].some((regExp) => {
        const test = exp.match(regExp);
        if (test) {
            let [, value] = test;
            return testHtml(value.split(/ *, */));
        }
    }));
//# sourceMappingURL=options.js.map