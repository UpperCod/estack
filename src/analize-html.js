import parse5 from "parse5";

const EXCLUDE_CONSUME = ["script", "pre", "code", "style"];

export let serializeHtml = (astHtml) => parse5.serialize(astHtml);
/**
 * parses an html document node to node
 * @param {string} content
 * @param {function(Node)} map
 * @param {boolean} isRoot
 * @returns {Object} astHtml
 */
export function analyzeHtml(content, map) {
  const isRoot = /^\s*<(!doctype|html)/i.test(content);
  const astHtml = parse5[isRoot ? "parse" : "parseFragment"](content);
  const parallel = [];

  let consume = (astHtml) =>
    astHtml.map((node) => {
      parallel.push(
        map({
          ...node,
          setAttribute(name, value) {
            node.attrs = node.attrs.map((attr) =>
              attr.name == name ? { name, value } : attr
            );
          },
          getAttribute(name) {
            return (node.attrs || [])
              .filter((attr) => attr.name == name)
              .reduce((_, { value }) => value, null);
          },
        })
      );
      if (!EXCLUDE_CONSUME.includes(node.nodeName) && node.childNodes) {
        consume(node.childNodes);
      }
    });

  map && consume(astHtml.childNodes);

  return Promise.all(parallel).then(() => astHtml);
}

/**
 * @typedef {Object} Node
 * @property {string} nodeName
 * @property {(name:string,value:string)=>void} setAttribute
 * @property {(name:string)=>string|null} getAttribute
 */
