import { serialize, stringify } from "stylis";
import { load } from "stylis-pack/load";
import { pluginImport } from "stylis-pack/plugin-import";
import { isCss } from "../utils/types";

/**
 * @param {import("../create-build").build} build
 * @returns {import("rollup").Plugin}
 */
export let pluginImportCss = (build) => ({
    name: "plugin-import-css",
    renderStart() {
        this.cssParallel = {};
    },
    async transform(code, id) {
        if (isCss(id)) {
            const root = await load(
                {
                    code,
                    file: id,
                },
                [pluginImport()],
                this.cssParallel || {}
            );

            for (const src in root.tree.tree) {
                if (src != id) {
                    this.addWatchFile(src);
                }
            }

            const css = serialize(root.css, stringify);
            /**@type {import("rollup").SourceDescription} */
            return {
                code: `
                export default ${JSON.stringify(css)};
                `,
                map: { mappings: "" },
            };
        }
    },
});
