import path from "path";
import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import { pluginImportCss } from "./plugin-import-css";
import { mergeKeysArray } from "../utils";
import sizes from "@atomico/rollup-plugin-sizes";

let extensions = [".js", ".jsx", ".ts", ".tsx"];

export function rollupPlugins(options) {
  let babelIncludes = ["node_modules/**"];
  let optionalPlugins = [];

  // transform src into valid path to include in babel
  for (let src of options.src) {
    let { dir } = path.parse(src);

    dir = path.join(dir, "**");
    if (!babelIncludes.includes(dir)) {
      babelIncludes.push(dir);
    }
  }

  if (options.minify) {
    optionalPlugins.push(terser({ sourcemap: options.sourcemap }));
  }

  if (options.sizes) {
    optionalPlugins.push(sizes());
  }

  return [
    pluginImportCss(options),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    resolve({
      extensions,
      dedupe: ["react", "react-dom"],
    }),
    babel({
      include: babelIncludes,
      extensions,
      ...mergeKeysArray(
        ["presets", "plugins"],
        {
          presets: [
            [
              "@babel/preset-typescript",
              options.jsx == "react"
                ? {}
                : {
                    jsxPragma: options.jsx,
                  },
            ],
            [
              "@babel/preset-env",
              {
                targets: options.browsers,
                modules: false,
                exclude: [
                  "transform-typeof-symbol",
                  "transform-regenerator",
                  "transform-async-to-generator",
                ],
              },
            ],
          ],
          plugins: [
            [
              "@babel/plugin-transform-react-jsx",
              {
                pragma:
                  options.jsx == "react" ? "React.createElement" : options.jsx,
                pragmaFrag:
                  options.jsxFragment == "react" || options.jsx == "react"
                    ? "React.Fragment"
                    : options.jsxFragment,
              },
            ],
            ["@babel/plugin-proposal-optional-chaining"],
            ["@babel/plugin-syntax-nullish-coalescing-operator"],
            ["@babel/plugin-proposal-class-properties"],
          ],
        },
        options.babel
      ),
    }),
    common(),
    ...optionalPlugins,
  ];
}
