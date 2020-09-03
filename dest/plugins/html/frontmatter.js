import { getFragments, replaceFragments } from "@uppercod/str-fragment";
export function frontmatter(src, content) {
    const [fragment] = getFragments(content, {
        open: /^---/m,
        end: /^---/m,
        equal: true,
    });
    if (fragment) {
        const { open, end } = fragment;
        if (!open.indexOpen) {
            let metadata = "";
            const nextContent = replaceFragments(content, [fragment], ({ content }) => {
                metadata = content;
                return "";
            });
            return [nextContent, metadata];
        }
    }
    return [content, ""];
}
//# sourceMappingURL=frontmatter.js.map