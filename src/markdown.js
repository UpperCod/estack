import marked from "marked";
import Handlebars from "handlebars";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/";

let renderer = new marked.Renderer();
// add an additional container prevent the table from collapsing the page
renderer.table = (header, body) =>
  `<div class="markdown -table-container"><table>${
    header + body
  }</table></div>`;

//  configure the container to allow language to be highlighted independently of the class
renderer.code = (code, type) => {
  try {
    if (type) {
      loadLanguages(type);
      return `<pre class="markdown -code-container" data-code="${type}"><code class="language-${type}">${Prism.highlight(
        code,
        Prism.languages[type],
        type
      )}</code></pre>`;
    }
  } catch (e) {}

  return `<pre class="markdown -code-container" data-code="${type}"><code class="language-${type}">${Handlebars.Utils.escapeExpression(
    code
  )}</code></pre>`;
};

renderer.html = (code) => `<div class="markdown -html-container">${code}</div>`;

marked.setOptions({
  renderer,
});

export let renderMarkdown = (code) => marked(code);
