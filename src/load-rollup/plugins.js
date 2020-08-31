import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import common from "@rollup/plugin-commonjs/dist";
import sucrase from "@rollup/plugin-sucrase";
import replace from "@rollup/plugin-replace";
import { pluginTerser } from "./plugin-terser";
import typescript from "@rollup/plugin-typescript";

let extensions = [".js", ".jsx", ".ts", ".tsx"];

/**
 *
 * @param {import("../load-options").options} options
 */
export function plugins(options) {
    let optionalPlugins = [];

    if (options.minify) {
        optionalPlugins.push(pluginTerser({ sourcemap: options.sourcemap }));
    }

    if (options.typescript) {
        optionalPlugins.push(typescript());
    }

    return [
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
            transforms: options.typescript ? ["jsx"] : ["jsx", "typescript"],
            jsxPragma: options.jsx,
            jsxFragmentPragma: options.jsxFragment,
            production: true,
        }),
        common(),
        ...optionalPlugins,
    ];
}
