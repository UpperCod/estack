import { analyzeHtml, serializeHtml } from "./analize-html";
import { isUrl } from "./utils";

export async function readHtml({ code, addFile }) {
  const astHtml = await analyzeHtml(code, async node => {
    if (node.nodeName == "link") {
      const isHrefImport = ["stylesheet", "manifest", "preload"].includes(
        node.getAttribute("rel")
      );
      const href = node.getAttribute("href");
      if (isHrefImport && href && !isUrl(href)) {
        node.setAttribute("href", await addFile(href));
      }
    } else if (
      !["iframe"].includes(node.nodeName) &&
      node.getAttribute("src")
    ) {
      const src = node.getAttribute("src");
      if (src && !isUrl(src)) {
        node.setAttribute("src", await addFile(src));
      }
    }
  });
  return serializeHtml(astHtml);
}
