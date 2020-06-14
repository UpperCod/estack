import fs from "fs";
import path from "path";

export let asyncFs = fs.promises;

export let cwd = process.cwd();

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {},
};

/**
 * normalizes backslashes
 * @param {string} str
 */
export let normalizePath = (str) =>
  str.replace(/(\\)+/g, "/").replace(/\s+/g, "-").replace(/\-+/g, "-");

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
export let writeFile = async (file, code) => {
  let dir = path.join(cwd, path.parse(file).dir);
  try {
    await asyncFs.stat(dir);
  } catch (e) {
    await asyncFs.mkdir(dir, {
      recursive: true,
    });
  }
  return asyncFs.writeFile(path.join(cwd, file), code, "utf8");
};
/**
 * Read a package.json from the bin execution source
 */
export let getPackage = async () => {
  try {
    return {
      ...pkgDefault,
      ...JSON.parse(await readFile("package.json")),
    };
  } catch (e) {
    return { ...pkgDefault };
  }
};
/**
 *  Copy a file only if they are different between origin and destination depending on their date
 * @param {string} src - source file
 * @param {string} dest - destination for the file
 */
export let copyFile = async (src, dest) => {
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
};

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
export let getRelativePath = (from, to) => {
  if (from == to) return "";
  let isFolder = /\/$/;
  let withIndexFrom = isFolder.test(from);
  let withIndexTo = isFolder.test(to);
  let isDeep = /^\.\.\/[^\.\/]/;
  let isNoSlash = /^[^\.\/]/;
  let link = normalizePath(path.relative(from, to));

  if (withIndexTo) {
    link += "/";
  }

  if (!withIndexFrom && isDeep.test(link)) {
    link = link.replace("../", "./");
  }

  if (isNoSlash.test(link)) {
    link = "./" + link;
  }

  return link;
};
/**
 * get the depth of the route
 * @param {string} file
 */
export let getRelativeDeep = (file) => {
  file = file.replace(/^(\.\/){0,}/g, "");
  return file
    ? path
        .normalize(file)
        .split(path.sep)
        .map(() => "../")
        .join("")
    : "./";
};
