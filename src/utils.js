import fs from "fs";
import path from "path";
import logUpdate from "log-update";
import yaml from "js-yaml";
import url from "url";
import http from "http";
import https from "https";

export let asyncFs = fs.promises;

export let cwd = process.cwd();

let pkgDefault = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  babel: {},
};

export let isYaml = (file) => /\.yaml$/.test(file);

export let isUrl = (file) => /^(http(s){0,1}:){0,1}\/\//.test(file);

export let isHtml = (file) => /\.(md|html)/.test(file);

export let isMd = (file) => /\.md$/.test(file);

export let isJs = (file) => /\.(js|ts|jsx|tsx)$/.test(file);

export let isCss = (file) => /\.css$/.test(file);

export let isFixLink = (file) => isHtml(file) || isJs(file) || isCss(file);

export let isNotFixLink = (file) => !isFixLink(file);

export let promiseErrorToNull = async (promise) => promise.catch((e) => null);

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
  if (from == to) return "./";
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
export let getRelativeDeep = (file) =>
  file
    ? path
        .normalize(file)
        .split(path.sep)
        .map(() => "../")
        .join("")
    : "";

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
  return;
  if (!/SyntaxError/.test(message)) {
    try {
      message ? logUpdate(message) : logUpdate.clear();
      return;
    } catch (e) {}
  }
  logUpdate.clear();
  console.log(message + "\n");
}

export let normalizePath = (str) => str.replace(/(\\)+/g, "/");

export let yamlParse = (string) => yaml.safeLoad(string);

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
      meta = yamlParse(data.join(lineBreak));
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
/**
 * generate a request to obtain data
 * @param {string} uri
 * @returns {Promise}
 */
export function requestJson(uri) {
  return new Promise((resolve, reject) => {
    let dataUri = url.parse(uri);
    (dataUri.protocol == "https:" ? https : http)
      .get(uri, { headers: { "user-agent": "node.js" } }, (res) => {
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(res);
          }
          if (res.statusCode > 300 && res.headers.location) {
            requestJson(url.resolve(dataUri.path, res.headers.location)).then(
              resolve,
              reject
            );
          } else {
            resolve(JSON.parse(data));
          }
        });
      })
      .on("error", reject);
  });
}

export function getProp(value, prop, option) {
  value = value || {};
  prop = Array.isArray(prop) ? prop : prop.match(/([^\[\]\.]+)/g);
  for (let i = 0; i < prop.length; i++) {
    if (typeof value === "object" && prop[i] in value) {
      value = value[prop[i]];
    } else {
      return option;
    }
  }
  return value;
}
