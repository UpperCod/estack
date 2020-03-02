import parse5 from "parse5";

export function serializeHtml(astHtml) {
  return parse5.serialize(astHtml);
}
/**
 * parses an html document node to node
 * @param {string} content
 * @param {function(Node)} map
 * @param {boolean} useFragment
 * @returns {Object} astHtml
 */
export function analyzeHtml(content, map, useFragment) {
  let astHtml = parse5[useFragment ? "parseFragment" : "parse"](content);
  let parallel = [];

  function consume(astHtml) {
    astHtml.map(node => {
      parallel.push(
        map({
          ...node,
          setAttribute(name, value) {
            node.attrs = node.attrs.map(attr =>
              attr.name == name ? { name, value } : attr
            );
          },
          getAttribute(name) {
            return node.attrs
              .filter(attr => attr.name == name)
              .reduce((_, { value }) => value, null);
          }
        })
      );
      if (
        !["script", "pre", "code", "style"].includes(node.nodeName) &&
        node.childNodes
      ) {
        consume(node.childNodes);
      }
    });
  }

  map && consume(astHtml.childNodes);

  return Promise.all(parallel).then(() => astHtml);
}

/**
 * @typedef {Object} Node
 * @property {string} nodeName
 * @property {(name:string,value:string)=>void} setAttribute
 * @property {(name:string)=>string|null} getAttribute
 */
