import path from "path";
import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";
import sizes from "@atomico/rollup-plugin-sizes";
import replace from "@rollup/plugin-replace";
import pluginImportCss from "./plugin-import-css";
import { mergeKeysArray } from "../utils";

let extensions = [".js", ".jsx", ".ts", ".tsx"];

export default function configPlugins(options) {
  let babelIncludes = ["node_modules/**"];
  // transform src into valid path to include in babel
  for (let src of options.src) {
    let { dir } = path.parse(src);

    dir = path.join(dir, "**");
    if (!babelIncludes.includes(dir)) {
      babelIncludes.push(dir);
    }
  }

  return {
    plugins: [
      pluginImportCss(options),
      resolve({
        extensions,
        dedupe: ["react", "react-dom"]
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
                      jsxPragma: options.jsx
                    }
              ],
              [
                "@babel/preset-env",
                {
                  targets: options.browsers,
                  modules: false,
                  exclude: [
                    "transform-typeof-symbol",
                    "transform-regenerator",
                    "transform-async-to-generator"
                  ]
                }
              ]
            ],
            plugins: [
              [
                "@babel/plugin-transform-react-jsx",
                {
                  pragma:
                    options.jsx == "react"
                      ? "React.createElement"
                      : options.jsx,
                  pragmaFrag:
                    options.jsxFragment == "react" || options.jsx == "react"
                      ? "React.Fragment"
                      : options.jsxFragment
                }
              ],
              ["@babel/plugin-proposal-optional-chaining"],
              ["@babel/plugin-syntax-nullish-coalescing-operator"],
              ["@babel/plugin-proposal-class-properties"]
            ]
          },
          options.babel
        )
      }),
      common(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      ...(options.watch
        ? []
        : options.minify
        ? [terser({ sourcemap: true })]
        : [sizes()])
    ]
  };
}
