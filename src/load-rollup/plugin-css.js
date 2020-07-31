import { isCss } from "../utils/types";
import { loadCssFile } from "../load-css/load-css-file";

const VIRTUAL = `\0estack:utils`;
const replaceScopeCss = (id, code) =>
    code.replace(/#== */g, id ? id + " " : "");
/**
 * @param {import("../internal").build} build
 * @returns {import("rollup").Plugin}
 */
export let pluginImportCss = (build) => ({
    name: "plugin-import-css",
    resolveId(id) {
        if (id == VIRTUAL || "\0" + id == VIRTUAL) {
            return VIRTUAL;
        }
    },
    load(id) {
        if (id == VIRTUAL) {
            return `
            export const replaceScopeCss = ${replaceScopeCss};
            export const injectStyle = (code) => document.head.insertAdjacentHTML("beforeend", "<style>"+code+"</style>");
            `;
        }
    },
    async transform(code, id) {
        if (isCss(id)) {
            const css = await loadCssFile(
                {
                    file: id,
                    code,
                    readFile: build.readFile,
                    addWatchFile: (id) => this.addWatchFile(id),
                    request: build.request,
                },
                "#=="
            );
            /**@type {import("rollup").SourceDescription} */
            return {
                code: `
                import { replaceScopeCss, injectStyle } from "${VIRTUAL}";
                const code = ${JSON.stringify(css)};
                export const scope = (id) => replaceScopeCss(id||"",code);
                export const inject = (id) => injectStyle(scope(id));
                export default ${JSON.stringify(replaceScopeCss("", css))};
                `,
                map: { mappings: "" },
            };
        }
    },
});
