import * as path from "path";
import * as fs from "fs/promises";
const utf = "utf8";
const cwd = process.cwd();
export const localFile = (file) => path.join(cwd, file);
export const readFile = (file) => fs.readFile(localFile(file), utf);
export async function writeFile(file, code) {
    const dir = localFile(path.parse(file).dir);
    try {
        await fs.stat(dir);
    }
    catch (e) {
        await fs.mkdir(dir, {
            recursive: true,
        });
    }
    return fs.writeFile(localFile(file), code, utf);
}
export async function copyFile(from, to) {
    const src = localFile(from);
    const dest = localFile(to);
    const [statSrc, statDest] = await Promise.all([
        fs.stat(src).catch(() => null),
        fs.stat(dest).catch(() => null),
    ]);
    if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
        if (!statDest) {
            await fs.mkdir(path.parse(dest).dir, {
                recursive: true,
            });
        }
        await fs.copyFile(src, dest);
    }
}
//# sourceMappingURL=fs.js.map