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

let cache = {};

let renderer = new marked.Renderer();
// add an additional container prevent the table from collapsing the page
renderer.table = (header, body) =>
  `<div class="markdown-table-container"><table>${header + body}</table></div>`;

//  configure the container to allow language to be highlighted independently of the class
renderer.code = (code, type) => {
  try {
    return `<pre class="markdown-code-container" data-code="${type}"><code class="language-${type}">${
      Prism.languages[type]
        ? Prism.highlight(code, Prism.languages[type], type)
        : escape(code)
    }</code></pre>`;
  } catch (e) {}
};

renderer.image = (href, title, text) =>
  `<img src="${safeLink(href)}" alt="${text}">`;

renderer.link = (href, title, text) =>
  `<a href="${safeLink(href)}">${text}</a>`;

marked.setOptions({
  renderer,
});

let bracketsStart = createReplace("{{");
let bracketsEnd = createReplace("}}");

function safeLink(link) {
  link = bracketsStart.replace(link);
  link = bracketsEnd.replace(link);
  link = escape(link);
  link = bracketsStart.recover(link);
  return bracketsEnd.recover(link);
}

/**
 * Maintains the use of brackets to normalize the work of liquidjs
 * @param {string} value
 */
function createReplace(value) {
  let regValue = RegExp(value, "g");
  let alias = (Math.random() + "").replace("0.", "__");
  let regAlias = RegExp(alias, "g");
  return {
    replace: (str) => str.replace(regValue, alias),
    recover: (str) => str.replace(regAlias, value),
  };
}

export let renderMarkdown = (code) =>
  (cache[code] = cache[code] || marked(code));
