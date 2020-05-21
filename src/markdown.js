import marked from "marked";
import { escape } from "entities";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-twig";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-sass";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-liquid";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";

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
      return `<pre class="markdown -code-container" data-code="${type}"><code class="language-${type}">${Prism.highlight(
        code,
        Prism.languages[type],
        type
      )}</code></pre>`;
    }
  } catch (e) {}

  return `<pre class="markdown -code-container" data-code="${type}"><code class="language-${type}">${escape(
    code
  )}</code></pre>`;
};

marked.setOptions({
  renderer,
});

export let renderMarkdown = (code) => marked(code);
