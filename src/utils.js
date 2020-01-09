import fs from "fs";
import { promisify } from "util";
import path from "path";
import ems from "esm";

export let requireEms = ems(module);

export function requireExternal(file) {
  return requireEms(path.join(cwd, file));
}

export let cwd = process.cwd();

export let asyncReadFile = promisify(fs.readFile);

export let asyncWriteFile = promisify(fs.writeFile);

export let asyncMkdir = promisify(fs.mkdir);

export let asyncStat = promisify(fs.stat);

export let asyncCopyFile = promisify(fs.copyFile);

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {}
};

export function readFile(file) {
  return asyncReadFile(path.join(cwd, file), "utf8");
}

export async function writeFile(file, data) {
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
      ...JSON.parse(await readFile("package.json"))
    };
  } catch (e) {
    return { ...pkgDefault };
  }
}

export async function copyFile(src, dest) {
  src = path.join(cwd, src);
  dest = path.join(cwd, dest);
  let [statSrc, statDest] = await Promise.all([
    asyncStat(src).catch(() => null),
    asyncStat(dest).catch(() => null)
  ]);
  if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
    await asyncCopyFile(src, dest);
  }
}
