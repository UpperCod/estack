import parse5 from "parse5";

export function serializeHtml(astHtml) {
  return parse5.serialize(astHtml);
}

export function analyzeHtml(content, map) {
  let astHtml = parse5.parse(content);
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
