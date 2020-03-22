import path from "path";
import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import atImport from "postcss-import";
import { cwd, asyncFs, isUrl } from "./utils";

export async function readCss({ file, code, addWatchFile, minify, browsers }) {
  const { dir } = path.parse(file);

  const plugins = [
    atImport({
      root: dir, // defines the context for the relative path
      async resolve(file) {
        if (isUrl(file)) return file;

        const relativeFile = path.join(dir, file);

        try {
          // check local existence.
          await asyncFs.stat(relativeFile);
          // Add an id to bundle.watchFile
          addWatchFile && addWatchFile(relativeFile);
        } catch (e) {
          // if it does not exist locally, it is resolved as a module
          file = path.join(cwd, "node_modules", file);
        }

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
