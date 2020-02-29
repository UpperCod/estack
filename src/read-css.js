import path from "path";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import atImport from "postcss-import";

export async function readCss({ file, code, addWatchFile, minify, browsers }) {
  let { dir } = path.parse(file);

  let plugins = [
    atImport({
      resolve: file => {
        let id = path.join(
          /^\./.test(file) ? dir : path.join(cwd, "node_modules"),
          file
        );
        // Add an id to bundle.watchFile
        addWatchFile && addWatchFile(id);
        return id;
      }
    }),
    postcssPresetEnv({
      stage: 0,
      browsers
    })
  ];

  minify && plugins.push(cssnano());

  code = await postcss(plugins).process(code, { from: undefined });

  return code.css;
}
