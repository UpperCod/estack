import { isCss } from "../utils/types";
import { loadCssFile } from "../load-css/load-css-file";
/**
 * @param {import("../internal").build} build
 * @returns {import("rollup").Plugin}
 */
export let pluginImportCss = (build) => ({
    name: "plugin-import-css",
    async transform(code, id) {
        if (isCss(id)) {
            /**@type {import("rollup").SourceDescription} */
            return {
                code: `export default ${JSON.stringify(
                    await loadCssFile({
                        file: id,
                        code,
                        readFile: build.readFile,
                        addWatchFile: (id) => this.addWatchFile(id),
                        request: build.request,
                    })
                )}`,
                map: { mappings: "" },
            };
        }
    },
});
