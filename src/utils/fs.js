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
    .replace(/\s+/g, "-")
    .replace(/\-+/g, "-");

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
 * It manages to resolve the relative path,
 * this function avoids the redirection by
 * correctly handling the closing of the path
 * @param {string} from - New link destination
 * @param {string} to - Origin link
 * @example
 * getRelativePath("./post/post-1","post/2/") == "./2/"
 * getRelativePath("./post/1/","post/2/") == "../2/"
 */
export function getRelativePath(from, to) {
  if (from == to) return "./";

  let split = /\/+/;
  let [, ...folderFrom] = from.split(split);
  let [, ...folderTo] = to.split(split);

  let link = [];
  let sameFolder = true;
  for (let i = 0; i < folderFrom.length; i++) {
    if (folderFrom[i] == folderTo[i]) {
      if (folderFrom.length < folderTo.length) {
        link.push(...folderTo.slice(i));
      } else {
        if (!i) link.push("..");
        link.push(folderTo[i]);
      }
    } else {
      if (sameFolder) {
        link.push(...folderTo.slice(i));
      } else {
        link.unshift("..");
      }
      sameFolder = false;
    }
  }

  return (link[0] != ".." ? "./" : "") + link.join("/");
}
/**
 * get the depth of the route
 * @param {string} file
 */
export function getRelativeDeep(file) {
  let folders = file.split(/[^\/]+/).filter((vallue) => vallue);
  return folders.length > 1 ? ["", ...folders].join("..") : "./";
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
