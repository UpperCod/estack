import * as path from "path";
import * as fs from "fs/promises";

const utf = "utf8";

const cwd = process.cwd();

export const localFile = (file: string) => path.join(cwd, file);

export const readFile = (file: string): Promise<string> =>
    fs.readFile(localFile(file), utf);

/**
 * Create or update a file based on a string, does not handle binaries
 */
export async function writeFile(file: string, code: string) {
    const dir = localFile(path.parse(file).dir);
    try {
        await fs.stat(dir);
    } catch (e) {
        await fs.mkdir(dir, {
            recursive: true,
        });
    }
    return fs.writeFile(localFile(file), code, utf);
}

/**
 *  Copy a file only if they are different between origin and destination depending on their date
 */
export async function copyFile(from: string, to: string) {
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
