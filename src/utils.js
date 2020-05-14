import fs from "fs";
import path from "path";
import logUpdate from "log-update";
import yaml from "js-yaml";

export let asyncFs = fs.promises;

export let cwd = process.cwd();

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {},
};

export let isUrl = (file) => /^(http(s){0,1}:){0,1}\/\//.test(file);

export let asyncGroup = (group) => Promise.all(group);

export let isHtml = (file) => /\.(md|html)/.test(file);

export let isMd = (file) => /\.md$/.test(file);

export let isJs = (file) => /\.(js|ts|jsx|tsx)$/.test(file);

export let isCss = (file) => /\.css$/.test(file);

export let isFixLink = (file) => isHtml(file) || isJs(file) || isCss(file);

export let isNotFixLink = (file) => !isFixLink(file);

export let promiseErrorToNull = async (promise) => promise.catch((e) => null);

/**
 *
 * @param {string} a - New link destination
 * @param {string} b - Origin link
 */
export let getRelativePath = (a, b) =>
  normalizePath(path.relative(path.parse(a).dir, b));

export let getRelativeDeep = (file) =>
  file
    ? path
        .normalize(file)
        .split(path.sep)
        .map(() => "../")
        .join("")
    : "";

export let readFile = (file) => asyncFs.readFile(path.join(cwd, file), "utf8");

export async function writeFile(file, data) {
  let dir = path.join(cwd, path.parse(file).dir);
  try {
    await asyncFs.stat(dir);
  } catch (e) {
    await asyncFs.mkdir(dir, {
      recursive: true,
    });
  }

  return asyncFs.writeFile(path.join(cwd, file), data, "utf8");
}

export function mergeKeysArray(keys, ...config) {
  keys.forEach((index) => {
    config[0][index] = Array.from(
      new Map(
        config.reduce(
          (nextConfig, config) =>
            nextConfig.concat(
              (config[index] || []).map((value) =>
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
      ...JSON.parse(await readFile("package.json")),
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

export function streamLog(message) {
  message = message + "";
  try {
    // process.stdout.clearLine();
    // process.stdout.cursorTo(0);
    // process.stdout.write(message);

    message ? logUpdate(message) : logUpdate.clear();
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
    reject,
  };
}

export let normalizePath = (str) => str.replace(/(\\)+/g, "/");

export function getMetaFile(code) {
  let meta = {};
  let metaBlock = "---";
  let lineBreak = "\n";
  if (!code.indexOf(metaBlock)) {
    let data = [];
    let lines = code.slice(3).split(lineBreak);
    let body = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].indexOf(metaBlock)) {
        body = lines.slice(i + 1);
        break;
      }
      data.push(lines[i]);
    }
    if (data.length) {
      meta = yaml.safeLoad(data.join(lineBreak));
    }
    code = body.join(lineBreak);
  }
  return [code, meta];
}

export function getFileName(file) {
  let { name, ext } = path.parse(file);
  return normalizePath(
    isFixLink(ext)
      ? name + (isJs(ext) ? ".js" : isMd(ext) ? ".html" : ext)
      : "file-" +
          file.split("").reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
          ext
  );
}
