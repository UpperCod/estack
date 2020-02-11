import fs from "fs";
import path from "path";
import ems from "esm";

export let requireEms = ems(module);

export function requireExternal(file) {
  return requireEms(path.join(cwd, file));
}

export let asyncFs = fs.promises;

export let cwd = process.cwd();

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {}
};

export function readFile(file) {
  return asyncFs.readFile(path.join(cwd, file), "utf8");
}

export async function writeFile(file, data) {
  let dir = path.join(cwd, path.parse(file).dir);
  try {
    await asyncFs.stat(dir);
  } catch (e) {
    await asyncFs.mkdir(dir, {
      recursive: true
    });
  }

  return asyncFs.writeFile(path.join(cwd, file), data, "utf8");
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
    asyncFs.stat(src).catch(() => null),
    asyncFs.stat(dest).catch(() => null)
  ]);
  if (statSrc && (!statDest || statSrc.ctimeMs != statDest.ctimeMs)) {
    if (!statDest) {
      await asyncFs.mkdir(path.parse(dest).dir, {
        recursive: true
      });
    }
    await asyncFs.copyFile(src, dest);
  }
}
