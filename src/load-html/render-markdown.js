import marked from "marked";
import { escape } from "html-escaper";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-sass";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-liquid";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-http";
import "prismjs/components/prism-git";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-bash";

let cache = {};

let renderer = new marked.Renderer();

let count = 0;
let alias = {};
let time = Date.now();

export let highlighted = (code, type) =>
    Prism.languages[type]
        ? Prism.highlight(code, Prism.languages[type], type)
        : escape(code);

export let renderMarkdown = (code) =>
    (cache[code] = cache[code] || marked(code));

// add an additional container prevent the table from collapsing the page
renderer.table = (header, body) =>
    `{% raw %}<div class="markdown-table-container"><table>${
        header + body
    }</table></div>{% endraw %}`;

//  configure the container to allow language to be highlighted independently of the class
renderer.code = (code, type) => {
    let isRaw;
    if (type) {
        [type, isRaw] = type.split(/ +/);
        isRaw = isRaw == "raw" || type == "raw";
    }
    try {
        return `${
            isRaw ? "" : "{% raw %}"
        }<pre class="markdown-code-container" data-code="${type}"><code class="language-${type}">${highlighted(
            code,
            type
        )}</code></pre>${isRaw ? "" : "{% endraw %}"}`;
    } catch (e) {}
};

renderer.codespan = (code) => `{% raw %}<code>${code}</code>{% endraw %}`;

renderer.link = (href, title, text) => {
    href = escapeTemplate(href);
    return `<a href="${href.recovery(escape(href.code))}">${text}</a>`;
};

renderer.image = (href, title, text) => {
    href = escapeTemplate(href);
    return `<img src="${href.recovery(escape(href.code))}" alt="${text}">`;
};

renderer.heading = (text, lvl, raw, slugger) => {
    let id = /{/.test(raw)
        ? `{% capture __md_slug__ %}${raw}{% endcapture%}{{ __md_slug__ | slug }}`
        : slugger.slug(text);
    return `<h${lvl} id="${id}">${text}</h${lvl}>`;
};

marked.setOptions({
    renderer,
});

function escapeTemplate(code) {
    let replace = [];
    code = code.replace(/({{[^}]*}})/g, (id) => {
        if (!alias[id]) {
            let value =
                time + "-" + count++ + (Math.random() + "").replace("0.", "-");
            alias[id] = { value, reg: RegExp(value, "g") };
        }
        if (!replace.includes(id)) {
            replace.push(id);
        }
        return alias[id].value;
    });
    return {
        code,
        recovery(code) {
            return replace.reduce(
                (code, id) => code.replace(alias[id].reg, id),
                code
            );
        },
    };
}
