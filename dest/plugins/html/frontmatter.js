import { getFragments, replaceFragments } from "@uppercod/str-fragment";
export function frontmatter(src, content) {
    var fragment = getFragments(content, {
        open: /^---/m,
        end: /^---/m,
        equal: true
    })[0];
    if (fragment) {
        var open_1 = fragment.open, end = fragment.end;
        if (!open_1.indexOpen) {
            var metadata_1 = "";
            var nextContent = replaceFragments(content, [fragment], function (_a) {
                var content = _a.content;
                metadata_1 = content;
                return "";
            });
            return [nextContent, metadata_1];
        }
    }
    return [content, ""];
}
//# sourceMappingURL=frontmatter.js.map