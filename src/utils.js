import fs from "fs";
import path from "path";

export const asyncFs = fs.promises;

export const cwd = process.cwd();

const pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {}
};

export const isUrl = file => /^(http(s){0,1}:){0,1}\/\//.test(file);

export const asyncGroup = group => Promise.all(group);

export const isHtml = file => /\.(md|html)/.test(file);

export const isMd = file => /\.md$/.test(file);

export const isJs = file => /\.(js|ts|jsx,tsx)$/.test(file);

export const isCss = file => /\.css$/.test(file);

export const isFixLink = file => isHtml(file) || isJs(file) || isCss(file);

export const isNotFixLink = file => !isFixLink(file);

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

export function streamLog(message) {
  message = message + "";
  try {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  } catch (e) {
    console.log(message);
  }
}

export function createAwait() {
  let resolve;
  let reject;
  let promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}
