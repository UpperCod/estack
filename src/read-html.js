import { analyzeHtml, serializeHtml } from "./analize-html";
import { isUrl } from "./utils/utils";

export async function readHtml({ code, addFile }) {
  let astHtml = await analyzeHtml(code, async (node) => {
    if (node.nodeName == "link") {
      let isHrefImport = ["stylesheet", "manifest", "preload"].includes(
        node.getAttribute("rel")
      );
      let href = node.getAttribute("href");
      if (isHrefImport && href && !isUrl(href)) {
        node.setAttribute("href", await addFile(href));
      }
    } else if (
      !["iframe"].includes(node.nodeName) &&
      node.getAttribute("src")
    ) {
      let src = node.getAttribute("src");
      if (src && !isUrl(src)) {
        node.setAttribute("src", await addFile(src));
      }
    }
  });
  return serializeHtml(astHtml);
}
