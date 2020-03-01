import path from "path";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import atImport from "postcss-import";
import { cwd } from "./utils";

export async function readCss({ file, code, addWatchFile, minify, browsers }) {
  const { dir } = path.parse(file);

  const plugins = [
    atImport({
      resolve: file => {
        file = path.join(
          /^\./.test(file) ? dir : path.join(cwd, "node_modules"),
          file
        );
        // Add an id to bundle.watchFile
        addWatchFile && addWatchFile(file);
        return file;
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
