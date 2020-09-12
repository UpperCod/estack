import { getFragments, replaceFragments } from "@uppercod/str-fragment";
import { Replace } from "./types";
import getId from "@uppercod/hash";
import * as marked from "marked";
import * as Prism from "prismjs";
import { escape } from "html-escaper";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-twig";
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

const renderer = new marked.Renderer();

renderer.table = (header, body) =>
    `<div class="table"><table>${header + body}</table></div>`;

marked.setOptions({
    renderer,
    highlight(code, lang, callback) {
        if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
        } else {
            return escape(code);
        }
    },
});

export const markdown = marked;

export function escapeBlockCodeMarkdown(
    replace: Replace,
    code: string
): string {
    const blocksCode = getFragments(code, {
        open: /^```/m,
        end: /^```/m,
        equal: true,
    });
    return replaceFragments(code, blocksCode, ({ body }) => {
        const id = getId(body);
        replace[id] = body;
        return `<!--${id}-->`;
    });
}
