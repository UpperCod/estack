import html from "parse5";
import { readFile, writeFile, copyFile } from "./utils";
import path from "path";
import marked from "marked";
import yaml from "js-yaml";

let ignore = ["#text", "#comment"];

let cacheHash = {};
// define valid extensions to be considered as rollup script

export async function bundleHtml(
  file,
  dir,
  isExportFile,
  find,
  inject,
  mdTemplate
) {
  // create a search object based on an expression
  find = expToObject(
    [
      "script[type=module][:src]",
      "link[:href][rel=stylesheet]",
      "img[src]"
    ].concat(find)
  );

  inject = expToObject(inject);

  let { name, dir: dirOrg, ext } = path.parse(file);

  let base = name + ".html";

  //read the HTML content

  let content = await readFile(file);

  let meta = {};

  if (ext == ".md") {
    content = marked(
      content.replace(/---([.\s\S]*)---/, (all, content, index) => {
        if (!index) {
          meta = yaml.safeLoad(content);
          return "";
        }
        return all;
      })
    );
    if (mdTemplate) {
      content = mdTemplate({
        content,
        meta,
        base,
        linkMaps: "link-maps.json"
      });
    }
  }

  let fragment = [].concat(html.parse(content));

  let files = [];

  let document = patch(
    fragment,
    function addFile(src) {
      src = path.join(dirOrg, src);
      !files.includes(src) && files.push(src);
      return getFileStatic(src, isExportFile);
    },
    find
  )
    .map(fragment => html.serialize(fragment))
    .join("");

  await writeFile(
    path.join(dir, base),
    inject.reduce(
      (document, { nodeName, attrs }) =>
        document.replace(
          /(\<\/head\>)/,
          `<${nodeName} ${Object.keys(attrs)
            .map(name => `${name}="${attrs[name].value}"`)
            .join(" ")}></${nodeName}>$1`
        ),
      document
    )
  );

  // modify the document obtaining the files and script that is used to export to dir

  let staticFiles = files.filter(file => !isExportFile.test(file));

  let exportableFiles = files.filter(file => isExportFile.test(file));

  // staticFiles are copied to the destination
  await Promise.all(
    staticFiles.map(file =>
      copyFile(file, path.join(dir, getFileStatic(file, isExportFile)))
    )
  );

  return {
    type: ext.replace(/^\./, ""),
    base,
    meta,
    exportableFiles,
    staticFiles
  };
}

function patch(fragment, addFile, find) {
  let length = fragment.length;
  for (let i = 0; i < length; i++) {
    let node = fragment[i];

    if (ignore.includes(node.nodeName)) continue;

    if (node.attrs) {
      let nodeAttrs = node.attrs.reduce((attrs, { name, value }) => {
        attrs[name] = value;
        return attrs;
      }, {});
      for (let i = 0; i < find.length; i++) {
        let { nodeName, attrs } = find[i];
        if (nodeName == node.nodeName) {
          let size = 0;
          let sizeOk = 0;
          let src;
          for (let key in attrs) {
            let attr = attrs[key];
            size++;
            if (key in nodeAttrs) {
              if (attr.value == "*" || attr.value == nodeAttrs[key]) {
                if (
                  attr.src &&
                  !/^(http(s){0,1}:){0,1}\/\//.test(nodeAttrs[key])
                ) {
                  src = {
                    key,
                    value: nodeAttrs[key]
                  };
                }
                sizeOk++;
              }
            }
          }
          if (size == sizeOk && src) {
            node.attrs = node.attrs.map(({ name, value }) =>
              name == src.key
                ? {
                    name,
                    value: addFile(value)
                  }
                : { name, value }
            );
          }
        }
      }
    }

    !["script"].includes(node.nodeName) &&
      node.childNodes &&
      patch(node.childNodes, addFile, find);
  }
  return fragment;
}

function getHash(str) {
  return (cacheHash[str] =
    cacheHash[str] ||
    "file-" +
      str.split("").reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
      path.parse(str).ext);
}
// generates the name of the static file to insert into the HTML
function getFileStatic(src, isExportFile) {
  if (isExportFile.test(src)) {
    let { name, ext } = path.parse(src);
    return name + (ext == ".css" ? ext : ".js");
  } else {
    return getHash(src);
  }
}

function expToObject(find) {
  return []
    .concat(find)
    .filter(value => value)
    .map(expression => {
      if (!expression) return {};
      let [nodeName, ...attrs] =
        expression.match(/([\w-]+)|(\[[^\]]+\])/g) || [];
      return {
        nodeName,
        attrs: attrs.reduce((attrs, attr) => {
          let [all, src, type, value = "*"] =
            attr.match(/\[(\:){0,1}([\w-]+)(?:=(.+)){0,1}\]/) || [];
          attrs[type] = {
            value: value,
            src: src != null
          };
          return attrs;
        }, {})
      };
    })
    .filter(({ nodeName }) => nodeName);
}
