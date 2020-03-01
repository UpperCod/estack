import { isCss, cwd } from "../utils";
import { readCss } from "../read-css";

export function pluginImportCss(options = {}) {
  return {
    name: "plugin-import-css",
    async transform(code, id) {
      if (isCss(id)) {
        return {
          code: `export default ${JSON.stringify(
            await readCss({
              file: id,
              code,
              minify: options.minify,
              browsers: options.browsers,
              addWatchFile: id => this.addWatchFile(id)
            })
          )}`,
          map: { mappings: "" }
        };
      }
    }
  };
}
