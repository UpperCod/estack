import { isCss } from "../utils/utils";
import { readCss } from "../read-css";

export let pluginImportCss = () => ({
  name: "plugin-import-css",
  async transform(code, id) {
    if (isCss(id)) {
      return {
        code: `export default ${JSON.stringify(
          await readCss({
            file: id,
            code,
            addWatchFile: (id) => this.addWatchFile(id),
          })
        )}`,
        map: { mappings: "" },
      };
    }
  },
});
