import path from "path";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import atImport from "postcss-import";

let cwd = process.cwd();
let isCss = /\.css$/;

export default function pluginImportCss(options = {}) {
  return {
    name: "plugin-import-css",
    async transform(code, id) {
      let { isEntry } = this.getModuleInfo(id);
      if (isCss.test(id)) {
        let { name, dir } = path.parse(id);
        let { css } = code.trim()
          ? await postcss([
              atImport({
                resolve: file => {
                  let id = path.join(
                    /^\./.test(file) ? dir : path.join(cwd, "node_modules"),
                    file
                  );
                  // Add an id to bundle.watchFile
                  this.addWatchFile(id);
                  return id;
                }
              }),
              postcssPresetEnv({
                stage: 0,
                browsers: options.browsers
              }),
              ...(options.watch ? [] : [cssnano()])
            ]).process(code, { from: undefined })
          : "";

        if (isEntry) {
          let fileName = name + ".css";
          this.emitFile({
            type: "asset",
            name: fileName,
            fileName,
            source: css || ""
          });
          return null;
        }
        return {
          code: isEntry ? "" : "export default  `" + css + "`;",
          map: { mappings: "" }
        };
      }
    },
    generateBundle(opts, bundle) {
      for (let key in bundle) {
        let { isEntry, facadeModuleId } = bundle[key];
        if (isEntry && isCss.test(facadeModuleId)) {
          delete bundle[key];
        }
      }
    }
  };
}
