import html from "parse5";
import { readFile, writeFile, copyFile, normalizePath } from "./utils";
import path from "path";
import marked from "marked";
import yaml from "js-yaml";

let cache = {};

let cacheHash = {};

let isNotStatic = /\.(js|jsx|ts|tsx|css)$/;

let ignore = ["#text", "#comment"];
/**
 *
 * @param {string} src
 * @param {string} dir
 * @param {string[]} exports
 * @param {Object} markdownTemplate
 * @param {Object} markdownTemplate.nodeTypes
 * @param {boolean} [disableCache]
 */
export default async function readHtml({
  src,
  dir,
  exports,
  markdownTemplate
}) {
  let content = await readFile(src);

  let { ext, name, dir: dirOrg } = path.parse(src);

  let link = name + ".html";

  let meta = {};

  let htmlContent = content;

  /**@type {string[]} */
  let files = [];

  let isMarkdown = ext == ".md";

  if (isMarkdown) {
    let options = {};
    if (markdownTemplate.nodeTypes) {
      options.renderer = new marked.Renderer();
      for (let key in markdownTemplate.nodeTypes) {
        let value = markdownTemplate.nodeTypes[key];
        if (key == "highlight") {
          options[key] = value;
        } else {
          options.renderer[key] = value;
        }
      }
    }

    htmlContent = marked(
      content.replace(/---\s([.\s\S]*)\s---\s/, (all, content, index) => {
        if (!index) {
          meta = yaml.safeLoad(content);
          return "";
        }
        return all;
      }),
      markdownTemplate.nodeTypes ? options : null
    );

    meta.import = []
      .concat(meta.import)
      .filter(value => value)
      .map(addFile);
  }

  // create the search object to perform the query
  let findExpressions = formatExpressions(exports);

  htmlContent = html.parseFragment(htmlContent);

  let fragment = findExpressions.length
    ? analyze([].concat(htmlContent), addFile, findExpressions)
    : htmlContent;

  // staticFiles are copied to the destination
  await Promise.all(
    files
      .filter(file => !isNotStatic.test(file))
      .map(file => copyFile(file, path.join(dir, getFileStatic(file))))
  );

  function addFile(src) {
    src = normalizePath(path.join(dirOrg, src));
    !files.includes(src) && files.push(src);
    return getFileStatic(src);
  }

  /**
   * write the document to the destination directory
   * @param {Function} [template]
   * @param {Object} opts
   */
  function write(markdownData) {
    let document = fragment;

    if (isMarkdown && markdownTemplate.template) {
      document = [].concat(
        html.parse(
          markdownTemplate.template({
            ...markdownData,
            link,
            meta,
            content: fragment.map(html.serialize).join("")
          })
        )
      );
    }

    return writeFile(
      path.join(dir, link),
      document.map(html.serialize).join("")
    );
  }

  return (cache[src] = {
    exports: files.filter(src => isNotStatic.test(src)),
    write,
    link,
    meta,
    ext,
    src
  });
}

/**
 *
 * @param {Array} fragment
 * @param {Function} addFile
 * @param {Object} find
 */
function analyze(fragment, addFile, find) {
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

    !["script", "pre", "code"].includes(node.nodeName) &&
      node.childNodes &&
      analyze(node.childNodes, addFile, find);
  }
  return fragment;
}

/**
 * create an id based on the path
 * @param {string} str
 */
function getHash(str) {
  return (cacheHash[str] =
    cacheHash[str] ||
    "file-" +
      str.split("").reduce((out, i) => (out + i.charCodeAt(0)) | 8, 4) +
      path.parse(str).ext);
}
// generates the name of the static file to insert into the HTML
function getFileStatic(src) {
  if (isNotStatic.test(src)) {
    let { name, ext } = path.parse(src);
    return name + (ext == ".css" ? ext : ".js");
  } else {
    return getHash(src);
  }
}

function formatExpressions(find) {
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
