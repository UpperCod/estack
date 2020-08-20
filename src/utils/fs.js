import fs from "fs";
import path from "path";

export let asyncFs = fs.promises;

export let cwd = process.cwd();

let pkgDefault = {
    dependencies: {},
    devDependencies: {},
    peerDependencies: {},
    scripts: {},
};

/**
 * normalizes backslashes
 * @param {string} str
 */
export let normalizePath = (str) =>
    str
        .replace(/[\\\/]+/g, "/")
        .replace(/[\s\(\)\[\]\$\#\?\&\=\¿\!\¡\"\'\{\}\@\<\>\´\`]+/g, "-")
        .replace(/\-+/g, "-")
        .toLowerCase();

/**
 * read from file asynchronously
 * @param {string} file
 */
export let readFile = (file) => asyncFs.readFile(path.join(cwd, file), "utf8");
/**
 * Create or update a file based on a string, does not handle binaries
 * @param {string} file
 * @param {string} code
 */
export async function writeFile(file, code) {
    let dir = path.join(cwd, path.parse(file).dir);
    try {
        await asyncFs.stat(dir);
    } catch (e) {
        await asyncFs.mkdir(dir, {
            recursive: true,
        });
    }
    return asyncFs.writeFile(path.join(cwd, file), code, "utf8");
}

/**
 *  Copy a file only if they are different between origin and destination depending on their date
 * @param {string} src - source file
 * @param {string} dest - destination for the file
 */
export async function copyFile(src, dest) {
    src = path.join(cwd, src);
    dest = path.join(cwd, dest);
    let [statSrc, statDest] = await Promise.all([
        asyncFs.stat(src).catch(() => null),
        asyncFs.stat(dest).catch(() => null),
    ]);
    if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
        if (!statDest) {
            await asyncFs.mkdir(path.parse(dest).dir, {
                recursive: true,
            });
        }
        await asyncFs.copyFile(src, dest);
    }
}

/**
 * Read a package.json from the bin execution source
 */
export async function getPackage() {
    try {
        return {
            ...pkgDefault,
            ...JSON.parse(await readFile("package.json")),
        };
    } catch (e) {
        return { ...pkgDefault };
    }
}
