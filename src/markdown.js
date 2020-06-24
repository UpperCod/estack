import marked from "marked";
import { escape } from "html-escaper";
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
import { escapeTemplate } from "./template";

let cache = {};

let renderer = new marked.Renderer();

export let highlighted = (code, type) =>
  Prism.languages[type]
    ? Prism.highlight(code, Prism.languages[type], type)
    : escape(code);

export let renderMarkdown = (code) => {
  if (!cache[code]) {
    let escape = escapeTemplate(code);
    cache[code] = escape.recovery(marked(escape.code));
  }
  return cache[code];
};

// add an additional container prevent the table from collapsing the page
renderer.table = (header, body) =>
  `<div class="markdown-table-container"><table>${header + body}</table></div>`;

//  configure the container to allow language to be highlighted independently of the class
renderer.code = (code, type) => {
  try {
    return `<pre class="markdown-code-container" data-code="${type}"><code class="language-${type}">${highlighted(
      code,
      type
    )}</code></pre>`;
  } catch (e) {}
};

marked.setOptions({
  renderer,
});
