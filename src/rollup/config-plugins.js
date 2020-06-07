import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import common from "@rollup/plugin-commonjs/dist/index";
import sucrase from "@rollup/plugin-sucrase";
import replace from "@rollup/plugin-replace";
import { pluginTerser } from "./plugin-terser";
import { pluginImportCss } from "./plugin-import-css";
import sizes from "@atomico/rollup-plugin-sizes";

let extensions = [".js", ".jsx", ".ts", ".tsx"];

/**
 *
 * @param {Object} options
 * @param {boolean} options.minify
 * @param {boolean} options.sizes
 * @param {boolean} options.jsx
 * @param {boolean} options.jsxFragment
 * @param {({dest:string,code:string,type:string})=>void} [mountFile] - mount rollup files on development server without writing
 */
export let rollupPlugins = (options, mountFile) => {
  let optionalPlugins = [];

  if (options.minify) {
    optionalPlugins.push(pluginTerser({ sourcemap: options.sourcemap }));
  }

  if (options.sizes) {
    optionalPlugins.push(sizes());
  }

  if (mountFile) {
    optionalPlugins.push({
      type: "mount-file",
      generateBundle(opts, chunks) {
        for (let file in chunks) {
          mountFile({ dest: file, code: chunks[file].code, type: "js" });
          delete chunks[file];
        }
      },
    });
  }

  return [
    pluginImportCss(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    resolve({
      extensions,
      dedupe: ["react", "react-dom"],
    }),
    json(),
    sucrase({
      exclude: ["node_modules/**"],
      transforms: ["jsx", "typescript"],
      jsxPragma: options.jsx,
      jsxFragmentPragma: options.jsxFragment,
      production: true,
    }),
    common(),
    ...optionalPlugins,
  ];
};
