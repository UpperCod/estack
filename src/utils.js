import { readFile, writeFile, mkdir, stat, copyFile, constants } from "fs";
import { promisify } from "util";
import path from "path";

export let cwd = process.cwd();

export let asyncReadFile = promisify(readFile);

export let asyncWriteFile = promisify(writeFile);

export let asyncMkdir = promisify(mkdir);

export let asyncStat = promisify(stat);

export let asyncCopy = promisify(copyFile);

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {}
};

export function read(file) {
  return asyncReadFile(path.join(cwd, file), "utf8");
}

export async function write(file, data) {
  let dir = path.join(cwd, path.parse(file).dir);
  try {
    await asyncStat(dir);
  } catch (e) {
    await asyncMkdir(dir, {
      recursive: true
    });
  }

  return asyncWriteFile(path.join(cwd, file), data, "utf8");
}

export function normalizePath(path) {
  return path.replace(/(\\+)/g, "/");
}

export function mergeKeysArray(keys, ...config) {
  keys.forEach(index => {
    config[0][index] = Array.from(
      new Map(
        config.reduce(
          (nextConfig, config) =>
            nextConfig.concat(
              (config[index] || []).map(value =>
                Array.isArray(value) ? value : [value]
              )
            ),
          []
        )
      )
    );
  });

  return config[0];
}

export async function getPackage() {
  try {
    return {
      ...pkgDefault,
      ...JSON.parse(await read("package.json"))
    };
  } catch (e) {
    return { ...pkgDefault };
  }
}

export async function copy(src, dest) {
  src = path.join(cwd, src);
  dest = path.join(cwd, dest);
  let [statSrc, statDest] = await Promise.all([
    asyncStat(src).catch(() => null),
    asyncStat(dest).catch(() => null)
  ]);
  if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
    await asyncCopy(src, dest);
  }
}
